import React, { useEffect } from 'react';
import { Modal, Box, Typography, TextField, Button } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';

const style = {
  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  width: 450, // Ancho adecuado para un formulario vertical
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  borderRadius: 2
};

const SupplierModal = ({ open, onClose, onSave, supplier }) => {
  const { control, handleSubmit, reset } = useForm({
    defaultValues: { name: '', contact_person: '', phone: '', email: '', address: '' }
  });

  useEffect(() => {
    if (open) {
      reset(supplier || { name: '', contact_person: '', phone: '', email: '', address: '' });
    }
  }, [supplier, open, reset]);

  const onSubmit = (data) => onSave(data, supplier ? supplier.id : null);

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style} component="form" onSubmit={handleSubmit(onSubmit)}>
        <Typography variant="h6">{supplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</Typography>
        
        {/* --- NUEVO LAYOUT CON FLEXBOX --- */}
        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Controller name="name" control={control} rules={{ required: 'El nombre es obligatorio' }} render={({ field, fieldState: { error } }) => 
                <TextField {...field} label="Nombre del Proveedor *" fullWidth autoFocus error={!!error} helperText={error?.message} />
            } />
            <Controller name="contact_person" control={control} render={({ field }) => 
                <TextField {...field} label="Persona de Contacto" fullWidth />
            } />
            <Controller name="phone" control={control} render={({ field }) => 
                <TextField {...field} label="Teléfono" fullWidth />
            } />
            <Controller name="email" control={control} render={({ field }) => 
                <TextField {...field} label="Correo Electrónico" type="email" fullWidth />
            } />
            <Controller name="address" control={control} render={({ field }) => 
                <TextField {...field} label="Dirección" fullWidth multiline rows={2} />
            } />
        </Box>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose} sx={{ mr: 1 }}>Cancelar</Button>
          <Button type="submit" variant="contained">Guardar</Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default SupplierModal;