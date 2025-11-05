import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTenantFromPath } from '../utils/tenantHelper'; // Importar helper

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

import apiClient from '../api/axios';

const AuthContext = createContext();

// --- Helper para la sesión ---
const getSession = () => {
    const sessionString = localStorage.getItem('session');
    if (!sessionString) return null;
    try {
        return JSON.parse(sessionString);
    } catch (e) {
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(undefined);
    // El estado 'token' ahora se inicializa desde el objeto de sesión
    const [token, setToken] = useState(() => getSession()?.token || null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [activeShift, setActiveShift] = useState(null);
    const [isImpersonating, setIsImpersonating] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            const session = getSession();
            const requiredContext = getTenantFromPath() || 'superadmin';

            // Si hay una sesión, pero el contexto no coincide, forzamos el logout.
            if (session && session.context !== requiredContext) {
                console.warn(`Context mismatch: required '${requiredContext}', found '${session.context}'. Logging out.`);
                logout(); // logout() se encarga de limpiar todo
                setIsAuthLoading(false);
                return;
            }

            // Si la sesión es válida para el contexto actual (o no hay sesión)
            if (token) {
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                const decodedUser = decodeJwt(token) || {};
                const normalizedUser = {
                    ...decodedUser,
                    permissions: Array.isArray(decodedUser?.permissions) ? decodedUser.permissions : [],
                };
                setUser(normalizedUser);
                setIsImpersonating(!!normalizedUser?.impersonatorId);

                if (!decodedUser.isSuperAdmin && !decodedUser.impersonatorId) {
                    try {
                        const response = await apiClient.get(`/shifts/current/${decodedUser.id}`);
                        setActiveShift(response.data);
                    } catch (error) {
                        setActiveShift(null);
                    }
                }
            } else {
                delete apiClient.defaults.headers.common['Authorization'];
                setUser(null);
            }
            setIsAuthLoading(false);
        };
        checkAuth();
    }, [token]); // Dependemos de 'token' para re-evaluar

    const login = (userToken, context) => {
        const session = { token: userToken, context };
        localStorage.setItem('session', JSON.stringify(session));
        setToken(userToken);
    };

    const logout = () => {
        localStorage.removeItem('session'); // Limpiar el objeto de sesión
        localStorage.removeItem('originalToken');
        setToken(null);
        setActiveShift(null);
        setIsImpersonating(false);
        const requiredContext = getTenantFromPath();
        if (requiredContext) {
            navigate(`/${requiredContext}/login`, { replace: true });
        } else {
            navigate('/login', { replace: true });
        }
    };
    
    const startShift = async (balances) => { // Acepta un objeto de saldos
        try {
            await apiClient.post('/shifts/start', { 
                userId: user.id, 
                openingBalance: balances.openingBalance, 
                openingVirtualBalance: balances.openingVirtualBalance 
            });
            const response = await apiClient.get(`/shifts/current/${user.id}`);
            setActiveShift(response.data);
            return true;
        } catch (error) {
            console.error("Error al iniciar turno:", error);
            return false;
        }
    };
    
    const endShift = async (balances) => { // Acepta objeto de saldos de cierre
        try {
            const response = await apiClient.post(`/shifts/end/${activeShift.id}`, balances);
            
            // Crear un mensaje de alerta detallado
            const { cashDetails, virtualDetails } = response.data;
            const summaryMessage = `
                Turno Cerrado Exitosamente
                ----------------------------------
                RESUMEN DE EFECTIVO:
                - Saldo Inicial: $${cashDetails.openingBalance.toFixed(2)}
                - Ventas en Efectivo: $${cashDetails.totalCashSales.toFixed(2)}
                - Devoluciones: -$${cashDetails.totalCashReturns.toFixed(2)}
                - Saldo Esperado: $${cashDetails.expectedInCash.toFixed(2)}
                - Saldo Real: $${cashDetails.closingBalance.toFixed(2)}
                - Diferencia: $${cashDetails.difference.toFixed(2)}
                ----------------------------------
                RESUMEN VIRTUAL:
                - Saldo Inicial: $${virtualDetails.openingVirtualBalance.toFixed(2)}
                - Ventas Virtuales: $${virtualDetails.totalVirtualSales.toFixed(2)}
                - Saldo Esperado: $${virtualDetails.expectedVirtualBalance.toFixed(2)}
                - Saldo Declarado: $${virtualDetails.closingVirtualBalance.toFixed(2)}
                - Diferencia: $${virtualDetails.virtualDifference.toFixed(2)}
            `;
            alert(summaryMessage);

            setActiveShift(null);
            return response.data; // Devolver todos los datos para el modal
        } catch (error) {
            console.error("Error al cerrar turno:", error);
            return null; // Devolver null en caso de error
        }
    };

    const startImpersonation = (impersonationToken) => {
        // La impersonalización no necesita contexto, ya que es temporal y controlada
        localStorage.setItem('originalToken', token);
        setToken(impersonationToken);
    };

    const exitImpersonation = () => {
        const originalToken = localStorage.getItem('originalToken');
        if (originalToken) {
            localStorage.removeItem('originalToken');
            setToken(originalToken);
        }
    };

    const contextData = { user, token, isAuthLoading, activeShift, isImpersonating, login, logout, startShift, endShift, startImpersonation, exitImpersonation };

    return <AuthContext.Provider value={contextData}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;