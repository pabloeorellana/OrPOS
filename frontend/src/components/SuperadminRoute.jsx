import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const SuperadminRoute = ({ children }) => {
    const { user, isAuthLoading } = useAuth();
    const location = useLocation();

    // Esperar a que termine la carga de autenticación
    if (isAuthLoading || user === undefined) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Si no hay usuario o no es superadmin, redirigir a login
    if (!user || !user.isSuperAdmin) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default SuperadminRoute;