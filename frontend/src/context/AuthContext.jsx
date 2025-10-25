import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSubdomain } from '../utils/subdomain.js';
// Reemplazamos la dependencia externa `jwt-decode` por una función pequeña
// para decodificar el payload del JWT. Esto evita problemas de interop
// entre diferentes formatos de export (named/default) que pueden causar
// errores con Vite: "does not provide an export named 'default'".
const decodeJwt = (token) => {
    try {
        if (!token) return null;
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = parts[1];
        // Add padding if necessary
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
        const json = atob(padded);
        return JSON.parse(json);
    } catch (e) {
        return null;
    }
};
import apiClient from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(undefined);
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [activeShift, setActiveShift] = useState(null);
    const [isImpersonating, setIsImpersonating] = useState(false);
    
    useEffect(() => {
        const checkAuth = async () => {
            if (token) {
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                localStorage.setItem('token', token);
                try {
                    console.debug('Auth check: token present, decoding...');
                    const decodedUser = decodeJwt(token);
                    console.debug('Auth check: decoded token payload:', decodedUser);
                    setUser(decodedUser);
                    setIsImpersonating(!!decodedUser?.impersonatorId);
                    if (!decodedUser.isSuperAdmin && !decodedUser.impersonatorId) {
                        try {
                            const response = await apiClient.get(`/shifts/current/${decodedUser.id}`);
                            setActiveShift(response.data);
                        } catch (error) {
                            setActiveShift(null);
                        }
                    }
                } catch (err) {
                    console.error('Error decoding token in AuthProvider:', err);
                    setUser(null);
                }
            } else {
                delete apiClient.defaults.headers.common['Authorization'];
                localStorage.removeItem('token');
                setUser(null);
            }
            setIsAuthLoading(false);
        };
        checkAuth();
    }, [token]);
    
    const navigate = useNavigate();

    const login = (userData, userToken) => {
        setToken(userToken);
    };

    const logout = () => {
        setToken(null);
        localStorage.removeItem('originalToken');
        setActiveShift(null);
        setIsImpersonating(false);
        // Redirigir inmediatamente al login correcto según el tenant detectado.
        const tenant = getSubdomain();
        if (tenant) {
            navigate(`/tenant-login?tenant=${encodeURIComponent(tenant)}`, { replace: true });
        } else {
            navigate('/login', { replace: true });
        }
    };
    
    const startShift = async (openingBalance) => {
        try {
            await apiClient.post('/shifts/start', { userId: user.id, openingBalance });
            const response = await apiClient.get(`/shifts/current/${user.id}`);
            setActiveShift(response.data);
            return true;
        } catch (error) {
            return false;
        }
    };
    
    const endShift = async (closingBalance) => {
        try {
            const response = await apiClient.post(`/shifts/end/${activeShift.id}`, { closingBalance });
            alert(`Turno cerrado. Diferencia: $${response.data.difference.toFixed(2)}`);
            setActiveShift(null);
            return true;
        } catch (error) {
            return false;
        }
    };

    const startImpersonation = (impersonationToken) => {
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