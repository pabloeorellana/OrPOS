import React, { useState, useEffect } from 'react';
import { Typography, Grid, Paper, Table, TableBody, TableCell, TableHead, TableRow, TableContainer, CircularProgress, Box, Alert, Collapse, List, ListItem, ListItemText } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import apiClient from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Importa los iconos de Material-UI que vamos a usar
import MonetizationOnOutlinedIcon from '@mui/icons-material/MonetizationOnOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import ProductionQuantityLimitsOutlinedIcon from '@mui/icons-material/ProductionQuantityLimitsOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

// Importa nuestro nuevo componente de tarjeta de estadísticas
import StatCard from '../components/StatCard';

const DashboardPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [kpis, setKpis] = useState(null);
    const [salesData, setSalesData] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [lowStockOpen, setLowStockOpen] = useState(false);
    const [topProductsOpen, setTopProductsOpen] = useState(false);

    useEffect(() => {
        if (user === undefined) {
            setLoading(true); return;
        }
        if (!user) { setLoading(false); return; }

        if (user.isSuperAdmin) {
            navigate('/superadmin-dashboard', { replace: true });
            return;
        }
        if (user.role === 'empleado') {
            const tenant = (window.location.pathname.split('/').filter(Boolean)[0]) || null;
            navigate(tenant ? `/${tenant}/pos` : '/pos', { replace: true });
            return;
        }

        if (user.permissions && user.permissions.includes('dashboard:view')) {
            setLoading(true);
            setError('');
            Promise.all([
                apiClient.get('/reports/dashboard-kpis'),
                apiClient.get('/reports/sales-over-time'),
                apiClient.get('/reports/top-products'),
                apiClient.get('/reports/low-stock-products'),
            ]).then(([kpisRes, salesRes, topProductsRes, lowStockRes]) => {
                setKpis(kpisRes.data);
                const formattedSales = salesRes.data.map(d => ({...d, date: new Date(d.date).toLocaleDateString('es-ES', { weekday: 'short' })}));
                setSalesData(formattedSales);
                setTopProducts(topProductsRes.data);
                setLowStockProducts(lowStockRes.data);
            }).catch(err => {
                setError('No se pudieron cargar los datos del dashboard.');
            }).finally(() => {
                setLoading(false);
            });
        } else {
            setError('No tienes permiso para ver esta sección.');
            setLoading(false);
        }
    }, [user, navigate]);

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
    
    // -- El Nuevo Renderizado del Dashboard --
    return (
        <Box>
            <Typography variant="h4" gutterBottom>Dashboard</Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={6}>
                    <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                        <StatCard 
                            title="Ventas del Día"
                            value={`$${kpis.totalSalesToday ? parseFloat(kpis.totalSalesToday).toFixed(2) : '0.00'}`}
                            icon={MonetizationOnOutlinedIcon}
                            color="#556ee6" // Color azul de la plantilla
                        />
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={6}>
                    <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                        <StatCard 
                            title="Transacciones Hoy"
                            value={kpis.transactionsToday || 0}
                            icon={ReceiptLongOutlinedIcon}
                            color="#34c38f" // Color verde
                        />
                    </Paper>
                </Grid>
            </Grid>

            <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={12} md={6}>
                     <Paper elevation={2} sx={{ p: 2, borderRadius: 2, cursor: 'pointer' }} onClick={() => setLowStockOpen(!lowStockOpen)}>
                        <StatCard 
                            title="Bajos de Stock (< 5)"
                            value={kpis.lowStockProducts || 0}
                            icon={ProductionQuantityLimitsOutlinedIcon}
                            color="#f46a6a" // Color rojo
                        />
                        <Collapse in={lowStockOpen} timeout="auto" unmountOnExit>
                            <List dense>
                                {lowStockProducts.slice(0, 3).map(p => (
                                    <ListItem key={p.id}>
                                        <ListItemText primary={p.name} secondary={`Stock: ${p.stock}`} />
                                    </ListItem>
                                ))}
                            </List>
                        </Collapse>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 2, borderRadius: 2, cursor: 'pointer' }} onClick={() => setTopProductsOpen(!topProductsOpen)}>
                        <StatCard 
                            title="Productos Más Vendidos"
                            value={topProducts.length > 0 ? topProducts[0].name : 'N/A'}
                            icon={TrendingUpIcon}
                            color="#34c38f" // Color verde
                        />
                        <Collapse in={topProductsOpen} timeout="auto" unmountOnExit>
                            <List dense>
                                {topProducts.slice(0, 3).map((p, i) => (
                                    <ListItem key={i}>
                                        <ListItemText primary={p.name} secondary={`Vendido: ${p.total_sold}`} />
                                    </ListItem>
                                ))}
                            </List>
                        </Collapse>
                    </Paper>
                </Grid>
            </Grid>

            <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} md={12}>
                    <Paper elevation={2} sx={{ p: 2, borderRadius: 2, height: 350 }}>
                        <Typography variant="h6" gutterBottom>Ventas Mensuales (Últimos 7 días)</Typography>
                        <ResponsiveContainer>
                            <BarChart data={salesData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip formatter={(value) => `$${parseFloat(value).toFixed(2)}`} />
                                <Bar dataKey="total" fill="#556ee6" name="Ventas" barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};
export default DashboardPage;