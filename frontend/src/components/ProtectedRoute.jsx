import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress } from '@mui/material';
import { getTenantFromPath } from '../utils/tenantHelper.js';

const ProtectedRoute = ({ children }) => {
    const { user, isAuthLoading } = useAuth();
    const location = useLocation();

    // Mientras el contexto está verificando el token inicial, mostramos un spinner.
    if (isAuthLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Si la carga terminó y no hay usuario, redirigimos al login correcto.
    // Si hay un subdominio detectado (o guardado en sessionStorage en dev),
    // redirigimos al login del tenant; si no, al login del superadmin.
    if (!user) {
        const tenant = getTenantFromPath();

        // Evitar tratar rutas reservadas como si fueran tenants. Esto evita bucles
        // al visitar /tenant-login o /login donde el primer segmento no es un tenant real.
        const reserved = new Set(['tenant-login', 'login', 'superadmin', 'plans', 'permissions-admin']);
        if (tenant && !reserved.has(tenant)) {
            return <Navigate to={`/tenant-login?tenant=${encodeURIComponent(tenant)}`} state={{ from: location }} replace />;
        }

        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Si hay usuario, permitimos el paso y renderizamos el layout.
    return children;
};

export default ProtectedRoute;