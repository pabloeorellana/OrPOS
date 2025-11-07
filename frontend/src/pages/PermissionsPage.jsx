import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Paper, Typography, Select, MenuItem, FormControl, InputLabel, FormGroup, FormControlLabel, Switch, Button, CircularProgress, Grid, Divider } from '@mui/material';
import apiClient from '../api/axios';
import { useSnackbar } from '../context/SnackbarContext';

// Mapeo de prefijos de permisos a títulos de grupo para la UI
const groupTitles = {
    dashboard: 'Dashboard',
    pos: 'Punto de Venta (POS)',
    sales: 'Gestión de Ventas',
    returns: 'Gestión de Devoluciones',
    shifts: 'Gestión de Cajas',
    purchases: 'Gestión de Compras',
    products: 'Gestión de Inventario',
    categories: 'Gestión de Inventario',
    suppliers: 'Gestión de Inventario',
    users: 'Administración de Usuarios',
    settings: 'Administración del Sistema',
    audit: 'Administración del Sistema',
    reports: 'Administración del Sistema',
};

const PermissionsPage = () => {
    const { showSnackbar } = useSnackbar();
    const [roles, setRoles] = useState([]);
    const [allPermissions, setAllPermissions] = useState([]);
    const [selectedRoleId, setSelectedRoleId] = useState('');
    const [rolePermissions, setRolePermissions] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [rolesRes, permissionsRes] = await Promise.all([
                    apiClient.get('/permissions/roles'),
                    apiClient.get('/permissions/all')
                ]);
                setRoles(rolesRes.data);
                setAllPermissions(permissionsRes.data);
            } catch (error) {
                showSnackbar("Error al cargar los datos iniciales. Asegúrate de tener permiso para ver esta sección.", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const handleRoleChange = useCallback(async (event) => {
        const roleId = event.target.value;
        setSelectedRoleId(roleId);
        if (roleId) {
            setLoading(true);
            try {
                const response = await apiClient.get(`/permissions/role/${roleId}`);
                const permissionIds = new Set(response.data.map(p => p.id));
                setRolePermissions(permissionIds);
            } catch (error) {
                showSnackbar("Error al cargar los permisos del rol.", "error");
                setRolePermissions(new Set());
            } finally {
                setLoading(false);
            }
        } else {
            setRolePermissions(new Set());
        }
    }, []);

    const handlePermissionToggle = (permissionId) => {
        setRolePermissions(prev => {
            const newPermissions = new Set(prev);
            if (newPermissions.has(permissionId)) {
                newPermissions.delete(permissionId);
            } else {
                newPermissions.add(permissionId);
            }
            return newPermissions;
        });
    };

    const handleSaveChanges = async () => {
        if (!selectedRoleId) return;
        setSaving(true);
        try {
            await apiClient.put(`/permissions/role/${selectedRoleId}`, {
                permissionIds: Array.from(rolePermissions)
            });
            showSnackbar("Permisos guardados exitosamente.", "success");
        } catch (error) {
            showSnackbar("Error al guardar los permisos.", "error");
        } finally {
            setSaving(false);
        }
    };
    
    // Usamos useMemo para agrupar los permisos solo cuando cambian, mejorando el rendimiento.
    const groupedPermissions = useMemo(() => {
        const groups = {};
        allPermissions.forEach(permission => {
            const groupKey = permission.action.split(':')[0];
            const groupTitle = groupTitles[groupKey] || 'Otros';
            if (!groups[groupTitle]) {
                groups[groupTitle] = [];
            }
            groups[groupTitle].push(permission);
        });
        return groups;
    }, [allPermissions]);


    if (loading && roles.length === 0) {
        return <CircularProgress />;
    }

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Gestión de Roles y Permisos</Typography>
            <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Seleccionar Rol a Editar</InputLabel>
                <Select value={selectedRoleId} label="Seleccionar Rol a Editar" onChange={handleRoleChange}>
                    <MenuItem value=""><em>-- Seleccione un rol --</em></MenuItem>
                    {roles.map(role => (
                        <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            {selectedRoleId && (
                <Box>
                    <Divider sx={{ my: 2 }} />
                    {loading ? <CircularProgress /> : (
                        <Grid container spacing={4}>
                            {Object.keys(groupedPermissions).sort().map(groupName => (
                                <Grid item xs={12} md={6} lg={4} key={groupName}>
                                    <Typography variant="h6" sx={{ mb: 1 }}>{groupName}</Typography>
                                    <FormGroup>
                                        {groupedPermissions[groupName].map(permission => (
                                            <FormControlLabel
                                                key={permission.id}
                                                control={
                                                    <Switch
                                                        checked={rolePermissions.has(permission.id)}
                                                        onChange={() => handlePermissionToggle(permission.id)}
                                                        size="small"
                                                    />
                                                }
                                                // Usamos la descripción para la etiqueta
                                                label={permission.description}
                                            />
                                        ))}
                                    </FormGroup>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button variant="contained" onClick={handleSaveChanges} disabled={saving || loading}>
                            {saving ? <CircularProgress size={24} color="inherit" /> : 'Guardar Cambios'}
                        </Button>
                    </Box>
                </Box>
            )}
        </Paper>
    );
};

export default PermissionsPage;