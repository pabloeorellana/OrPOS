import React, { useState, useEffect } from 'react';
import { Typography, Grid, Paper, CircularProgress, Box } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import apiClient from '../api/axios';

const StatCard = ({ title, value, icon, color = 'primary.main' }) => (
    <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', height: '100%' }}>
        <Box sx={{ color, marginRight: 2 }}>{icon}</Box>
        <Box>
            <Typography variant="h6" color="text.secondary">{title}</Typography>
            <Typography variant="h4" fontWeight="bold">{value}</Typography>
        </Box>
    </Paper>
);

const SuperadminDashboardPage = () => {
    const [kpis, setKpis] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get('/superadmin/dashboard-kpis')
            .then(res => setKpis(res.data))
            .catch(err => {
                console.error("Error fetching superadmin KPIs:", err);
                // Aquí podrías mostrar una alerta de error
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    }

    if (!kpis) {
        return <Typography color="error">No se pudieron cargar las métricas del sistema.</Typography>;
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom>Dashboard Global del Sistema</Typography>
            <Grid container spacing={3} mt={1}>
                <Grid item xs={12} sm={6} md={4}>
                    <StatCard 
                        title="Negocios Activos" 
                        value={kpis.activeTenants} 
                        icon={<BusinessIcon sx={{ fontSize: 40 }}/>} 
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <StatCard 
                        title="Ingreso Mensual (MRR)" 
                        value={`$${kpis.monthlyRecurringRevenue.toFixed(2)}`} 
                        icon={<MonetizationOnIcon sx={{ fontSize: 40 }}/>}
                        color="success.main"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <StatCard 
                        title="Ventas Globales (Hoy)" 
                        value={`$${kpis.totalSalesToday.toFixed(2)}`} 
                        icon={<PointOfSaleIcon sx={{ fontSize: 40 }}/>} 
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <StatCard 
                        title="Total de Usuarios" 
                        value={kpis.totalUsers} 
                        icon={<PeopleIcon sx={{ fontSize: 40 }}/>} 
                    />
                </Grid>
                 <Grid item xs={12} sm={6} md={4}>
                    <StatCard 
                        title="Total de Productos" 
                        value={kpis.totalProducts} 
                        icon={<InventoryIcon sx={{ fontSize: 40 }}/>} 
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

export default SuperadminDashboardPage;