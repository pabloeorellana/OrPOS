import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, TextField, Button, Grid, MenuItem } from '@mui/material';
import apiClient from '../api/axios';

const style = {
  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  width: 600, bgcolor: 'background.paper', border: '2px solid #000',
  boxShadow: 24, p: 4, borderRadius: 2
};

const ProductModal = ({ open, onClose, onSave, product }) => {
  const [formData, setFormData] = useState({
    name: '', barcode: '', description: '', cost: '', price: '', stock: '',
    category_id: '', supplier_id: '', image_url: ''
  });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (open) {
      apiClient.get('/categories').then(res => setCategories(res.data));
    }
  }, [open]);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '', barcode: product.barcode || '', description: product.description || '',
        cost: product.cost || '', price: product.price || '', stock: product.stock || '',
        category_id: product.category_id || '', supplier_id: product.supplier_id || '', image_url: product.image_url || ''
      });
    } else {
      setFormData({
        name: '', barcode: '', description: '', cost: '', price: '', stock: '',
        category_id: '', supplier_id: '', image_url: ''
      });
    }
  }, [product, open]);

  const handleChange = (e) => {
    setFormData(prevState => ({ ...prevState, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData, product ? product.id : null);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style} component="form" onSubmit={handleSubmit}>
        <Typography variant="h6">{product ? 'Editar Producto' : 'Nuevo Producto'}</Typography>
        {/* --- SINTAXIS DE GRID CORREGIDA --- */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} md={8}><TextField name="name" label="Nombre del Producto" value={formData.name} onChange={handleChange} fullWidth required /></Grid>
          <Grid item xs={12} md={4}><TextField name="barcode" label="Código de Barras" value={formData.barcode} onChange={handleChange} fullWidth /></Grid>
          <Grid item xs={12}><TextField name="description" label="Descripción" value={formData.description} onChange={handleChange} fullWidth multiline rows={2} /></Grid>
          <Grid item xs={12} md={4}><TextField name="cost" label="Costo" type="number" value={formData.cost} onChange={handleChange} fullWidth required /></Grid>
          <Grid item xs={12} md={4}><TextField name="price" label="Precio de Venta" type="number" value={formData.price} onChange={handleChange} fullWidth required /></Grid>
          <Grid item xs={12} md={4}><TextField name="stock" label="Stock" type="number" value={formData.stock} onChange={handleChange} fullWidth required /></Grid>
          <Grid item xs={12} md={6}>
            <TextField name="category_id" label="Categoría" value={formData.category_id} onChange={handleChange} fullWidth select>
              <MenuItem value=""><em>Ninguna</em></MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}><TextField name="image_url" label="URL de Imagen" value={formData.image_url} onChange={handleChange} fullWidth /></Grid>
        </Grid>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose} sx={{ mr: 1 }}>Cancelar</Button>
          <Button type="submit" variant="contained">Guardar</Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default ProductModal;