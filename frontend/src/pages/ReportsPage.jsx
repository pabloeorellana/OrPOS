import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Grid, Autocomplete, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import apiClient from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ReportsPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [products, setProducts] = useState([]);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);

    // --- GUARDA DE RUTA Y PERMISOS ---

    useEffect(() => {
        const fetchFilterData = async () => {
            // Solo intentar cargar datos si el usuario tiene el permiso.
            if (user && user.permissions.includes('reports:view')) {
                try {
                    const [employeesRes, productsRes] = await Promise.all([
                        apiClient.get('/users'),
                        apiClient.get('/products')
                    ]);
                    setEmployees(employeesRes.data);
                    setProducts(productsRes.data);
                } catch (error) {
                    console.error("Error al cargar datos para filtros:", error);
                }
            }
        };
        fetchFilterData();
    }, [user]);

    const handleGenerateReport = async () => {
        setLoading(true);
        setReportData(null);
        try {
            const payload = {
                startDate,
                endDate,
                employeeId: selectedEmployee ? selectedEmployee.id : null,
                productId: selectedProduct ? selectedProduct.id : null,
            };
            const response = await apiClient.post('/reports/sales-by-date', payload);
            setReportData(response.data);
        } catch (error) {
            console.error("Error al generar el reporte:", error);
            alert("No se pudo generar el reporte.");
        } finally {
            setLoading(false);
        }
    };

    // Si el usuario no tiene el permiso, no renderizamos nada (será redirigido).
    if (!user || !user.permissions.includes('reports:view')) {
        return null;
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom>Reporte de Ventas</Typography>
            
            <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <DatePicker label="Fecha de Inicio" value={startDate} onChange={(val) => setStartDate(val)} sx={{ minWidth: 180 }} />
                    <DatePicker label="Fecha de Fin" value={endDate} onChange={(val) => setEndDate(val)} sx={{ minWidth: 180 }} />
                    <Autocomplete
                        sx={{ flex: 1 }}
                        options={employees}
                        getOptionLabel={(option) => option.username}
                        value={selectedEmployee}
                        onChange={(e, val) => setSelectedEmployee(val)}
                        renderInput={(params) => <TextField {...params} label="Filtrar por Empleado" />}
                    />
                    <Autocomplete
                        sx={{ flex: 1 }}
                        options={products}
                        getOptionLabel={(option) => option.name}
                        value={selectedProduct}
                        onChange={(e, val) => setSelectedProduct(val)}
                        renderInput={(params) => <TextField {...params} label="Filtrar por Producto" />}
                    />
                    <Button variant="contained" onClick={handleGenerateReport} disabled={loading} sx={{ height: '56px', px: 4 }}>
                        {loading ? '...' : 'Filtrar'}
                    </Button>
                </Box>
            </Paper>

            {reportData && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2, height: '100%' }}>
                            <Typography variant="h6" gutterBottom>Resumen del Período</Typography>
                            <Typography sx={{ mb: 2, fontWeight: 'bold' }}>
                                Total Vendido: ${reportData.summary.totalGeneral.toFixed(2)}
                            </Typography>
                            <Typography><strong>Desglose por Pago:</strong></Typography>
                            {Object.keys(reportData.summary.totalsByPayment).length > 0 ? (
                                Object.entries(reportData.summary.totalsByPayment).map(([method, total]) => (
                                    <Typography key={method} variant="body2" sx={{ ml: 1 }}>- {method}: ${total.toFixed(2)}</Typography>
                                ))
                            ) : (
                                <Typography variant="body2" sx={{ ml: 1 }}>Sin pagos registrados.</Typography>
                            )}
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={8}>
                        <TableContainer component={Paper}>
                            <Table size="small" aria-label="reporte de ventas">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>ID</TableCell><TableCell>Fecha</TableCell><TableCell>Empleado</TableCell>
                                        <TableCell>Items</TableCell><TableCell>Medio de Pago</TableCell><TableCell align="right">Total</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {reportData.sales.map((sale) => (
                                        <TableRow key={sale.id}>
                                            <TableCell>{sale.id}</TableCell>
                                            <TableCell>{new Date(sale.sale_date).toLocaleString('es-AR')}</TableCell>
                                            <TableCell>{sale.employee_name}</TableCell>
                                            <TableCell align="center">{sale.items_count}</TableCell>
                                            <TableCell>{sale.payment_method}</TableCell>
                                            <TableCell align="right">${parseFloat(sale.total_amount).toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

export default ReportsPage;