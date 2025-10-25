import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Modal, Box, Typography, TextField, Button } from '@mui/material';

const style = {
  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  width: 450, bgcolor: 'background.paper', border: '2px solid #000', boxShadow: 24, p: 4
};

const PlanModal = ({ open, onClose, onSave, plan }) => {
    const { control, handleSubmit, reset } = useForm({
        defaultValues: { name: '', price: 0, max_users: 0, max_products: 0 },
    });

    useEffect(() => {
        if (open) {
            reset(plan || { name: '', price: 0, max_users: 0, max_products: 0 });
        }
    }, [plan, open, reset]);

    const onSubmit = (data) => onSave(data, plan ? plan.id : null);

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={style} component="form" onSubmit={handleSubmit(onSubmit)}>
                <Typography variant="h6">{plan ? 'Editar Plan' : 'Nuevo Plan'}</Typography>
                <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Controller name="name" control={control} rules={{ required: 'El nombre es obligatorio' }} render={({ field, fieldState: { error } }) => (
                        <TextField {...field} label="Nombre del Plan" fullWidth required autoFocus error={!!error} helperText={error?.message} />
                    )} />
                    <Controller name="price" control={control} rules={{ required: true, min: 0 }} render={({ field }) => (
                        <TextField {...field} label="Precio (Mensual)" type="number" fullWidth required InputProps={{ startAdornment: '$' }} />
                    )} />
                    <Controller name="max_users" control={control} rules={{ required: true, min: 1 }} render={({ field }) => (
                        <TextField {...field} label="Máx. Usuarios" type="number" fullWidth required />
                    )} />
                    <Controller name="max_products" control={control} rules={{ required: true, min: 1 }} render={({ field }) => (
                        <TextField {...field} label="Máx. Productos" type="number" fullWidth required />
                    )} />
                </Box>
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button onClick={onClose} sx={{ mr: 1 }}>Cancelar</Button>
                    <Button type="submit" variant="contained">Guardar</Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default PlanModal;