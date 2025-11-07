import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Modal, Box, Typography, TextField, Button, Grid, MenuItem, CircularProgress, Divider, RadioGroup, FormControlLabel, Radio, FormLabel, FormControl } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import apiClient from '../api/axios';
import { useSnackbar } from '../context/SnackbarContext';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 550,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  borderRadius: 2
};

const ProductModal = ({ open, onClose, onSave, product }) => {
    const { control, handleSubmit, reset, setValue, watch } = useForm({
        defaultValues: {
            name: '', barcode: '', description: '', cost: 0, price: 0, stock: 0,
            category_id: '', image_url: '', sale_type: 'unitario'
        }
    });
    const [categories, setCategories] = useState([]);
    const [isFetching, setIsFetching] = useState(false);
    const { showSnackbar } = useSnackbar();
    
    const barcodeValue = watch('barcode');
    const saleTypeValue = watch('sale_type');

    useEffect(() => {
        if (open) {
            // 1. Inicia la carga de categorías
            apiClient.get('/categories').then(res => {
                // 2. Cuando las categorías llegan, las guardamos en el estado
                setCategories(res.data);
                
                //    con los datos del producto, asegurando que todos los campos tengan un valor por defecto.
                reset({
                    name: product?.name || '',
                    barcode: product?.barcode || '',
                    description: product?.description || '',
                    cost: product?.cost || 0,
                    price: product?.price || 0,
                    stock: product?.stock || 0,
                    category_id: product?.category_id || '',
                    image_url: product?.image_url || '',
                    sale_type: product?.sale_type || 'unitario',
                });
            });
        }
    }, [product, open, reset]);

    const handleExternalFetch = async () => {
        if (barcodeValue && barcodeValue.length > 8) {
            setIsFetching(true);
            try {
                const response = await apiClient.get(`/products/fetch-external/${barcodeValue}`);
                const { name, image_url } = response.data;
                if (name) setValue('name', name);
                if (image_url) setValue('image_url', image_url);
            } catch (error) {
                showSnackbar("Producto no encontrado en la base de datos externa.", "error");
            } finally {
                setIsFetching(false);
            }
        } else {
            showSnackbar("Por favor, ingresa un código de barras válido.", "warning");
        }
    };

    const onSubmit = (data) => {
        onSave(data, product ? product.id : null);
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={style} component="form" onSubmit={handleSubmit(onSubmit)}>
                <Typography variant="h6">{product ? 'Editar Producto' : 'Nuevo Producto'}</Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 3 }}>
                    <Controller name="barcode" control={control} render={({ field }) => ( <TextField {...field} label="Código de Barras" fullWidth autoFocus /> )} />
                    <Button variant="contained" onClick={handleExternalFetch} disabled={isFetching} sx={{ height: '56px', px: 3 }}>
                        {isFetching ? <CircularProgress size={24} color="inherit" /> : <SearchIcon />}
                    </Button>
                </Box>

                <Divider sx={{ mb: 3 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Controller name="name" control={control} rules={{ required: 'El nombre es obligatorio' }} render={({ field, fieldState: { error } }) => 
                        <TextField {...field} label="Nombre del Producto *" fullWidth error={!!error} helperText={error?.message} />
                    } />
                    
                    <Controller
                        name="sale_type"
                        control={control}
                        render={({ field }) => (
                            <FormControl component="fieldset">
                                <FormLabel component="legend" sx={{ fontSize: '0.8rem' }}>Tipo de Venta</FormLabel>
                                <RadioGroup row {...field}>
                                    <FormControlLabel value="unitario" control={<Radio />} label="Por Unidad" />
                                    <FormControlLabel value="peso" control={<Radio />} label="Por Peso/Kg" />
                                </RadioGroup>
                            </FormControl>
                        )}
                    />

                    <Controller name="description" control={control} render={({ field }) => 
                        <TextField {...field} label="Descripción" fullWidth multiline rows={2} />
                    } />
                    
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Controller name="cost" control={control} rules={{ required: 'El costo es obligatorio', min: 0 }} render={({ field, fieldState: { error } }) => 
                            <TextField {...field} label={saleTypeValue === 'peso' ? 'Costo por Kg *' : 'Costo *'} type="number" fullWidth error={!!error} helperText={error?.message} InputProps={{ inputProps: { step: "0.01", min: 0 } }} />
                        } />
                        <Controller name="price" control={control} rules={{ required: 'El precio es obligatorio', min: 0 }} render={({ field, fieldState: { error } }) => 
                            <TextField {...field} label={saleTypeValue === 'peso' ? 'Precio Venta por Kg *' : 'Precio Venta *'} type="number" fullWidth error={!!error} helperText={error?.message} InputProps={{ inputProps: { step: "0.01", min: 0 } }} />
                        } />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Controller name="stock" control={control} rules={{ required: 'El stock es obligatorio', min: { value: 0, message: 'El stock no puede ser negativo' } }} render={({ field, fieldState: { error } }) => 
                            <TextField {...field} label={saleTypeValue === 'peso' ? 'Stock (en Kg) *' : 'Stock (unidades) *'} type="number" fullWidth error={!!error} helperText={error?.message} InputProps={{ inputProps: { step: "0.001", min: 0 } }} />
                        } />
                        <Controller name="category_id" control={control} render={({ field }) => (
                            <TextField {...field} label="Categoría" fullWidth select>
                                <MenuItem value=""><em>Ninguna</em></MenuItem>
                                {categories.map((cat) => (<MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>))}
                            </TextField>
                        )} />
                    </Box>

                    <Controller name="image_url" control={control} render={({ field }) => 
                        <TextField {...field} label="Imagen (URL)" fullWidth />
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

export default ProductModal;