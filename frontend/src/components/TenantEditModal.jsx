import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, TextField, Button, Select, MenuItem, FormControl, InputLabel, CircularProgress } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import es from 'date-fns/locale/es';
import apiClient from '../api/axios';

const modalStyle = {
  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  width: 450, bgcolor: 'background.paper', border: '2px solid #000', boxShadow: 24, p: 4
};

// --- FUNCIÓN HELPER PARA FORMATEAR LA FECHA ---
// Devuelve YYYY-MM-DD o null
const formatDateForDB = (date) => {
    if (!date || isNaN(date.getTime())) {
        return null;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const TenantEditModal = ({ open, onClose, tenant, onSave }) => {
    const [formData, setFormData] = useState(null);
    const [plans, setPlans] = useState([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setFormData({
                ...tenant,
                // El estado interno sigue usando un objeto Date para el DatePicker
                subscription_ends_at: tenant.subscription_ends_at ? new Date(tenant.subscription_ends_at) : null
            });
            apiClient.get('/tenants/plans').then(res => setPlans(res.data));
        }
    }, [open, tenant]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleDateChange = (date) => {
        setFormData({ ...formData, subscription_ends_at: date });
    };

    const handleSave = async () => {
        setSaving(true);
        // --- PREPARAR DATOS PARA ENVIAR ---
        const dataToSend = {
            ...formData,
            subscription_ends_at: formatDateForDB(formData.subscription_ends_at)
        };

        try {
            await onSave(tenant.id, dataToSend); // Enviar los datos formateados
        } finally {
            setSaving(false);
        }
    };
    
    if (!formData) return null;

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <Modal open={open} onClose={onClose}>
                <Box sx={modalStyle}>
                    <Typography variant="h6">Editar Negocio: {tenant.name}</Typography>
                    <TextField name="name" label="Nombre del Negocio" fullWidth required sx={{ mt: 2 }} value={formData.name} onChange={handleChange} />
                    
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Estado</InputLabel>
                        <Select name="status" value={formData.status} label="Estado" onChange={handleChange}>
                            <MenuItem value="active">Activo</MenuItem>
                            <MenuItem value="past_due">Vencido</MenuItem>
                            <MenuItem value="canceled">Cancelado</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Plan</InputLabel>
                        <Select name="plan_id" value={formData.plan_id || ''} label="Plan" onChange={handleChange}>
                            {plans.map(plan => <MenuItem key={plan.id} value={plan.id}>{plan.name} (${plan.price})</MenuItem>)}
                        </Select>
                    </FormControl>
                    
                    <DatePicker label="La suscripción termina el" value={formData.subscription_ends_at} onChange={handleDateChange} sx={{ mt: 2, width: '100%' }} />

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button onClick={onClose} sx={{ mr: 1 }}>Cancelar</Button>
                        <Button variant="contained" onClick={handleSave} disabled={saving}>
                            {saving ? <CircularProgress size={24} /> : 'Guardar Cambios'}
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </LocalizationProvider>
    );
};
export default TenantEditModal;