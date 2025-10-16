import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Collapse } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Link } from 'react-router-dom';
import apiClient from '../api/axios'; // <-- Corregido

const Row = ({ row }) => {
    const [open, setOpen] = useState(false); const [details, setDetails] = useState([]); const [loading, setLoading] = useState(false);
    const fetchDetails = () => {
        if (!open) {
            setLoading(true);
            apiClient.get(`/purchases/${row.id}`).then(res => { setDetails(res.data); setLoading(false); }); // <-- Corregido
        }
        setOpen(!open);
    };
    return (
        <Fragment>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}><TableCell><IconButton onClick={fetchDetails}>{open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}</IconButton></TableCell><TableCell>{row.id}</TableCell><TableCell>{row.purchase_date ? new Date(row.purchase_date).toLocaleString() : ''}</TableCell><TableCell>{row.supplier_name || 'N/A'}</TableCell><TableCell align="right">${(parseFloat(row.total_amount) || 0).toFixed(2)}</TableCell></TableRow>
            <TableRow><TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}><Collapse in={open} timeout="auto" unmountOnExit><Box sx={{ margin: 1 }}>{loading ? <p>Cargando...</p> : (<Table size="small"><TableHead><TableRow><TableCell>Producto</TableCell><TableCell>Cantidad</TableCell><TableCell align="right">Costo</TableCell><TableCell align="right">Subtotal</TableCell></TableRow></TableHead><TableBody>{details.map((d, i) => (<TableRow key={i}><TableCell>{d.name}</TableCell><TableCell>{d.quantity}</TableCell><TableCell align="right">${parseFloat(d.cost_at_time).toFixed(2)}</TableCell><TableCell align="right">${(d.quantity * d.cost_at_time).toFixed(2)}</TableCell></TableRow>))}</TableBody></Table>)}</Box></Collapse></TableCell></TableRow>
        </Fragment>
    );
};

const PurchasePage = () => {
    const [purchases, setPurchases] = useState([]); const [loading, setLoading] = useState(true);
    useEffect(() => {
        apiClient.get(`/purchases?_=${new Date().getTime()}`).then(res => setPurchases(res.data)).finally(() => setLoading(false)); // <-- Corregido
    }, []);
    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}><Typography variant="h4">Historial de Compras</Typography><Button variant="contained" startIcon={<AddIcon />} component={Link} to="/purchases/new">Registrar Nueva Compra</Button></Box>
            <TableContainer component={Paper}><Table><TableHead><TableRow><TableCell /><TableCell>ID Compra</TableCell><TableCell>Fecha</TableCell><TableCell>Proveedor</TableCell><TableCell align="right">Monto Total</TableCell></TableRow></TableHead><TableBody>{purchases.map((row) => (<Row key={row.id} row={row} />))}</TableBody></Table></TableContainer>
        </Box>
    );
};
export default PurchasePage;