// --- src/pages/PermissionsAdminPage.jsx ---
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, IconButton } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import apiClient from '../api/axios';
import PermissionAdminModal from '../components/PermissionAdminModal';

const PermissionsAdminPage = () => {
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [permissionToEdit, setPermissionToEdit] = useState(null);

    const fetchPermissions = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/permissions/all');
            setPermissions(response.data);
        } catch (error) {
            alert("No se pudieron cargar los permisos.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPermissions(); }, []);

    const handleOpenModal = (p = null) => { setPermissionToEdit(p); setModalOpen(true); };
    const handleCloseModal = () => { setPermissionToEdit(null); setModalOpen(false); };

    const handleSave = async (formData, pId) => {
        try {
            if (pId) { await apiClient.put(`/permissions/${pId}`, formData); }
            else { await apiClient.post('/permissions', formData); }
            fetchPermissions();
        } catch (error) { alert(error.response?.data?.message || "Error al guardar."); }
        finally { handleCloseModal(); }
    };

    const handleDelete = async (pId) => {
        if (window.confirm('¿Seguro?')) {
            try {
                await apiClient.delete(`/permissions/${pId}`);
                fetchPermissions();
            } catch (error) { alert(error.response?.data?.message || "Error al eliminar."); }
        }
    };

    const columns = [
        { field: 'action', headerName: 'Acción', width: 250 },
        { field: 'description', headerName: 'Descripción', flex: 1 },
        {
            field: 'actions', headerName: 'Acciones', width: 120, renderCell: (params) => (
                <Box>
                    <IconButton onClick={() => handleOpenModal(params.row)}><EditIcon /></IconButton>
                    <IconButton onClick={() => handleDelete(params.row.id)} color="error"><DeleteIcon /></IconButton>
                </Box>
            ),
        },
    ];

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">Gestión de Permisos Globales</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
                    Nuevo Permiso
                </Button>
            </Box>
            <Paper sx={{ height: 500, width: '100%' }}>
                <DataGrid rows={permissions} columns={columns} loading={loading} />
            </Paper>
            <PermissionAdminModal open={modalOpen} onClose={handleCloseModal} onSave={handleSave} permission={permissionToEdit} />
        </Box>
    );
};

export default PermissionsAdminPage;