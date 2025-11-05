import React, { useState, useEffect } from 'react';
import { Typography, Grid, Paper, Table, TableBody, TableCell, TableHead, TableRow, TableContainer, CircularProgress, Box, Alert } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiClient from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const DashboardPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [kpis, setKpis] = useState(null);
    const [salesData, setSalesData] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // Solo ejecutamos la lógica si 'user' ya está definido (no es 'undefined')
        if (user === undefined) {
            setLoading(true); // Muestra el spinner si el usuario aún se está cargando
            return;
        }

        // Si el usuario es null (no logueado), no debería llegar aquí, pero por si acaso.
        if (!user) {
            setLoading(false);
            return;
        }

        // Lógica de redirección por rol
        if (user.isSuperAdmin) {
            navigate('/superadmin-dashboard', { replace: true });
            return;
        }
        if (user.role === 'empleado') {
            // Mantener tenant en path si existe
            const tenant = (window.location.pathname.split('/').filter(Boolean)[0]) || null;
            navigate(tenant ? `/${tenant}/pos` : '/pos', { replace: true });
            return;
        }

        // Lógica de fetch de datos
        if (user.permissions && user.permissions.includes('dashboard:view')) {
            setLoading(true);
            setError('');
            Promise.all([
                apiClient.get('/reports/dashboard-kpis'),
                apiClient.get('/reports/sales-over-time'),
                apiClient.get('/reports/top-products'),
            ]).then(([kpisRes, salesRes, topProductsRes]) => {
                setKpis(kpisRes.data);
                const formattedSales = salesRes.data.map(d => ({...d, date: new Date(d.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}));
                setSalesData(formattedSales);
                setTopProducts(topProductsRes.data);
            }).catch(err => {
                console.error("Error al cargar los datos del dashboard:", err);
                setError('No se pudieron cargar los datos. Revisa la conexión con el servidor.');
            }).finally(() => {
                setLoading(false);
            });
        } else {
            setError('No tienes permiso para ver esta sección.');
            setLoading(false);
        }
    }, [user, navigate, location.pathname]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }
    
    if(!kpis) {
        return <Typography>No hay datos disponibles para el dashboard.</Typography>;
    }
    
    return (
        <Grid container spacing={3}>
            <Grid item xs={12} md={4}><Paper sx={{ p: 2, height: 140 }}><Typography variant="h6" color="primary">Ventas del Día</Typography><Typography variant="h4">${kpis.totalSalesToday ? parseFloat(kpis.totalSalesToday).toFixed(2) : '0.00'}</Typography></Paper></Grid>
            <Grid item xs={12} md={4}><Paper sx={{ p: 2, height: 140 }}><Typography variant="h6" color="primary">Transacciones Hoy</Typography><Typography variant="h4">{kpis.transactionsToday || 0}</Typography></Paper></Grid>
            <Grid item xs={12} md={4}><Paper sx={{ p: 2, height: 140, bgcolor: kpis.lowStockProducts > 0 ? '#fffde7' : 'inherit' }}><Typography variant="h6" color="primary">Bajos de Stock</Typography><Typography variant="h4" color={kpis.lowStockProducts > 0 ? 'warning.main' : 'inherit'}>{kpis.lowStockProducts || 0}</Typography></Paper></Grid>
            <Grid item xs={12} lg={8}><Paper sx={{ p: 2, height: 300 }}><Typography variant="h6" color="primary">Ventas (Últimos 7 Días)</Typography><ResponsiveContainer><BarChart data={salesData}><CartesianGrid /><XAxis dataKey="date" /><YAxis /><Tooltip formatter={(v) => `$${parseFloat(v).toFixed(2)}`} /><Legend /><Bar dataKey="total" fill="#1976d2" name="Ventas" /></BarChart></ResponsiveContainer></Paper></Grid>
            <Grid item xs={12} lg={4}><Paper sx={{ p: 2, height: 300 }}><Typography variant="h6" color="primary">Productos Más Vendidos</Typography><TableContainer><Table size="small"><TableHead><TableRow><TableCell>Producto</TableCell><TableCell align="right">Unidades</TableCell></TableRow></TableHead><TableBody>{topProducts.map((p, i) => (<TableRow key={i}><TableCell>{p.name}</TableCell><TableCell align="right">{p.total_sold}</TableCell></TableRow>))}</TableBody></Table></TableContainer></Paper></Grid>
        </Grid>
    );
};
export default DashboardPage;