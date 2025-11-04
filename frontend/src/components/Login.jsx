import React, { useState } from 'react';
import { TextField, Button, Typography, Box, Alert, Paper, Avatar, CssBaseline, CircularProgress } from '@mui/material';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/axios';
import { useNavigate, useParams } from 'react-router-dom';

const Login = () => {
    const { tenantPath } = useParams(); // Obtiene 'mercadito' desde la URL /mercadito/login
    const { login } = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleLogin = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        setError('');
        
        try {
            const response = await apiClient.post('/auth/login', {
                username,
                password,
                // 'tenantPath' será el string (ej: "mercadito") si estamos en una ruta de tenant,
                // o undefined si estamos en /login, que es lo que el backend espera.
                tenantPath 
            });
            const { token, user } = response.data;
            
            login(user, token); // Actualiza el contexto

            // Navegación post-login
            if (user.isSuperAdmin) {
                navigate('/superadmin-dashboard', { replace: true });
            } else if (user.role === 'empleado') {
                // Para empleados, siempre al POS del tenant actual
                navigate(`/${tenantPath}/pos`, { replace: true });
            } else {
                // Para otros roles de tenant, al dashboard del tenant actual
                navigate(`/${tenantPath}/dashboard`, { replace: true });
            }
            
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
                    {/* El título se basa en si 'tenantPath' existe en la URL */}
                    {tenantPath ? `Acceso a ${tenantPath}` : "Sistema de Gestión"}
                </Typography>
                <Typography component="p" variant="subtitle1" color="text.secondary">Bienvenido</Typography>
                <Box component="form" onSubmit={handleLogin} sx={{ mt: 1, width: '100%' }}>
                    <TextField margin="normal" required fullWidth label="Usuario" name="username" autoComplete="username" autoFocus value={username} onChange={(e) => setUsername(e.target.value)} />
                    <TextField margin="normal" required fullWidth name="password" label="Contraseña" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    {error && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>}
                    <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2, py: 1.5 }} disabled={isSubmitting}>
                        {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Ingresar'}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};
export default Login;