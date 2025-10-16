import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, IconButton, Chip } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import apiClient from '../api/axios'; // <-- Corregido
import UserModal from '../components/UserModal';

const UserPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/users'); // <-- Corregido
            setUsers(response.data);
        } catch (error) {
            if (error.response?.status === 403) alert("No tienes permiso para ver los usuarios.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleSaveUser = async (formData, userId) => {
        try {
            if (userId) { /* await apiClient.put(...); */ } 
            else await apiClient.post('/users', formData); // <-- Corregido
            fetchUsers();
        } catch (error) { alert("Error al guardar el usuario."); } 
        finally { setModalOpen(false); }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('¿Seguro?')) {
            try {
                await apiClient.delete(`/users/${userId}`); // <-- Corregido
                fetchUsers();
            } catch (error) { alert("Error al eliminar."); }
        }
    };

    const columns = [
        { field: 'id', headerName: 'ID', width: 90 },
        { field: 'username', headerName: 'Usuario', width: 250 },
        { field: 'role', headerName: 'Rol', width: 150, renderCell: (p) => (<Chip label={p.value} color={p.value === 'administrador' ? 'primary' : 'default'} size="small" />) },
        { field: 'actions', headerName: 'Acciones', width: 150, renderCell: (p) => (<IconButton onClick={() => handleDeleteUser(p.row.id)} color="error"><DeleteIcon /></IconButton>) },
    ];

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h4">Gestión de Usuarios</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setModalOpen(true)}>Nuevo Usuario</Button>
            </Box>
            <Paper sx={{ height: 600, width: '100%' }}><DataGrid rows={users} columns={columns} loading={loading} components={{ Toolbar: GridToolbar }} /></Paper>
            <UserModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSaveUser} />
        </Box>
    );
};

export default UserPage;