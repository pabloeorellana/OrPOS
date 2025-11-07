import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, IconButton, Chip } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VpnKeyIcon from '@mui/icons-material/VpnKey'; // Import new icon
import apiClient from '../api/axios';
import UserModal from '../components/UserModal';
import ConfirmationModal from '../components/ConfirmationModal';
import PasswordChangeModal from '../components/PasswordChangeModal'; // Import PasswordChangeModal
import { useSnackbar } from '../context/SnackbarContext';

const UserPage = () => {
    const { showSnackbar } = useSnackbar();
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false); // New state for password modal
    const [userToEditPassword, setUserToEditPassword] = useState(null); // New state for user whose password is being edited

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
                showSnackbar("No tienes permiso para ver esta sección.", "error");
            } else {
                showSnackbar("No se pudieron cargar los datos necesarios.", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSaveUser = async (formData, userId) => {
        try {
            if (userId) {
                await apiClient.put(`/users/${userId}`, formData);
            } else {
                await apiClient.post('/users', formData);
            }
            fetchData();
        } catch (error) {
            showSnackbar(error.response?.data?.message || "Error al guardar el usuario.", "error");
        } finally {
            setModalOpen(false);
            setCurrentUser(null);
        }
    };

    const handleEditUser = (user) => {
        setCurrentUser(user);
        setModalOpen(true);
    };

    const handleDeleteUser = (userId) => {
        setUserToDelete(userId);
        setConfirmModalOpen(true);
    };

    const confirmDeleteUser = async () => {
        try {
            await apiClient.delete(`/users/${userToDelete}`);
            fetchData(); // Recargar todo
        } catch (error) {
            showSnackbar(error.response?.data?.message || "Error al eliminar.", "error");
        } finally {
            setConfirmModalOpen(false);
            setUserToDelete(null);
        }
    };

    // New functions for password change
    const handleOpenPasswordModal = (user) => {
        setUserToEditPassword(user);
        setPasswordModalOpen(true);
    };

    const handleUpdateUserPassword = async (password) => {
        if (!userToEditPassword) return;
        try {
            // The backend route for tenant admin to change other user's password
            await apiClient.put(`/users/${userToEditPassword.id}`, { password });
            showSnackbar("Contraseña actualizada.", "success");
        } catch (error) {
            showSnackbar(error.response?.data?.message || "Error al actualizar la contraseña.", "error");
        } finally {
            setPasswordModalOpen(false);
            setUserToEditPassword(null);
        }
    };

    const columns = [
        { field: 'id', headerName: 'ID', width: 90 },
        { field: 'username', headerName: 'Usuario', width: 250 },
        { field: 'role', headerName: 'Rol', width: 150, renderCell: (p) => (<Chip label={p.value} color={p.value === 'administrador' ? 'primary' : 'default'} size="small" />) },
        {
            field: 'actions',
            headerName: 'Acciones',
            width: 180, // Increased width to accommodate new icon
            sortable: false,
            renderCell: (p) => (
                <Box>
                    <IconButton onClick={() => handleEditUser(p.row)} color="primary">
                        <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleOpenPasswordModal(p.row)} color="info" title="Cambiar Contraseña"> {/* New password change button */}
                        <VpnKeyIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteUser(p.row.id)} color="error">
                        <DeleteIcon />
                    </IconButton>
                </Box>
            )
        },
    ];

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">Gestión de Usuarios</Typography>
                {/* Deshabilitar el botón si los roles aún no se han cargado */}
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setCurrentUser(null); setModalOpen(true); }} disabled={loading || roles.length === 0}>
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
                onClose={() => { setModalOpen(false); setCurrentUser(null); }}
                onSave={handleSaveUser}
                roles={roles} // Pasamos los roles que ya están cargados y listos
                currentUser={currentUser}
            />
            <ConfirmationModal
                open={confirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={confirmDeleteUser}
                title="Confirmar Eliminación"
                message="¿Seguro que quieres eliminar este usuario? Las ventas y turnos asociados se conservarán pero quedarán desvinculados."
            />
            {userToEditPassword && (
                <PasswordChangeModal
                    open={passwordModalOpen}
                    onClose={() => { setPasswordModalOpen(false); setUserToEditPassword(null); }}
                    onSave={handleUpdateUserPassword}
                    userName={userToEditPassword.username}
                />
            )}
        </Box>
    );
};

export default UserPage;