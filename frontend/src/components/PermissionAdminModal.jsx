import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Modal, Box, Typography, TextField, Button } from '@mui/material';

// --- ESTE OBJETO FALTABA ---
const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 450,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  borderRadius: 2
};
// --- FIN DE LA CORRECCIÓN ---

const PermissionAdminModal = ({ open, onClose, onSave, permission }) => {
    const { control, handleSubmit, reset } = useForm({
        defaultValues: { action: '', description: '' },
    });

    useEffect(() => {
        if (open) {
            reset(permission || { action: '', description: '' });
        }
    }, [permission, open, reset]);

    const onSubmit = (data) => onSave(data, permission ? permission.id : null);

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={style} component="form" onSubmit={handleSubmit(onSubmit)}>
                <Typography variant="h6">{permission ? 'Editar Permiso' : 'Nuevo Permiso'}</Typography>
                <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Controller name="action" control={control} rules={{ required: 'La acción es obligatoria' }} render={({ field, fieldState: { error } }) => (
                        <TextField {...field} label="Acción (ej: module:action)" fullWidth required autoFocus error={!!error} helperText={error?.message} />
                    )} />
                    <Controller name="description" control={control} rules={{ required: 'La descripción es obligatoria' }} render={({ field, fieldState: { error } }) => (
                        <TextField {...field} label="Descripción" fullWidth required multiline rows={2} error={!!error} helperText={error?.message} />
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

export default PermissionAdminModal;