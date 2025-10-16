import React, { useState, useEffect, Fragment } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Collapse, Chip } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import apiClient from '../api/axios';

const Row = ({ row }) => {
    const [open, setOpen] = useState(false);
    const [details, setDetails] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchDetails = () => {
        if (!open) {
            setLoading(true);
            apiClient.get(`/sales/${row.id}`).then(res => { setDetails(res.data); setLoading(false); });
        }
        setOpen(!open);
    };
    return (
        <Fragment>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell><IconButton onClick={fetchDetails}>{open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}</IconButton></TableCell>
                <TableCell>{row.id}</TableCell>
                <TableCell>{new Date(row.sale_date).toLocaleString()}</TableCell>
                <TableCell>{row.username}</TableCell>
                <TableCell><Chip label={row.payment_method} size="small" /></TableCell>
                <TableCell align="right">${(parseFloat(row.total_amount) || 0).toFixed(2)}</TableCell>
            </TableRow>
            <TableRow><TableCell style={{ padding: 0 }} colSpan={6}><Collapse in={open} timeout="auto" unmountOnExit><Box sx={{ margin: 1 }}>
                {loading ? <p>Cargando...</p> : (<Table size="small"><TableHead><TableRow>
                    <TableCell>Producto</TableCell><TableCell>Cantidad</TableCell><TableCell align="right">Precio Unitario</TableCell><TableCell align="right">Subtotal</TableCell>
                </TableRow></TableHead><TableBody>{details.map((d, i) => (<TableRow key={i}>
                    <TableCell>{d.name}</TableCell><TableCell>{d.quantity}</TableCell><TableCell align="right">${parseFloat(d.price_at_time).toFixed(2)}</TableCell><TableCell align="right">${(d.quantity * d.price_at_time).toFixed(2)}</TableCell>
                </TableRow>))}</TableBody></Table>)}
            </Box></Collapse></TableCell></TableRow>
        </Fragment>
    );
};

const SalesHistoryPage = () => {
    const [sales, setSales] = useState([]);
    useEffect(() => {
        apiClient.get('/sales').then(res => setSales(res.data));
    }, []);

    return (
        <Box>
            <Typography variant="h4" gutterBottom>Historial de Ventas</Typography>
            <TableContainer component={Paper}>
                <Table><TableHead><TableRow>
                    <TableCell />
                    <TableCell>ID Venta</TableCell><TableCell>Fecha</TableCell><TableCell>Vendedor</TableCell><TableCell>Medio de Pago</TableCell><TableCell align="right">Monto Total</TableCell>
                </TableRow></TableHead>
                    <TableBody>{sales.map((row) => (<Row key={row.id} row={row} />))}</TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default SalesHistoryPage;