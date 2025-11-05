import React, { createContext, useContext, useEffect, useState } from 'react';
import { useParams, useNavigate, Outlet } from 'react-router-dom';
import apiClient from '../api/axios';
import { Box, CircularProgress } from '@mui/material';
import { getTenantFromPath } from '../utils/tenantHelper';

// Contexto para compartir la info del tenant
export const TenantContext = createContext(null);
export const useTenant = () => useContext(TenantContext);

const TenantWrapper = () => {
    const { tenantPath } = useParams();
    const navigate = useNavigate();
    const [tenantInfo, setTenantInfo] = useState(undefined); // undefined: cargando


    useEffect(() => {
        // Solo validar si tenantPath es realmente un tenant válido
        const realTenant = getTenantFromPath();
        if (!realTenant) {
            // Si no es un tenant válido, no intentes validar ni mostrar error, simplemente renderiza children
            setTenantInfo(null);
            return;
        }
        apiClient.get(`/public/tenant-check/${tenantPath}`)
            .then(res => setTenantInfo(res.data))
            .catch(() => navigate('/404-tenant', { replace: true }));
    }, [tenantPath, navigate]);

    if (tenantInfo === undefined) {
        return <Box sx={{ display:'flex', justifyContent:'center', p:4 }}><CircularProgress /></Box>;
    }

    // Si no hay tenant real, simplemente renderiza el Outlet sin contexto
    if (tenantInfo === null) {
        return <Outlet />;
    }

    // El <Outlet> renderizará las rutas hijas definidas en App.jsx (Login o AppLayout)
    return (
        <TenantContext.Provider value={tenantInfo}>
            <Outlet />
        </TenantContext.Provider>
    );
};
export default TenantWrapper;