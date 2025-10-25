import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, TextField, Button, Grid, CircularProgress, LinearProgress, Alert } from '@mui/material';
import apiClient from '../api/axios';

const UsageBar = ({ current, max, label }) => {
    const percentage = max > 0 ? (current / max) * 100 : 0;
    return (
        <Box>
            <Typography variant="body2">{label}: {current} / {max}</Typography>
            <LinearProgress variant="determinate" value={percentage} sx={{ height: 10, borderRadius: 5, mb: 2 }} />
        </Box>
    );
};

const BusinessSettingsPage = () => {
    const [businessData, setBusinessData] = useState(null);
    const [businessName, setBusinessName] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        apiClient.get('/tenants/my-business')
            .then(res => {
                setBusinessData(res.data);
                setBusinessName(res.data.name);
            })
            .catch(err => setError("No se pudo cargar la información de tu negocio."))
            .finally(() => setLoading(false));
    }, []);

    const handleSaveName = async () => {
        setSaving(true);
        try {
            await apiClient.put('/tenants/my-business', { name: businessName });
            alert("Nombre del negocio actualizado.");
            // Actualizamos el estado local para que refleje el cambio
            setBusinessData(prev => ({ ...prev, name: businessName }));
        } catch (error) {
            alert("No se pudo actualizar el nombre.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Ajustes de mi Negocio</Typography>
            <Grid container spacing={4} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Información General</Typography>
                    <TextField 
                        label="Nombre del Negocio" 
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        fullWidth
                    />
                    <Button 
                        variant="contained" 
                        sx={{ mt: 2 }} 
                        onClick={handleSaveName}
                        disabled={saving || businessName === businessData.name}
                    >
                        {saving ? <CircularProgress size={24} /> : 'Guardar Nombre'}
                    </Button>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Suscripción y Límites del Plan ({businessData?.plan_name})</Typography>
                    {businessData && (
                        <>
                            <UsageBar current={businessData.current_users} max={businessData.max_users} label="Usuarios" />
                            <UsageBar current={businessData.current_products} max={businessData.max_products} label="Productos" />
                        </>
                    )}
                    <Button variant="outlined" sx={{ mt: 2 }}>
                        Contactar a Soporte para Actualizar Plan
                    </Button>
                </Grid>
            </Grid>
        </Paper>
    );
};
export default BusinessSettingsPage;