import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, IconButton, Chip, Avatar } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import apiClient from '../api/axios';
import ProductModal from '../components/ProductModal';

const ProductPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState(null);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/products');
            setProducts(response.data);
        } catch (error) {
            if (error.response?.status === 403) alert("No tienes permiso para ver los productos.");
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchProducts(); }, []);

    const handleOpenModal = (product = null) => { setProductToEdit(product); setModalOpen(true); };
    const handleCloseModal = () => { setProductToEdit(null); setModalOpen(false); };

    const handleSaveProduct = async (formData, productId) => {
        const dataToSend = {
            ...formData,
            category_id: formData.category_id || null,
            supplier_id: formData.supplier_id || null,
        };
        try {
            if (productId) await apiClient.put(`/products/${productId}`, dataToSend);
            else await apiClient.post('/products', dataToSend);
            fetchProducts();
        } catch (error) { alert("Error al guardar el producto."); } 
        finally { handleCloseModal(); }
    };

    const handleDeleteProduct = async (productId) => {
        if (window.confirm('¿Seguro?')) {
            try {
                await apiClient.delete(`/products/${productId}`);
                fetchProducts();
            } catch (error) { alert("Error al eliminar el producto."); }
        }
    };
    
    const columns = [
        { 
            field: 'image_url', 
            headerName: 'Img', 
            width: 70,
            renderCell: (params) => <Avatar src={params.value} variant="rounded" />
        },
        { field: 'name', headerName: 'Nombre', width: 220 },
        { 
            field: 'category_name', 
            headerName: 'Categoría', 
            width: 150,
            renderCell: (params) => params.value ? <Chip label={params.value} size="small" /> : ''
        },
        { field: 'price', headerName: 'Precio', type: 'number', width: 100, valueFormatter: (p) => `$${parseFloat(p.value || 0).toFixed(2)}` },
        { field: 'stock', headerName: 'Stock', type: 'number', width: 80 },
        { field: 'barcode', headerName: 'Código Barras', width: 130 },
        { field: 'actions', headerName: 'Acciones', sortable: false, width: 120, renderCell: (p) => (<Box><IconButton onClick={() => handleOpenModal(p.row)}><EditIcon /></IconButton><IconButton onClick={() => handleDeleteProduct(p.row.id)} color="error"><DeleteIcon /></IconButton></Box>)},
    ];

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">Gestión de Productos</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>Nuevo Producto</Button>
            </Box>
            <Paper sx={{ height: 600, width: '100%' }}>
                <DataGrid rows={products} columns={columns} loading={loading} components={{ Toolbar: GridToolbar }} />
            </Paper>
            <ProductModal open={modalOpen} onClose={handleCloseModal} onSave={handleSaveProduct} product={productToEdit} />
        </Box>
    );
};

export default ProductPage;