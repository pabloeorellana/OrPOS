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
            if (error.response?.status === 403) {
                alert("No tienes permiso para ver los productos.");
            } else {
                console.error("Error al cargar los productos:", error);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleOpenModal = (product = null) => {
        console.log("Abriendo modal para el producto:", product); 
        setProductToEdit(product);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setProductToEdit(null);
        setModalOpen(false);
    };

    const handleSaveProduct = async (formData, productId) => {
        const dataToSend = {
            ...formData,
            category_id: formData.category_id || null,
            supplier_id: formData.supplier_id || null,
            sale_type: formData.sale_type || 'unitario',
        };
        try {
            if (productId) {
                await apiClient.put(`/products/${productId}`, dataToSend);
            } else {
                await apiClient.post('/products', dataToSend);
            }
            fetchProducts();
        } catch (error) {
            console.error("Error al guardar el producto:", error.response?.data || error);
            alert("Error al guardar el producto.");
        } finally {
            handleCloseModal();
        }
    };

    const handleDeleteProduct = async (productId) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
            try {
                await apiClient.delete(`/products/${productId}`);
                fetchProducts();
            } catch (error) {
                alert("Error al eliminar el producto.");
            }
        }
    };
    
    const columns = [
        { 
            field: 'image_url', 
            headerName: 'Imagen',
            width: 80,
            renderCell: (params) => <Avatar src={params.value} variant="rounded" />,
            sortable: false,
            filterable: false,
        },
        { field: 'name', headerName: 'Nombre', width: 220 },
        { 
            field: 'category_name', 
            headerName: 'Categoría', 
            width: 150,
            renderCell: (params) => params.value ? <Chip label={params.value} size="small" /> : ''
        },
        { 
            field: 'cost',
            headerName: 'Costo', 
            type: 'number', 
            width: 100, 
            renderCell: (params) => `$${(parseFloat(params.value) || 0).toFixed(2)}`
        },
        { 
            field: 'price',
            headerName: 'Precio', 
            type: 'number', 
            width: 100, 
            renderCell: (params) => `$${(parseFloat(params.value) || 0).toFixed(2)}` 
        },
        { field: 'stock', headerName: 'Stock', type: 'number', width: 80 },
        { field: 'barcode', headerName: 'Código Barras', width: 130 },
        { 
            field: 'actions', 
            headerName: 'Acciones', 
            sortable: false, 
            width: 120, 
            renderCell: (params) => (
                <Box>
                    <IconButton onClick={() => handleOpenModal(params.row)}><EditIcon /></IconButton>
                    <IconButton onClick={() => handleDeleteProduct(params.row.id)} color="error"><DeleteIcon /></IconButton>
                </Box>
            )
        },
    ];

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" gutterBottom>Gestión de Productos</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>Nuevo Producto</Button>
            </Box>
            <Paper sx={{ height: 600, width: '100%' }}>
                <DataGrid 
                    rows={products} 
                    columns={columns} 
                    loading={loading} 
                    components={{ Toolbar: GridToolbar }} 
                />
            </Paper>
            <ProductModal open={modalOpen} onClose={handleCloseModal} onSave={handleSaveProduct} product={productToEdit} />
        </Box>
    );
};

export default ProductPage;