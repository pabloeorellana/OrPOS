import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, IconButton } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import apiClient from '../api/axios'; // <-- Corregido
import SupplierModal from '../components/SupplierModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { useSnackbar } from '../context/SnackbarContext';

const SupplierPage = () => {
    const { showSnackbar } = useSnackbar();
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [supplierToEdit, setSupplierToEdit] = useState(null);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [supplierToDelete, setSupplierToDelete] = useState(null);

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/suppliers'); // <-- Corregido
            setSuppliers(response.data);
        } catch (error) {
            if (error.response?.status === 403) showSnackbar("No tienes permiso para ver los proveedores.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSuppliers(); }, []);

    const handleOpenModal = (s = null) => { setSupplierToEdit(s); setModalOpen(true); };
    const handleCloseModal = () => { setSupplierToEdit(null); setModalOpen(false); };

    const handleSaveSupplier = async (formData, id) => {
        try {
            if (id) await apiClient.put(`/suppliers/${id}`, formData); // <-- Corregido
            else await apiClient.post('/suppliers', formData); // <-- Corregido
            fetchSuppliers();
        } catch (error) { showSnackbar("Error al guardar.", "error"); }
        finally { handleCloseModal(); }
    };

    const handleDeleteSupplier = (id) => {
        setSupplierToDelete(id);
        setConfirmModalOpen(true);
    };

    const confirmDeleteSupplier = async () => {
        try {
            await apiClient.delete(`/suppliers/${supplierToDelete}`); // <-- Corregido
            fetchSuppliers();
        } catch (error) { showSnackbar("Error al eliminar.", "error"); }
        finally {
            setConfirmModalOpen(false);
            setSupplierToDelete(null);
        }
    };
    
    const columns = [
        { field: 'id', headerName: 'ID', width: 90 }, { field: 'name', headerName: 'Nombre', width: 250 },
        { field: 'contact_person', headerName: 'Contacto', width: 200 }, { field: 'phone', headerName: 'Teléfono', width: 150 },
        { field: 'email', headerName: 'Email', width: 200 },
        { field: 'actions', headerName: 'Acciones', width: 150, renderCell: (p) => (<Box><IconButton onClick={() => handleOpenModal(p.row)}><EditIcon /></IconButton><IconButton onClick={() => handleDeleteSupplier(p.row.id)} color="error"><DeleteIcon /></IconButton></Box>)},
    ];

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h4">Gestión de Proveedores</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>Nuevo Proveedor</Button>
            </Box>
            <Paper sx={{ height: 600, width: '100%' }}><DataGrid rows={suppliers} columns={columns} loading={loading} pageSize={10} rowsPerPageOptions={[5, 10, 20]} components={{ Toolbar: GridToolbar }} /></Paper>
            <SupplierModal open={modalOpen} onClose={handleCloseModal} onSave={handleSaveSupplier} supplier={supplierToEdit} />
            <ConfirmationModal
                open={confirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={confirmDeleteSupplier}
                title="Confirmar Eliminación"
                message="¿Seguro que quieres eliminar este proveedor?"
            />
        </Box>
    );
};

export default SupplierPage;