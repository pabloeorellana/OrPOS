import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { token } = useAuth();

    if (!token) {
        // Si no hay token, redirige al usuario a la página de login
        return <Navigate to="/login" />;
    }

    // Si hay un token, muestra el componente hijo (la página protegida)
    return children;
};

export default ProtectedRoute;