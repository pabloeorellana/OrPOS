import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Modal, Box, Typography, TextField, Button } from '@mui/material';

const style = {
  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  width: 450, // Un ancho adecuado para este formulario simple
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  borderRadius: 2
};

const CategoryModal = ({ open, onClose, onSave, category }) => {
  const { control, handleSubmit, reset } = useForm({
    defaultValues: { name: '', image_url: '' },
  });

  useEffect(() => {
    if (open) {
      reset(category || { name: '', image_url: '' });
    }
  }, [category, open, reset]);

  const onSubmit = (data) => onSave(data, category ? category.id : null);

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style} component="form" onSubmit={handleSubmit(onSubmit)}>
        <Typography variant="h6">{category ? 'Editar Categoría' : 'Nueva Categoría'}</Typography>
        
        {/* --- NUEVO LAYOUT CON FLEXBOX --- */}
        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Controller name="name" control={control} rules={{ required: 'El nombre es obligatorio' }} render={({ field, fieldState: { error } }) => (
                <TextField 
                    {...field} 
                    label="Nombre de la Categoría" 
                    fullWidth 
                    required 
                    autoFocus
                    error={!!error} 
                    helperText={error?.message} 
                />
            )} />
            <Controller name="image_url" control={control} render={({ field }) => (
                <TextField 
                    {...field} 
                    label="URL de la Imagen" 
                    fullWidth 
                    helperText="* URL para la imagen genérica de la categoría"
                />
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

export default CategoryModal;