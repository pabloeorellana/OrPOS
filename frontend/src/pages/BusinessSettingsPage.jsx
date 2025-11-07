import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, TextField, Button, Grid, CircularProgress, LinearProgress, Switch, FormControlLabel, Divider } from '@mui/material';
import apiClient from '../api/axios';
import { useSnackbar } from '../context/SnackbarContext';

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
    const { showSnackbar } = useSnackbar();
    const [businessData, setBusinessData] = useState(null);
    const [businessName, setBusinessName] = useState('');
    const [initialBusinessName, setInitialBusinessName] = useState('');

    const [tableServiceFee, setTableServiceFee] = useState('0');
    const [enableTableService, setEnableTableService] = useState(false);
    const [initialFee, setInitialFee] = useState('0');
    const [initialEnable, setInitialEnable] = useState(false);

    const [loading, setLoading] = useState(true);
    const [savingName, setSavingName] = useState(false);
    const [savingPos, setSavingPos] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [businessRes, feeRes, enableRes] = await Promise.all([
                    apiClient.get('/tenants/my-business'),
                    apiClient.get('/settings/table_service_fee'),
                    apiClient.get('/settings/enable_table_service')
                ]);

                setBusinessData(businessRes.data);
                setBusinessName(businessRes.data.name);
                setInitialBusinessName(businessRes.data.name);

                setTableServiceFee(feeRes.data.value || '0');
                setInitialFee(feeRes.data.value || '0');

                setEnableTableService(enableRes.data.value === '1');
                setInitialEnable(enableRes.data.value === '1');

            } catch (err) {
                setError("No se pudo cargar la información de tu negocio.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSaveName = async () => {
        setSavingName(true);
        try {
            await apiClient.put('/tenants/my-business', { name: businessName });
            setInitialBusinessName(businessName);
            showSnackbar("Nombre del negocio actualizado.", "success");
        } catch (error) {
            showSnackbar("No se pudo actualizar el nombre.", "error");
        } finally {
            setSavingName(false);
        }
    };

    const handleSavePosSettings = async () => {
        setSavingPos(true);
        try {
            await Promise.all([
                apiClient.put('/settings/table_service_fee', { value: tableServiceFee }),
                apiClient.put('/settings/enable_table_service', { value: enableTableService ? '1' : '0' })
            ]);
            setInitialFee(tableServiceFee);
            setInitialEnable(enableTableService);
            showSnackbar("Configuración del POS actualizada.", "success");
        } catch (error) {
            showSnackbar("No se pudo actualizar la configuración del POS.", "error");
        } finally {
            setSavingPos(false);
        }
    };

    if (loading) return <CircularProgress />;
    if (error) return <Typography color="error">{error}</Typography>;

    const isNameChanged = businessName !== initialBusinessName;
    const arePosSettingsChanged = tableServiceFee !== initialFee || enableTableService !== initialEnable;

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
                        disabled={savingName || !isNameChanged}
                    >
                        {savingName ? <CircularProgress size={24} /> : 'Guardar Nombre'}
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
                <Grid item xs={12}><Divider sx={{ my: 2 }} /></Grid>
                <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Configuración de POS</Typography>
                    <FormControlLabel
                        control={<Switch checked={enableTableService} onChange={(e) => setEnableTableService(e.target.checked)} />}
                        label="Habilitar Servicio de Mesa"
                    />
                    <TextField
                        label="Monto Fijo del Servicio de Mesa"
                        type="number"
                        value={tableServiceFee}
                        onChange={(e) => setTableServiceFee(e.target.value)}
                        fullWidth
                        disabled={!enableTableService}
                        sx={{ mt: 2 }}
                    />
                    <Button 
                        variant="contained" 
                        sx={{ mt: 2 }} 
                        onClick={handleSavePosSettings}
                        disabled={savingPos || !arePosSettingsChanged}
                    >
                        {savingPos ? <CircularProgress size={24} /> : 'Guardar Configuración de POS'}
                    </Button>
                </Grid>
            </Grid>
        </Paper>
    );
};
export default BusinessSettingsPage;