import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';
import { getTenantFromPath } from '../utils/tenantHelper';

const PermissionProtectedRoute = ({ children, permission }) => {
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

    // Si no hay usuario, redirigir al login correspondiente
    if (!user) {
        const tenant = getTenantFromPath();
        const reserved = new Set(['tenant-login', 'login', 'superadmin', 'plans', 'permissions-admin']);
        if (tenant && !reserved.has(tenant)) {
            return <Navigate to={`/tenant-login?tenant=${encodeURIComponent(tenant)}`} state={{ from: location }} replace />;
        }
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Lógica de permisos con tolerancia
    const perms = Array.isArray(user.permissions) ? user.permissions : [];
    const hasPermission = perms.includes(permission);

    if (hasPermission) {
        return children; // El usuario tiene permiso, renderiza la página
    }

    // El usuario no tiene permiso, lo redirigimos.
    const tenant = getTenantFromPath();
    const fallbackSegment = user.role === 'empleado' ? 'pos' : 'dashboard';
    const fallbackPath = tenant ? `/${tenant}/${fallbackSegment}` : `/${fallbackSegment}`;

    return <Navigate to={fallbackPath} replace />;
};

export default PermissionProtectedRoute;