import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, TextField, Button, Grid, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { useSnackbar } from '../context/SnackbarContext';

const SplitPaymentModal = ({ open, onClose, total, onConfirm }) => {
    const { showSnackbar } = useSnackbar();
    const [payment1, setPayment1] = useState({ method: 'Efectivo', amount: '' });
    const [payment2, setPayment2] = useState({ method: 'Tarjeta', amount: '' });
    const [remaining, setRemaining] = useState(total);

    useEffect(() => {
        const amount1 = parseFloat(payment1.amount) || 0;
        const newRemaining = total - amount1;
        setRemaining(newRemaining);
        setPayment2(p => ({ ...p, amount: newRemaining > 0 ? newRemaining.toFixed(2) : '' }));
    }, [payment1.amount, total]);

    const handleConfirm = () => {
        const amount1 = parseFloat(payment1.amount) || 0;
        const amount2 = parseFloat(payment2.amount) || 0;
        if (amount1 + amount2 !== total) {
            showSnackbar('El monto total no coincide.', 'error');
            return;
        }
        onConfirm([
            { method: payment1.method, amount: amount1 },
            { method: payment2.method, amount: amount2 },
        ]);
    };

    const paymentMethods = ['Efectivo', 'Tarjeta', 'Transferencia', 'QR'];

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={{ ...style, width: 400 }}>
                <Typography variant="h6" component="h2">Pago Mixto</Typography>
                <Typography sx={{ mt: 2 }}>Total a Pagar: ${total.toFixed(2)}</Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                        <TextField
                            label="Monto 1"
                            type="number"
                            value={payment1.amount}
                            onChange={(e) => setPayment1({ ...payment1, amount: e.target.value })}
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <FormControl fullWidth>
                            <InputLabel>Método 1</InputLabel>
                            <Select
                                value={payment1.method}
                                onChange={(e) => setPayment1({ ...payment1, method: e.target.value })}
                            >
                                {paymentMethods.map(method => (
                                    <MenuItem key={method} value={method}>{method}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            label="Monto 2"
                            type="number"
                            value={payment2.amount}
                            onChange={(e) => setPayment2({ ...payment2, amount: e.target.value })}
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <FormControl fullWidth>
                            <InputLabel>Método 2</InputLabel>
                            <Select
                                value={payment2.method}
                                onChange={(e) => setPayment2({ ...payment2, method: e.target.value })}
                            >
                                {paymentMethods.map(method => (
                                    <MenuItem key={method} value={method}>{method}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
                <Typography sx={{ mt: 2 }}>Restante: ${remaining < 0 ? 0 : remaining.toFixed(2)}</Typography>
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button onClick={onClose} sx={{ mr: 1 }}>Cancelar</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleConfirm} 
                        disabled={parseFloat(payment1.amount) + parseFloat(payment2.amount) !== total}
                    >
                        Confirmar Pago
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
};

export default SplitPaymentModal;
