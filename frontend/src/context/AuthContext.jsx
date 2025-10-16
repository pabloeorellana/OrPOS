import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [activeShift, setActiveShift] = useState(null);
    const navigate = useNavigate();

    const checkForActiveShift = async (userId) => {
        try {
            const response = await apiClient.get(`/shifts/current/${userId}`);
            setActiveShift(response.data);
        } catch (error) { setActiveShift(null); }
    };

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            try {
                const decodedUser = jwtDecode(storedToken);
                if (decodedUser.exp * 1000 < Date.now()) {
                    logout();
                } else {
                    setUser(decodedUser);
                    checkForActiveShift(decodedUser.id);
                }
            } catch (error) { logout(); }
        }
    }, []);

    const login = (userData, userToken) => {
        localStorage.setItem('token', userToken);
        const decodedUser = jwtDecode(userToken);
        setUser(decodedUser);
        setToken(userToken);
        checkForActiveShift(decodedUser.id);
        navigate('/dashboard');
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null); setToken(null); setActiveShift(null);
        navigate('/login');
    };
    
    const startShift = async (openingBalance) => {
        try {
            await apiClient.post('/shifts/start', { userId: user.id, openingBalance });
            await checkForActiveShift(user.id);
            return true;
        } catch (error) { return false; }
    };
    
    const endShift = async (closingBalance) => {
        try {
            const response = await apiClient.post(`/shifts/end/${activeShift.id}`, { closingBalance });
            alert(`Turno cerrado. Diferencia: $${response.data.difference.toFixed(2)}`);
            setActiveShift(null);
            return true;
        } catch (error) { return false; }
    };

    const contextData = { user, token, activeShift, login, logout, startShift, endShift };

    return ( <AuthContext.Provider value={contextData}>{children}</AuthContext.Provider> );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;