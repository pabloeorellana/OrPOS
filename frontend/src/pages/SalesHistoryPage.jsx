import React, { useState, useEffect, Fragment } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Collapse, Chip, Button } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ReplayIcon from '@mui/icons-material/Replay';
import apiClient from '../api/axios';
import ReturnModal from '../components/ReturnModal';

const Row = ({ row, onReturnClick }) => {
    const [open, setOpen] = useState(false);
    const [details, setDetails] = useState({ saleItems: [], returnItems: [] });
    const [loading, setLoading] = useState(false);

    const fetchDetails = () => {
        if (!open) {
            setLoading(true);
            apiClient.get(`/sales/${row.id}`)
                .then(res => { 
                    setDetails(res.data); 
                    setLoading(false); 
                })
                .catch(() => setLoading(false));
        }
        setOpen(!open);
    };

    const totalReturned = parseFloat(row.total_returned_amount) || 0;
    const netAmount = parseFloat(row.total_amount) - totalReturned;

    return (
        <Fragment>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell><IconButton aria-label="expand row" size="small" onClick={fetchDetails}>{open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}</IconButton></TableCell>
                <TableCell>{row.id}</TableCell>
                <TableCell>{new Date(row.sale_date).toLocaleString('es-AR')}</TableCell>
                <TableCell>{row.username}</TableCell>
                <TableCell><Chip label={row.payment_method} size="small" /></TableCell>
                <TableCell align="right">
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <Typography variant="body1" sx={row.return_status !== 'none' ? { textDecoration: 'line-through', color: 'text.secondary' } : {}}>
                            ${parseFloat(row.total_amount).toFixed(2)}
                        </Typography>
                        {row.return_status !== 'none' && (
                            <Typography variant="body1" color="text.primary" fontWeight="bold">
                                ${netAmount.toFixed(2)}
                            </Typography>
                        )}
                    </Box>
                </TableCell>
                <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Chip 
                            label={row.return_status === 'none' ? 'Sin dev.' : (row.return_status === 'partial' ? 'Dev. Parcial' : 'Dev. Total')} 
                            size="small" 
                            color={row.return_status === 'none' ? 'default' : (row.return_status === 'full' ? 'error' : 'warning')}
                        />
                        <IconButton 
                            title="Registrar Devolución" 
                            onClick={() => onReturnClick(row)} 
                            color="primary"
                            disabled={row.return_status === 'full'}
                        >
                            <ReplayIcon />
                        </IconButton>
                    </Box>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ padding: 0 }} colSpan={7}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1, p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                            {loading ? <p>Cargando detalles...</p> : (
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Items Vendidos</Typography>
                                    <TableContainer component={Paper} sx={{ mb: details.returnItems.length > 0 ? 2 : 0 }}>
                                        <Table size="small">
                                            <TableHead>
                                                {/* --- ESTILOS APLICADOS AQUÍ --- */}
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Producto</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Cantidad</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Precio</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Subtotal</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>{details.saleItems.map((item, i) => (
                                                <TableRow key={`sale-${i}`}>
                                                    <TableCell>{item.name}</TableCell>
                                                    <TableCell align="right">{parseFloat(item.quantity).toFixed(3)}</TableCell>
                                                    <TableCell align="right">${parseFloat(item.price_at_time).toFixed(2)}</TableCell>
                                                    <TableCell align="right">${(item.quantity * item.price_at_time).toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))}</TableBody>
                                        </Table>
                                    </TableContainer>
                                    
                                    {details.returnItems.length > 0 && (
                                        <Box>
                                            <Typography variant="subtitle2" color="error" sx={{ fontWeight: 'bold' }}>Items Devueltos</Typography>
                                            <TableContainer component={Paper}>
                                                <Table size="small">
                                                    <TableHead>
                                                        {/* --- ESTILOS APLICADOS AQUÍ --- */}
                                                        <TableRow>
                                                            <TableCell sx={{ fontWeight: 'bold' }}>Producto</TableCell>
                                                            <TableCell sx={{ fontWeight: 'bold' }} align="right">Cant. Devuelta</TableCell>
                                                            <TableCell sx={{ fontWeight: 'bold' }} align="right">Monto Devuelto</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>{details.returnItems.map((item, i) => (
                                                        <TableRow key={`return-${i}`} sx={{ '& .MuiTableCell-root': { color: 'error.main' } }}>
                                                            <TableCell>{item.name}</TableCell>
                                                            <TableCell align="right">-{parseFloat(item.quantity).toFixed(3)}</TableCell>
                                                            <TableCell align="right">-${(item.quantity * item.price_at_return).toFixed(2)}</TableCell>
                                                        </TableRow>
                                                    ))}</TableBody>
                                                </Table>
                                            </TableContainer>
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </Fragment>
    );
};

const SalesHistoryPage = () => {
    const [sales, setSales] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState(null);

    const fetchSales = () => {
        apiClient.get('/sales').then(res => setSales(res.data));
    };
    
    useEffect(() => { fetchSales(); }, []);
    
    const handleOpenReturnModal = (sale) => {
        setSelectedSale(sale);
        setModalOpen(true);
    };

    const handleSaveReturn = async (returnData) => {
        // Creamos un nuevo objeto con los datos del modal y añadimos el método de pago
        const payload = {
            ...returnData,
            paymentMethod: 'Efectivo' // Asumimos que la devolución es en efectivo
        };

        try {
            // Enviamos el objeto completo a la API
            await apiClient.post('/returns', payload);
            alert("Devolución registrada exitosamente.");
            fetchSales(); // Refrescamos la lista de ventas
        } catch (error) {
            console.error("Error al registrar la devolución:", error);
            alert("Error al registrar la devolución.");
        } finally {
            setModalOpen(false);
            setSelectedSale(null);
        }
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>Historial de Ventas</Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                         {/* --- ESTILOS APLICADOS AQUÍ --- */}
                        <TableRow>
                            <TableCell />
                            <TableCell sx={{ fontWeight: 'bold' }}>ID Venta</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Fecha</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Vendedor</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Medio de Pago</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="right">Monto (Bruto/Neto)</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="center">Devolución</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sales.map((row) => (<Row key={row.id} row={row} onReturnClick={handleOpenReturnModal} />))}
                    </TableBody>
                </Table>
            </TableContainer>
            {/* El modal ahora se renderiza solo si hay una venta seleccionada para evitar errores */}
            {selectedSale && (
                <ReturnModal 
                    open={modalOpen} 
                    onClose={() => setModalOpen(false)} 
                    onSave={handleSaveReturn} 
                    sale={selectedSale} 
                />
            )}
        </Box>
    );
};

export default SalesHistoryPage;