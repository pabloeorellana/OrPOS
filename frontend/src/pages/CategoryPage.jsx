import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, IconButton, Avatar } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import apiClient from '../api/axios';
import CategoryModal from '../components/CategoryModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { useSnackbar } from '../context/SnackbarContext';

const CategoryPage = () => {
    const { showSnackbar } = useSnackbar();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState(null);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/categories');
            setCategories(response.data);
        } catch (error) {
            console.error("Error al cargar las categorías:", error);
            if (error.response?.status === 403) showSnackbar("No tienes permiso para ver esta sección.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCategories(); }, []);

    const handleOpenModal = (category = null) => { setCategoryToEdit(category); setModalOpen(true); };
    const handleCloseModal = () => { setCategoryToEdit(null); setModalOpen(false); };

    const handleSaveCategory = async (formData, categoryId) => {
        try {
            if (categoryId) {
                await apiClient.put(`/categories/${categoryId}`, formData);
            } else {
                await apiClient.post('/categories', formData);
            }
            fetchCategories();
        } catch (error) {
            showSnackbar("Error al guardar la categoría.", "error");
        } finally {
            handleCloseModal();
        }
    };

    const handleDeleteCategory = (categoryId) => {
        setCategoryToDelete(categoryId);
        setConfirmModalOpen(true);
    };

    const confirmDeleteCategory = async () => {
        try {
            await apiClient.delete(`/categories/${categoryToDelete}`);
            fetchCategories();
        } catch (error) {
            showSnackbar("Error al eliminar la categoría.", "error");
        } finally {
            setConfirmModalOpen(false);
            setCategoryToDelete(null);
        }
    };
    
    const columns = [
        { field: 'id', headerName: 'ID', width: 90 },
        { field: 'name', headerName: 'Nombre', width: 250 },
        {
            field: 'image_url',
            headerName: 'Imagen Genérica',
            width: 200,
            renderCell: (params) => (
                params.value ? <Avatar src={params.value} variant="rounded" /> : 'N/A'
            )
        },
        {
            field: 'actions',
            headerName: 'Acciones',
            sortable: false,
            width: 150,
            renderCell: (params) => (
                <Box>
                    <IconButton onClick={() => handleOpenModal(params.row)} color="primary">
                        <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteCategory(params.row.id)} color="error">
                        <DeleteIcon />
                    </IconButton>
                </Box>
            ),
        },
    ];

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" gutterBottom>
                    Gestión de Categorías
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
                    Nueva Categoría
                </Button>
            </Box>
            <Paper sx={{ height: 600, width: '100%' }}>
                <DataGrid
                    rows={categories}
                    columns={columns}
                    loading={loading}
                    components={{ Toolbar: GridToolbar }}
                />
            </Paper>
            <CategoryModal
                open={modalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveCategory}
                category={categoryToEdit}
            />
            <ConfirmationModal
                open={confirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={confirmDeleteCategory}
                title="Confirmar Eliminación"
                message="¿Seguro que quieres eliminar esta categoría?"
            />
        </Box>
    );
};

export default CategoryPage;