import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from './SnackbarContext';
import apiClient from '../api/axios';

const decodeJwt = (token) => {
    try {
        if (!token) return null;
        const payload = token.split('.')[1];
        const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(json);
    } catch (e) {
        return null;
    }
};

const AuthContext = createContext();

const getSession = () => {
    const sessionString = localStorage.getItem('session');
    if (!sessionString) return null;
    try { return JSON.parse(sessionString); }
    catch (e) { return null; }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(undefined);
    const [token, setToken] = useState(() => getSession()?.token || null);

    // Si al inicializar ya tenemos token en storage, aseguramos que apiClient tenga la cabecera
    // Esto evita condiciones de carrera donde componentes hijos hagan peticiones antes de que
    // el efecto que inyecta Authorization se ejecute.
    const initialToken = getSession()?.token;
    if (initialToken) {
        try {
            // setea de forma sincrónica en el cliente axios
            // eslint-disable-next-line no-param-reassign
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;
        } catch (e) {
            console.error('Error setting initial Authorization header:', e);
        }
    }
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [activeShift, setActiveShift] = useState(null);
    const [isImpersonating, setIsImpersonating] = useState(false);
    const [shiftLoading, setShiftLoading] = useState(false);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
    const navigate = useNavigate();
    const { showSnackbar } = useSnackbar();

    // crucial: siempre inyectar Authorization si token existe
    useEffect(() => {
        if (token) {
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete apiClient.defaults.headers.common['Authorization'];
        }
    }, [token]);

    // carga inicial de usuario + shift
    useEffect(() => {
        const checkAuth = async () => {
            if (!token) {
                setUser(null);
                setActiveShift(null);
                setUnreadMessagesCount(0);
                setIsAuthLoading(false);
                return;
            }

            const decodedUser = decodeJwt(token) || {};
            setUser(decodedUser);
            setIsImpersonating(!!decodedUser?.impersonatorId);

            // Cargar turno si el usuario tiene permiso de usar POS, con reintentos silenciosos
            if (Array.isArray(decodedUser?.permissions) && decodedUser.permissions.includes('pos:use')) {
                const loadShiftWithRetry = async () => {
                    const attempts = 3; // 1 intento inicial + 2 reintentos
                    const baseDelay = 200; // ms
                    for (let i = 1; i <= attempts; i++) {
                        try {
                            const response = await apiClient.get(`/shifts/current/${decodedUser.id}`);
                            setActiveShift(response.data || null);
                            return; // éxito: salimos
                        } catch (e) {
                            if (e.response && e.response.status === 404) {
                                // 404 real: no hay turno activo, no seguir reintentando
                                setActiveShift(null);
                                return;
                            }
                            // Otros errores: reintentar si quedan intentos
                            if (i < attempts) {
                                await new Promise(r => setTimeout(r, baseDelay * i)); // backoff lineal
                                continue;
                            }
                            console.error('AuthContext - Shift load failed after retries:', e);
                            // En último fallo no forzamos activeShift=null para evitar parpadeo si era intermitente
                        }
                    }
                };
                await loadShiftWithRetry();
            }

            // Cargar conteo de mensajes no leídos al iniciar sesión
            try {
                const { data } = await apiClient.get('/messages', { params: { box: 'inbox', unread: 'true' } });
                setUnreadMessagesCount(Array.isArray(data) ? data.length : 0);
            } catch (_) {
                setUnreadMessagesCount(0);
            }

            setIsAuthLoading(false);
        };
        checkAuth();
    }, [token]);

    // Exponer un pequeño helper para refrescar el contador desde otras pantallas
    const refreshUnreadMessages = async () => {
        if (!token) { setUnreadMessagesCount(0); return; }
        try {
            const { data } = await apiClient.get('/messages', { params: { box: 'inbox', unread: 'true' } });
            setUnreadMessagesCount(Array.isArray(data) ? data.length : 0);
        } catch (_) {/* noop */}
    };

    const login = (userToken) => {
        localStorage.setItem('session', JSON.stringify({ token: userToken }));
        setToken(userToken);
    };

    const logout = () => {
        localStorage.removeItem('session');
        localStorage.removeItem('originalToken');
        setToken(null);
        setActiveShift(null);
        setIsImpersonating(false);

        // Detectar tenant por ruta o subdominio para redirigir correctamente
        const detectTenant = () => {
            try {
                // 1. Subdominio (tienda1.orpos.site)
                const host = window.location.hostname;
                const hostParts = host.split('.');
                if (host.endsWith('.orpos.site') && hostParts.length >= 3) {
                    // Ej: tienda1.orpos.site -> tienda1
                    return hostParts[0];
                }
                // 2. Primer segmento de la ruta ( /tienda1/... )
                const reserved = ['login','admin','404-tenant','tenant-login','superadmin','plans','permissions-admin','superadmin-dashboard','dashboard','pos','sales-history','shifts-history','purchases','products','categories','suppliers','users','settings','audit','reports','permissions','business-settings'];
                const parts = window.location.pathname.split('/').filter(p => p);
                if (parts.length > 0 && !reserved.includes(parts[0])) return parts[0];
                return null;
            } catch (e) {
                return null;
            }
        };

        const tenant = detectTenant();
        if (tenant) {
            // Usa la ruta con prefijo /<tenant>/login para evitar que rutas wildcard nos envíen a /login
            navigate(`/${encodeURIComponent(tenant)}/login`, { replace: true });
        } else {
            navigate('/login', { replace: true });
        }
    };

    const startShift = async (balances) => {
        setShiftLoading(true);
        try {
            const postRes = await apiClient.post('/shifts/start', {
                userId: user.id,
                openingBalance: balances.openingBalance,
                openingVirtualBalance: balances.openingVirtualBalance
            });

            // Si el POST devuelve el turno creado, úsalo; si no, solicita el turno actual
            // El backend actualmente responde con { message, shiftId } al crear turno.
            // Siempre solicitamos el turno completo después del POST para asegurarnos de
            // tener la representación completa y evitar estados parciales en la UI.
            // Intentar obtener el turno actual varias veces con pequeño retardo para evitar
            // condiciones de carrera cuando el backend tarda en devolver el registro recién creado.
            let shiftData = null;
            const maxAttempts = 6;
            const delayMs = 200;
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    const response = await apiClient.get(`/shifts/current/${user.id}`);
                    shiftData = response.data;
                    break;
                } catch (err) {
                    if (attempt === maxAttempts) {
                        console.error('No se pudo obtener turno actual tras crear (último intento)');
                    } else {
                        // pequeño retardo antes del siguiente intento
                        await new Promise(r => setTimeout(r, delayMs));
                    }
                }
            }

            if (shiftData) {
                setActiveShift(shiftData);
            }

            return true;
        } catch (error) {
            console.error("Error al iniciar turno:", error);
            return false;
        } finally {
            setShiftLoading(false);
        }
    };

    const endShift = async (balances) => {
        try {
            const response = await apiClient.post(`/shifts/end/${activeShift.id}`, balances);
            return response.data;
        } catch (error) {
            console.error("Error al cerrar turno:", error);
            return null;
        }
    };

    const contextData = {
        user,
        token,
        isAuthLoading,
        activeShift,
        isImpersonating,
        login,
        logout,
        startShift,
        endShift,
        setActiveShift,
        shiftLoading,
        setShiftLoading
        ,
        unreadMessagesCount,
        setUnreadMessagesCount,
        refreshUnreadMessages
    };

    return <AuthContext.Provider value={contextData}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
