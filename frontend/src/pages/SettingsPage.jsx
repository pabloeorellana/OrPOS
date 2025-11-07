import React, { useState, useEffect } from 'react';
import { TextField, Button, Typography, Box } from '@mui/material';
import Paper from '@mui/material/Paper';
import apiClient from '../api/axios';
import { useSnackbar } from '../context/SnackbarContext';
import PasswordChangeModal from '../components/PasswordChangeModal'; // Import PasswordChangeModal
import { useAuth } from '../context/AuthContext'; // Correct import for useAuth hook

const SettingsPage = () => {
    const { showSnackbar } = useSnackbar();
    const { user } = useAuth(); // Correct usage of useAuth hook
    const [tableServiceFee, setTableServiceFee] = useState(0);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false); // State for password modal

    useEffect(() => {
        apiClient.get('/settings/table_service_fee')
            .then(res => setTableServiceFee(parseFloat(res.data.value) || 0));
    }, []);

    const handleSave = () => {
        apiClient.put('/settings/table_service_fee', { value: tableServiceFee })
            .then(() => showSnackbar('Configuración guardada.', 'success'))
            .catch(() => showSnackbar('Error al guardar.', 'error'));
    };

    const handleOpenPasswordModal = () => {
        setPasswordModalOpen(true);
    };

    const handleUpdateOwnPassword = async (currentPassword, newPassword) => {
        try {
            await apiClient.put('/users/change-password', { currentPassword, newPassword });
            showSnackbar("Contraseña actualizada correctamente.", "success");
        } catch (error) {
            showSnackbar(error.response?.data?.message || "Error al actualizar la contraseña.", "error");
        } finally {
            setPasswordModalOpen(false);
        }
    };

    return (
        <Paper sx={{ p: 3, maxWidth: 600 }}>
            <Typography variant="h4" gutterBottom>Configuración General</Typography>
            <Box sx={{ mt: 3 }}>
                <TextField
                    label="Monto Fijo por Servicio de Mesa"
                    type="number"
                    value={tableServiceFee}
                    onChange={(e) => setTableServiceFee(e.target.value)}
                    InputProps={{ startAdornment: '$' }}
                    fullWidth
                />
                <Button variant="contained" sx={{ mt: 2 }} onClick={handleSave}>
                    Guardar Cambios
                </Button>
            </Box>

            <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>Cambiar Contraseña</Typography>
            <Box sx={{ mt: 2 }}>
                <Button variant="outlined" onClick={handleOpenPasswordModal}>
                    Cambiar mi Contraseña
                </Button>
            </Box>

            {user && (
                <PasswordChangeModal
                    open={passwordModalOpen}
                    onClose={() => setPasswordModalOpen(false)}
                    onSave={handleUpdateOwnPassword}
                    userName={user.username} // Pass the logged-in user's username
                    requireCurrentPassword={true}
                />
            )}
        </Paper>
    );
};

export default SettingsPage;