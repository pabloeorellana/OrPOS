import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, IconButton, Chip } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import apiClient from '../api/axios';
import UserModal from '../components/UserModal';

const UserPage = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    
    // Unificamos la carga de datos en una sola función asíncrona
    const fetchData = async () => {
        setLoading(true);
        try {
            // Hacemos las dos llamadas en paralelo para mayor eficiencia
            const [usersResponse, rolesResponse] = await Promise.all([
                apiClient.get('/users'),
                apiClient.get('/permissions/roles')
            ]);
            setUsers(usersResponse.data);
            setRoles(rolesResponse.data);
        } catch (error) {
            console.error("Error al cargar los datos de la página de usuarios:", error);
            // Mostrar una alerta si falla alguna de las llamadas
            if (error.response?.status === 403) {
                alert("No tienes permiso para ver esta sección.");
            } else {
                alert("No se pudieron cargar los datos necesarios.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSaveUser = async (formData) => {
        try {
            await apiClient.post('/users', formData);
            fetchData(); // Volvemos a llamar a la función unificada para recargar todo
        } catch (error) {
            alert(error.response?.data?.message || "Error al guardar el usuario.");
        } finally {
            setModalOpen(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('¿Seguro que quieres eliminar este usuario? Las ventas y turnos asociados se conservarán pero quedarán desvinculados.')) {
            try {
                await apiClient.delete(`/users/${userId}`);
                fetchData(); // Recargar todo
            } catch (error) {
                alert(error.response?.data?.message || "Error al eliminar.");
            }
        }
    };

    const columns = [
        { field: 'id', headerName: 'ID', width: 90 },
        { field: 'username', headerName: 'Usuario', width: 250 },
        { field: 'role', headerName: 'Rol', width: 150, renderCell: (p) => (<Chip label={p.value} color={p.value === 'administrador' ? 'primary' : 'default'} size="small" />) },
        {
            field: 'actions',
            headerName: 'Acciones',
            width: 150,
            sortable: false,
            renderCell: (p) => (
                <IconButton onClick={() => handleDeleteUser(p.row.id)} color="error">
                    <DeleteIcon />
                </IconButton>
            )
        },
    ];

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">Gestión de Usuarios</Typography>
                {/* Deshabilitar el botón si los roles aún no se han cargado */}
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setModalOpen(true)} disabled={loading || roles.length === 0}>
                    Nuevo Usuario
                </Button>
            </Box>
            <Paper sx={{ height: 600, width: '100%' }}>
                <DataGrid
                    rows={users}
                    columns={columns}
                    loading={loading}
                    components={{ Toolbar: GridToolbar }}
                    localeText={{ noRowsLabel: 'No hay usuarios para mostrar' }}
                />
            </Paper>
            <UserModal 
                open={modalOpen} 
                onClose={() => setModalOpen(false)} 
                onSave={handleSaveUser}
                roles={roles} // Pasamos los roles que ya están cargados y listos
            />
        </Box>
    );
};

export default UserPage;