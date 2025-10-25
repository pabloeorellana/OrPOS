import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Collapse } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Link } from 'react-router-dom';
import apiClient from '../api/axios';

const Row = ({ row }) => {
    const [open, setOpen] = useState(false);
    const [details, setDetails] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchDetails = () => {
        if (!open) {
            setLoading(true);
            apiClient.get(`/purchases/${row.id}`).then(res => { setDetails(res.data); setLoading(false); });
        }
        setOpen(!open);
    };

    return (
        <Fragment>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell><IconButton aria-label="expand row" size="small" onClick={fetchDetails}>{open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}</IconButton></TableCell>
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.purchase_date ? new Date(row.purchase_date).toLocaleString('es-AR') : ''}</TableCell>
                <TableCell>{row.supplier_name || 'N/A'}</TableCell>
                <TableCell align="right">${(parseFloat(row.total_amount) || 0).toFixed(2)}</TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                            {loading ? <p>Cargando...</p> : (
                                <Table size="small" aria-label="purchases-detail">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Producto</TableCell>
                                            <TableCell align="right">Cantidad</TableCell>
                                            <TableCell align="right">Costo Unitario</TableCell>
                                            <TableCell align="right">Subtotal</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {details.map((detail, index) => (
                                            <TableRow key={index}>
                                                <TableCell component="th" scope="row">{detail.name}</TableCell>
                                                <TableCell align="right">{parseFloat(detail.quantity).toFixed(3)}</TableCell>
                                                <TableCell align="right">${parseFloat(detail.cost_at_time).toFixed(2)}</TableCell>
                                                <TableCell align="right">${(detail.quantity * detail.cost_at_time).toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </Fragment>
    );
};

const PurchasePage = () => {
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get(`/purchases?_=${new Date().getTime()}`)
            .then(res => setPurchases(res.data))
            .finally(() => setLoading(false));
    }, []);

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">Historial de Compras</Typography>
                <Button variant="contained" startIcon={<AddIcon />} component={Link} to="/purchases/new">
                    Registrar Nueva Compra
                </Button>
            </Box>
            <TableContainer component={Paper}>
                <Table aria-label="collapsible table">
                    <TableHead>
                        <TableRow>
                            <TableCell />
                            <TableCell>ID Compra</TableCell>
                            <TableCell>Fecha</TableCell>
                            <TableCell>Proveedor</TableCell>
                            <TableCell align="right">Monto Total</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {purchases.map((row) => (
                            <Row key={row.id} row={row} />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default PurchasePage;