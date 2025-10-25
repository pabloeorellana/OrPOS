import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const PermissionProtectedRoute = ({ children, permission }) => {
    const { user } = useAuth();

    // Estado de carga: mientras el usuario aún no se ha cargado desde el token
    if (user === null) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Lógica de permisos
    const hasPermission = user.permissions.includes(permission);

    if (hasPermission) {
        return children; // El usuario tiene permiso, renderiza la página
    }

    // El usuario no tiene permiso, lo redirigimos.
    // Una buena práctica es redirigir al POS si es empleado, o al dashboard si es otro rol.
    const fallbackPath = user.role === 'empleado' ? '/pos' : '/dashboard';
    
    return <Navigate to={fallbackPath} replace />;
};

export default PermissionProtectedRoute;