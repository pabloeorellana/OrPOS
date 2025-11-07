import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import apiClient from '../api/axios';
import PaymentModal from '../components/PaymentModal'; // This component will be created next
import { useSnackbar } from '../context/SnackbarContext';
import { useAuth } from '../context/AuthContext';

const PaymentsPage = () => {
    const { showSnackbar } = useSnackbar();
    const { activeShift } = useAuth();

    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/payments');
            const processedPayments = response.data.map(payment => ({
                ...payment,
                payment_date: payment.payment_date ? new Date(payment.payment_date) : null,
            }));
            setPayments(processedPayments);
        } catch (error) {
            if (error.response?.status === 403) {
                showSnackbar("No tienes permiso para ver los pagos.", "error");
            } else {
                console.error("Error fetching payments:", error);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    const handleOpenModal = () => {
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
    };

    const handleSavePayment = async (formData) => {
        try {
            await apiClient.post('/payments', formData);
            fetchPayments();
        } catch (error) {
            console.error("Error saving payment:", error.response?.data || error);
            showSnackbar("Error saving payment.", "error");
        } finally {
            handleCloseModal();
        }
    };

    const columns = [
        { field: 'type', headerName: 'Tipo', width: 120, renderCell: (params) => {
            const typeMap = {
                'supplier': 'Proveedor',
                'employee': 'Empleado',
                'other': 'Otro',
            };
            return typeMap[String(params.value).trim().toLowerCase()] || params.value;
        }},
        { field: 'recipient', headerName: 'Destinatario', width: 200 },
        { field: 'amount', headerName: 'Monto', type: 'number', width: 120, renderCell: (params) => `$${(parseFloat(params.value) || 0).toFixed(2)}` },
        { field: 'description', headerName: 'Descripción', width: 250 },
        { 
            field: 'payment_date', 
            headerName: 'Fecha de Pago', 
            type: 'dateTime', 
            width: 200, 
            renderCell: (params) => {
                if (!params.value) return '';
                // params.value is already a Date object due to processing in fetchPayments
                if (isNaN(params.value.getTime())) {
                    return 'Fecha inválida';
                }
                return params.value.toLocaleString('es-AR');
            }
        },
        { field: 'source_of_funds', headerName: 'Origen de Fondos', width: 150, renderCell: (params) => {
            const sourceMap = {
                'cash': 'Efectivo',
                'virtual_wallet': 'Billetera Virtual',
            };
            return sourceMap[String(params.value).trim().toLowerCase()] || params.value;
        }},
        { field: 'username', headerName: 'Registrado por', width: 150 },
    ];

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" gutterBottom>Gestión de Pagos</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenModal}>Nuevo Pago</Button>
            </Box>
            <Paper sx={{ height: 600, width: '100%' }}>
                <DataGrid 
                    rows={payments} 
                    columns={columns} 
                    loading={loading} 
                    components={{ Toolbar: GridToolbar }} 
                    getRowId={(row) => row.id}
                />
            </Paper>
            <PaymentModal open={modalOpen} onClose={handleCloseModal} onSave={handleSavePayment} activeShiftId={activeShift?.id} />
        </Box>
    );
};

export default PaymentsPage;
