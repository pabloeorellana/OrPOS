import React, { useState, useEffect } from 'react';
import { Typography, Grid, Paper, Table, TableBody, TableCell, TableHead, TableRow, TableContainer } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiClient from '../api/axios'; // <-- Corregido

const DashboardPage = () => {
    const [kpis, setKpis] = useState({ totalSalesToday: 0, transactionsToday: 0, lowStockProducts: 0 });
    const [salesData, setSalesData] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [kpisRes, salesRes, topProductsRes] = await Promise.all([
                    apiClient.get('/reports/dashboard-kpis'), // <-- Corregido
                    apiClient.get('/reports/sales-over-time'), // <-- Corregido
                    apiClient.get('/reports/top-products'), // <-- Corregido
                ]);
                setKpis(kpisRes.data);
                const formattedSales = salesRes.data.map(d => ({...d, date: new Date(d.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}));
                setSalesData(formattedSales);
                setTopProducts(topProductsRes.data);
            } catch (error) {
                console.error("Error al cargar los datos del dashboard:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <Typography>Cargando datos del dashboard...</Typography>;

    return (
        <Grid container spacing={3}>
            <Grid item xs={12} md={4}><Paper sx={{ p: 2, height: 140 }}><Typography variant="h6" color="primary">Ventas del Día</Typography><Typography variant="h4">${parseFloat(kpis.totalSalesToday).toFixed(2)}</Typography></Paper></Grid>
            <Grid item xs={12} md={4}><Paper sx={{ p: 2, height: 140 }}><Typography variant="h6" color="primary">Transacciones Hoy</Typography><Typography variant="h4">{kpis.transactionsToday}</Typography></Paper></Grid>
            <Grid item xs={12} md={4}><Paper sx={{ p: 2, height: 140, bgcolor: kpis.lowStockProducts > 0 ? '#fffde7' : 'inherit' }}><Typography variant="h6" color="primary">Bajos de Stock</Typography><Typography variant="h4" color={kpis.lowStockProducts > 0 ? 'warning.main' : 'inherit'}>{kpis.lowStockProducts}</Typography></Paper></Grid>
            <Grid item xs={12} lg={8}><Paper sx={{ p: 2, height: 300 }}><Typography variant="h6" color="primary">Ventas (Últimos 7 Días)</Typography><ResponsiveContainer><BarChart data={salesData}><CartesianGrid /><XAxis dataKey="date" /><YAxis /><Tooltip formatter={(v) => `$${parseFloat(v).toFixed(2)}`} /><Legend /><Bar dataKey="total" fill="#1976d2" name="Ventas" /></BarChart></ResponsiveContainer></Paper></Grid>
            <Grid item xs={12} lg={4}><Paper sx={{ p: 2, height: 300 }}><Typography variant="h6" color="primary">Productos Más Vendidos</Typography><TableContainer><Table size="small"><TableHead><TableRow><TableCell>Producto</TableCell><TableCell align="right">Unidades</TableCell></TableRow></TableHead><TableBody>{topProducts.map((p, i) => (<TableRow key={i}><TableCell>{p.name}</TableCell><TableCell align="right">{p.total_sold}</TableCell></TableRow>))}</TableBody></Table></TableContainer></Paper></Grid>
        </Grid>
    );
};

export default DashboardPage;