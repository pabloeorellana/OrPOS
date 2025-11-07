import React, { useState } from 'react';
import { Modal, Box, Typography, TextField, Button, Grid, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useSnackbar } from '../context/SnackbarContext';

const PaymentModal = ({ open, onClose, onSave }) => {
    const { activeShift } = useAuth();
    const { showSnackbar } = useSnackbar();
    const [formData, setFormData] = useState({
        type: 'supplier',
        recipient: '',
        amount: '',
        description: '',
        source_of_funds: 'cash',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        if (!activeShift) {
            showSnackbar("No hay un turno activo. No se puede registrar el pago.", "error");
            return;
        }
        onSave({ ...formData, shift_id: activeShift.id });
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={style}>
                <Typography variant="h6" component="h2">Nuevo Pago</Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <FormControl fullWidth>
                            <InputLabel>Tipo de Pago</InputLabel>
                            <Select name="type" value={formData.type} onChange={handleChange}>
                                <MenuItem value="supplier">Proveedor</MenuItem>
                                <MenuItem value="employee">Empleado</MenuItem>
                                <MenuItem value="other">Otro</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField name="recipient" label="Destinatario" value={formData.recipient} onChange={handleChange} fullWidth />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField name="amount" label="Monto" type="number" value={formData.amount} onChange={handleChange} fullWidth />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField name="description" label="Descripción" value={formData.description} onChange={handleChange} fullWidth multiline rows={3} />
                    </Grid>
                    <Grid item xs={12}>
                        <FormControl fullWidth>
                            <InputLabel>Origen de los Fondos</InputLabel>
                            <Select name="source_of_funds" value={formData.source_of_funds} onChange={handleChange}>
                                <MenuItem value="cash">Efectivo</MenuItem>
                                <MenuItem value="virtual_wallet">Billetera Virtual</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button onClick={onClose} sx={{ mr: 1 }}>Cancelar</Button>
                    <Button variant="contained" onClick={handleSave}>Guardar Pago</Button>
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
    width: 400,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
};

export default PaymentModal;
