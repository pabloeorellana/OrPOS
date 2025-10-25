import React, { useState } from 'react';
import { TextField, Button, Typography, Box, Alert, Paper, Avatar, CssBaseline } from '@mui/material';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import CircularProgress from '@mui/material/CircularProgress';
import apiClient from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { getSubdomain, clearSubdomain } from '../utils/subdomain.js';
import { useNavigate, useLocation } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // If we are explicitly on the superadmin login path (/login) and there is
    // no tenant query param, clear any previously saved dev_tenant so the
    // Login component doesn't keep showing the tenant login UI.
    const params = new URLSearchParams(location.search);
    const urlTenant = params.get('tenant');
    if (location.pathname === '/login' && !urlTenant) {
        clearSubdomain();
    }

    const subdomain = getSubdomain();
    // DEBUG: mostrar el subdominio detectado (sin normalizar) para ayudar en desarrollo
    console.debug('Detected subdomain (raw):', subdomain);

    const handleLogin = async (event) => {
        event.preventDefault();
        setError('');
        try {
            // Normalizamos el subdominio: trim + lowercase para evitar mismatches con la DB
            const normalizedSubdomain = subdomain ? subdomain.trim().toLowerCase() : null;
            console.debug('Normalized subdomain (sent):', normalizedSubdomain);
            setIsSubmitting(true);

            const response = await apiClient.post('/auth/login', {
                username,
                password,
                subdomain: normalizedSubdomain
            });
            const { token, user } = response.data;
            // Simplemente llamamos a login y luego navegamos a la ruta original o al dashboard.
            login(user, token);
            // Navegar al origen (si existe) o al dashboard
            const from = location.state?.from?.pathname || '/dashboard';
            navigate(from, { replace: true });
            
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo conectar al servidor.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5', display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
            <CssBaseline />
            <Paper elevation={6} sx={{ p: 4, borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '400px', width: '100%' }}>
                <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}><ShoppingCartOutlinedIcon /></Avatar>
                <Typography component="h1" variant="h5">
                    {subdomain ? `Acceso a ${subdomain}` : "Sistema de Gestión"}
                </Typography>
                <Typography component="p" variant="subtitle1" color="text.secondary">Bienvenido</Typography>
                <Box component="form" onSubmit={handleLogin} sx={{ mt: 1, width: '100%' }}>
                    <TextField margin="normal" required fullWidth label="Usuario" name="username" autoComplete="username" autoFocus value={username} onChange={(e) => setUsername(e.target.value)} />
                    <TextField margin="normal" required fullWidth name="password" label="Contraseña" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    {error && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>}
                    <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2, py: 1.5 }} disabled={isSubmitting}>
                        {isSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Ingresar'}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};
export default Login;