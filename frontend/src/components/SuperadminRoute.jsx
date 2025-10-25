import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const SuperadminRoute = ({ children }) => {
    const { user } = useAuth();

    // Mientras carga el usuario
    if (user === null) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Si es superadmin, muestra la página. Si no, redirige.
    return user.isSuperAdmin ? children : <Navigate to="/dashboard" replace />;
};

export default SuperadminRoute;