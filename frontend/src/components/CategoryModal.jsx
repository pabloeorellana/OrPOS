import React, {useState, useEffect } from 'react';
import { Modal, Box, Typography, TextField, Button, Grid } from '@mui/material';

const style = {
  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  width: 500, bgcolor: 'background.paper', border: '2px solid #000',
  boxShadow: 24, p: 4, borderRadius: 2,
};

const CategoryModal = ({ open, onClose, onSave, category }) => {
  const [formData, setFormData] = useState({ name: '', image_url: '' });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        image_url: category.image_url || '',
      });
    } else {
      setFormData({ name: '', image_url: '' });
    }
  }, [category, open]);

  const handleChange = (e) => {
    setFormData(prevState => ({ ...prevState, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData, category ? category.id : null);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style} component="form" onSubmit={handleSubmit}>
        <Typography variant="h6" component="h2">
          {category ? 'Editar Categoría' : 'Nueva Categoría'}
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              name="name"
              label="Nombre de la Categoría"
              value={formData.name}
              onChange={handleChange}
              fullWidth
              required
              autoFocus
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="image_url"
              label="URL de Imagen Genérica (Opcional)"
              value={formData.image_url}
              onChange={handleChange}
              fullWidth
            />
          </Grid>
        </Grid>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose} sx={{ mr: 1 }}>Cancelar</Button>
          <Button type="submit" variant="contained">Guardar</Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default CategoryModal;