import React, { useState, useEffect, Fragment } from 'react';
import { Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Modal, TextField, CircularProgress, IconButton, Collapse, Chip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import LoginIcon from '@mui/icons-material/Login';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/axios';
import TenantEditModal from '../components/TenantEditModal';
import ConfirmationModal from '../components/ConfirmationModal';
import PasswordChangeModal from '../components/PasswordChangeModal';
import { useSnackbar } from '../context/SnackbarContext';

const createModalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

const Row = ({ tenant, handleOpenEditModal, handleImpersonate, handleOpenPasswordModal }) => {
    const [open, setOpen] = useState(false);
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    const fetchUsers = () => {
        if (!open) {
            setLoadingUsers(true);
            apiClient.get(`/tenants/${tenant.id}/users`)
                .then(res => setUsers(res.data))
                .catch(err => console.error("Error fetching users for tenant:", err))
                .finally(() => setLoadingUsers(false));
        }
        setOpen(!open);
    };

    return (
        <Fragment>
            <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell><IconButton aria-label="expand row" size="small" onClick={fetchUsers}>{open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}</IconButton></TableCell>
                <TableCell>{tenant.id}</TableCell>
                <TableCell component="th" scope="row">{tenant.name}</TableCell>
                <TableCell><Chip label={tenant.plan_name || 'N/A'} size="small" /></TableCell>
                <TableCell>{tenant.status}</TableCell>
                <TableCell>{tenant.subscription_ends_at ? new Date(tenant.subscription_ends_at).toLocaleDateString('es-AR') : 'N/A'}</TableCell>
                <TableCell align="right">
                    <IconButton color="primary" onClick={() => handleOpenEditModal(tenant)}><EditIcon /></IconButton>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1, padding: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                            <Typography variant="h6" gutterBottom>Usuarios del Negocio</Typography>
                            {loadingUsers ? <CircularProgress size={24}/> : (
                                <Table size="small">
                                    <TableHead><TableRow><TableCell>ID</TableCell><TableCell>Username</TableCell><TableCell>Rol</TableCell><TableCell align="right">Acciones</TableCell></TableRow></TableHead>
                                    <TableBody>
                                        {users.map(user => (
                                            <TableRow key={user.id}>
                                                <TableCell>{user.id}</TableCell>
                                                <TableCell>{user.username}</TableCell>
                                                <TableCell>{user.role}</TableCell>
                                                <TableCell align="right">
                                                    <IconButton title={`Cambiar contraseña para ${user.username}`} color="primary" onClick={() => handleOpenPasswordModal(user)}>
                                                        <EditIcon />
                                                    </IconButton>
                                                    <IconButton title={`Iniciar sesión como ${user.username}`} color="secondary" onClick={() => handleImpersonate(user.id, user.username)}>
                                                        <LoginIcon />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </Fragment>
    );
}

const SuperadminPage = () => {
    const { showSnackbar } = useSnackbar();
    const { startImpersonation } = useAuth();
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [tenantToEdit, setTenantToEdit] = useState(null);
    const [newTenantData, setNewTenantData] = useState({ tenantName: '', subdomain: '', adminUsername: '', adminPassword: '' });
    const [saving, setSaving] = useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [impersonationData, setImpersonationData] = useState(null);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [userToEditPassword, setUserToEditPassword] = useState(null);

    const fetchTenants = () => {
        setLoading(true);
        apiClient.get('/tenants').then(res => setTenants(res.data)).catch(() => showSnackbar("No se pudieron cargar los negocios.", "error")).finally(() => setLoading(false));
    };

    useEffect(() => { fetchTenants(); }, []);

    const handleOpenEditModal = (tenant) => { setTenantToEdit(tenant); setEditModalOpen(true); };

    const handleUpdateTenant = async (tenantId, formData) => {
        try {
            await apiClient.put(`/tenants/${tenantId}`, formData);
            showSnackbar("Negocio actualizado.", "success"); setEditModalOpen(false); fetchTenants();
        } catch (error) { showSnackbar(error.response?.data?.message || "Error al actualizar.", "error"); }
    };

    const handleNewTenantInputChange = (e) => { setNewTenantData({ ...newTenantData, [e.target.name]: e.target.value }); };
    
    const handleSaveNewTenant = async (e) => {
        e.preventDefault(); 
        setSaving(true);
        try {
            await apiClient.post('/tenants', newTenantData);
            showSnackbar("Nuevo negocio creado.", "success"); setCreateModalOpen(false);
            setNewTenantData({ tenantName: '', subdomain: '', adminUsername: '', adminPassword: '' }); 
            fetchTenants();
                } catch (error) { showSnackbar(error.response?.data?.message || "Error al crear.", "error"); } finally { 
            setSaving(false); 
        }
    };

    const handleImpersonate = (userId, username) => {
        setImpersonationData({ userId, username });
        setConfirmModalOpen(true);
    };

    const confirmImpersonation = async () => {
        if (!impersonationData) return;
        try {
            const response = await apiClient.post(`/superadmin/impersonate/${impersonationData.userId}`);
            startImpersonation(response.data.token);
        } catch (error) {
            showSnackbar('No se pudo iniciar la sesión de suplantación.', 'error');
        } finally {
            setConfirmModalOpen(false);
            setImpersonationData(null);
        }
    };

    const handleOpenPasswordModal = (user) => {
        setUserToEditPassword(user);
        setPasswordModalOpen(true);
    };

    const handleUpdateUserPassword = async (password) => {
        if (!userToEditPassword) return;
        try {
            await apiClient.put(`/superadmin/users/${userToEditPassword.id}/password`, { password });
            showSnackbar("Contraseña actualizada.", "success");
        } catch (error) {
            showSnackbar(error.response?.data?.message || "Error al actualizar la contraseña.", "error");
        } finally {
            setPasswordModalOpen(false);
            setUserToEditPassword(null);
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">Gestión de Negocios</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateModalOpen(true)}>Nuevo Negocio</Button>
            </Box>
            <TableContainer component={Paper}>
                <Table aria-label="collapsible table">
                    <TableHead>
                        <TableRow>
                            <TableCell /><TableCell>ID</TableCell><TableCell>Nombre</TableCell>
                            <TableCell>Plan</TableCell><TableCell>Estado</TableCell><TableCell>Vencimiento</TableCell>
                            <TableCell align="right">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? <TableRow><TableCell colSpan={7} align="center"><CircularProgress /></TableCell></TableRow>
                        : (tenants.map(tenant => <Row key={tenant.id} tenant={tenant} handleOpenEditModal={handleOpenEditModal} handleImpersonate={handleImpersonate} handleOpenPasswordModal={handleOpenPasswordModal} />))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)}>
                <Box sx={createModalStyle} component="form" onSubmit={handleSaveNewTenant}>
                    <Typography variant="h6" component="h2">Crear Nuevo Negocio</Typography>
                    <TextField name="tenantName" label="Nombre del Negocio" fullWidth required sx={{ mt: 2 }} value={newTenantData.tenantName} onChange={handleNewTenantInputChange} autoFocus />
                    <TextField name="subdomain" label="Subdominio (ej: minegocio)" fullWidth required sx={{ mt: 2 }} value={newTenantData.subdomain} onChange={handleNewTenantInputChange} helperText="URL única para el cliente" />
                    <TextField name="adminUsername" label="Usuario Admin del Negocio" fullWidth required sx={{ mt: 2 }} value={newTenantData.adminUsername} onChange={handleNewTenantInputChange} />
                    <TextField name="adminPassword" label="Contraseña del Admin" type="password" fullWidth required sx={{ mt: 2 }} value={newTenantData.adminPassword} onChange={handleNewTenantInputChange} />
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button onClick={() => setCreateModalOpen(false)} sx={{ mr: 1 }}>Cancelar</Button>
                        <Button type="submit" variant="contained" disabled={saving}>{saving ? <CircularProgress size={24} /> : 'Crear'}</Button>
                    </Box>
                </Box>
            </Modal>
            
            {tenantToEdit && <TenantEditModal open={editModalOpen} onClose={() => setEditModalOpen(false)} tenant={tenantToEdit} onSave={handleUpdateTenant} />}

            {userToEditPassword && (
                <PasswordChangeModal
                    open={passwordModalOpen}
                    onClose={() => { setPasswordModalOpen(false); setUserToEditPassword(null); }}
                    onSave={handleUpdateUserPassword}
                    userName={userToEditPassword.username}
                />
            )}

            <ConfirmationModal
                open={confirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={confirmImpersonation}
                title="Confirmar Suplantación"
                message={impersonationData ? `¿Seguro que quieres iniciar sesión como "${impersonationData.username}"? Tu sesión de Superadmin se guardará.` : ''}
            />
        </Box>
    );
};
export default SuperadminPage;