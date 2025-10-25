import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, TextField, Button } from '@mui/material';
import apiClient from '../api/axios';

const SettingsPage = () => {
    const [tableServiceFee, setTableServiceFee] = useState(0);

    useEffect(() => {
        apiClient.get('/settings/table_service_fee')
            .then(res => setTableServiceFee(parseFloat(res.data.value) || 0));
    }, []);

    const handleSave = () => {
        apiClient.put('/settings/table_service_fee', { value: tableServiceFee })
            .then(() => alert('Configuración guardada.'))
            .catch(() => alert('Error al guardar.'));
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
        </Paper>
    );
};

export default SettingsPage;