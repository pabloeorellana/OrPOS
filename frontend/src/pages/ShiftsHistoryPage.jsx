import React, { useState, useEffect, Fragment } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Collapse, Chip, Grid } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import apiClient from '../api/axios';

const formatDuration = (start, end) => {
    if (!start || !end) return 'N/A';
    const durationMs = new Date(end) - new Date(start);
    if (durationMs < 0) return 'N/A';
    const hours = Math.floor(durationMs / 3600000);
    const minutes = Math.floor((durationMs % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
};

// --- PANEL DE DETALLES REORGANIZADO ---
const DetailPanel = ({ shift }) => {
    const totalSales = (parseFloat(shift.total_cash_sales) || 0) + (parseFloat(shift.total_card_sales) || 0) + (parseFloat(shift.total_transfer_sales) || 0) + (parseFloat(shift.total_other_sales) || 0);
    const averageSale = shift.transaction_count > 0 ? totalSales / shift.transaction_count : 0;

    return (
        <Box sx={{ margin: 1, p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom component="div">
                Resumen Detallado del Turno
            </Typography>
            <Grid container spacing={2}>
                {/* Columna 1: Datos del Turno */}
                <Grid item xs={12} md={4}>
                    <Typography variant="body2"><strong>Inicio:</strong> {new Date(shift.start_time).toLocaleString('es-AR')}</Typography>
                    <Typography variant="body2"><strong>Fin:</strong> {new Date(shift.end_time).toLocaleString('es-AR')}</Typography>
                    <Typography variant="body2"><strong>Duración:</strong> {formatDuration(shift.start_time, shift.end_time)}</Typography>
                    <Typography variant="body2"><strong>N° de Transacciones:</strong> {shift.transaction_count || 0}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}><strong>Venta Promedio:</strong> ${averageSale.toFixed(2)}</Typography>
                </Grid>
                {/* Columna 2: Resumen de Efectivo */}
                <Grid item xs={12} md={4}>
                    <Typography variant="body2"><strong>Apertura de Caja:</strong> ${parseFloat(shift.opening_balance || 0).toFixed(2)}</Typography>
                    <Typography variant="body2"><strong>Ventas en Efectivo:</strong> ${parseFloat(shift.total_cash_sales || 0).toFixed(2)}</Typography>
                    <Typography color="error"><strong>Devoluciones en Efectivo:</strong> -${parseFloat(shift.total_cash_returns || 0).toFixed(2)}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main', mt: 1 }}>
                        <strong>Esperado en Efectivo:</strong> ${parseFloat(shift.expected_balance || 0).toFixed(2)}
                    </Typography>
                </Grid>
                {/* Columna 3: Otros Medios de Pago */}
                <Grid item xs={12} md={4}>
                    <Typography variant="body2"><strong>Ventas con Tarjeta:</strong> ${parseFloat(shift.total_card_sales || 0).toFixed(2)}</Typography>
                    <Typography variant="body2"><strong>Ventas por Transferencia:</strong> ${parseFloat(shift.total_transfer_sales || 0).toFixed(2)}</Typography>
                    <Typography variant="body2"><strong>Ventas con QR:</strong> ${parseFloat(shift.total_other_sales || 0).toFixed(2)}</Typography>
                </Grid>
            </Grid>
        </Box>
    );
};

const Row = ({ row }) => {
    const [open, setOpen] = useState(false);
    return (
        <Fragment>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell>
                    <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                {/* --- FECHA DE APERTURA EN LUGAR DE CIERRE --- */}
                <TableCell>{new Date(row.start_time).toLocaleDateString('es-AR')}</TableCell>
                <TableCell>{row.username}</TableCell>
                <TableCell align="right">${parseFloat(row.closing_balance || 0).toFixed(2)}</TableCell>
                <TableCell align="right">
                    <Chip 
                        label={`$${parseFloat(row.difference || 0).toFixed(2)}`} 
                        color={row.difference < 0 ? 'error' : (row.difference > 0 ? 'success' : 'default')}
                        size="small"
                    />
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ padding: 0 }} colSpan={5}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <DetailPanel shift={row} />
                    </Collapse>
                </TableCell>
            </TableRow>
        </Fragment>
    );
};

const ShiftsHistoryPage = () => {
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get('/shifts')
            .then(res => setShifts(res.data))
            .catch(err => {
                if (err.response?.status === 403) alert("No tienes permiso para ver esta sección.");
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <Box>
            <Typography variant="h4" gutterBottom>Historial y Arqueo de Cajas</Typography>
            <TableContainer component={Paper}>
                <Table aria-label="collapsible table">
                    <TableHead>
                        <TableRow>
                            <TableCell />
                            {/* --- TÍTULO DE COLUMNA CORREGIDO --- */}
                            <TableCell>Fecha</TableCell>
                            <TableCell>Empleado</TableCell>
                            <TableCell align="right">Monto Contado (Cierre)</TableCell>
                            <TableCell align="right">Diferencia (Faltante/Sobrante)</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center">Cargando...</TableCell>
                            </TableRow>
                        ) : (
                            shifts.map((row) => (<Row key={row.id} row={row} />))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default ShiftsHistoryPage;