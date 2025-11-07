import React, { useState, useEffect } from 'react';
import { TextField, Button, Typography, Box, Paper, CssBaseline, CircularProgress, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useSnackbar } from '../context/SnackbarContext';
import apiClient from '../api/axios';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

const Login = () => {
    const { tenantPath: paramsTenant } = useParams(); // Obtiene 'mercadito' desde la URL /mercadito/login
    const [searchParams] = useSearchParams();
    // fallback: si estamos en /tenant-login?tenant=mercadito, tomamos el query param
    const tenantPath = paramsTenant || searchParams.get('tenant') || undefined;
    const { login } = useAuth();
    const navigate = useNavigate();
    const { showSnackbar } = useSnackbar();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [tenantName, setTenantName] = useState(null); // Nombre comercial real
    const [tenantLoading, setTenantLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    useEffect(() => {
        // Obtiene nombre del tenant para branding si hay tenantPath
        const fetchTenantName = async () => {
            if (!tenantPath) { setTenantName(null); return; }
            setTenantLoading(true);
            try {
                const { data } = await apiClient.get('/tenants/resolve', { params: { subdomain: tenantPath } });
                setTenantName(data.name || tenantPath);
            } catch (e) {
                // Fallback al path si falla
                setTenantName(tenantPath);
            } finally {
                setTenantLoading(false);
            }
        };
        fetchTenantName();
    }, [tenantPath]);

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
            
            // Actualiza el contexto con el token y el contexto actual (superadmin o tenant)
            login(token, tenantPath || 'superadmin');

            // Navegación post-login (defensa en profundidad):
            // usamos la bandera que nos devuelve el backend si está disponible,
            // y además validamos que `tenantPath` exista antes de navegar a rutas tenant.
            const isSuperAdmin = response.data?.user?.isSuperAdmin === true;
            if (isSuperAdmin) {
                navigate('/superadmin-dashboard', { replace: true });
                return;
            }

            // Si es usuario de tenant, tenantPath DEBE existir. Si no, mostramos fallback.
            if (!tenantPath) {
                // No estamos en una ruta tenant; no podemos navegar a /undefined.
                // Mejor redirigir a la home para evitar el 404-tenant.
                navigate('/', { replace: true });
                return;
            }

            if (user.role === 'empleado') {
                // Para empleados, siempre al POS del tenant actual
                navigate(`/${tenantPath}/pos`, { replace: true });
            } else {
                // Para otros roles de tenant, al dashboard del tenant actual
                navigate(`/${tenantPath}/dashboard`, { replace: true });
            }
            
        } catch (err) {
            showSnackbar(err.response?.data?.message || 'No se pudo conectar al servidor.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5', display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
            <CssBaseline />
            <Paper elevation={6} sx={{ p: 4, borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '400px', width: '100%' }}>
                <Box sx={{ m: 1, bgcolor: 'transparent' }}><img src="/orposlogofb.png" alt="OrPOS Logo" style={{ height: '60px' }} /></Box>
                <Typography component="h1" variant="h5">
                    {tenantPath
                        ? `Acceso a ${tenantLoading ? '...' : (tenantName || tenantPath)}`
                        : 'Sistema de Gestión OR Pos'}
                </Typography>
                <Typography component="p" variant="subtitle1" color="text.secondary">Bienvenido</Typography>
                <Box component="form" onSubmit={handleLogin} sx={{ mt: 1, width: '100%' }}>
                    <TextField margin="normal" required fullWidth label="Usuario" name="username" autoComplete="username" autoFocus value={username} onChange={(e) => setUsername(e.target.value)} />
                    <TextField 
                        margin="normal" 
                        required 
                        fullWidth 
                        name="password" 
                        label="Contraseña" 
                        type={showPassword ? 'text' : 'password'} 
                        autoComplete="current-password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        InputProps={{ 
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={() => setShowPassword(!showPassword)}
                                        onMouseDown={(e) => e.preventDefault()}
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                    {/* Error messages are now handled by Snackbar */}
                    <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2, py: 1.5 }} disabled={isSubmitting}>
                        {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Ingresar'}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};
export default Login;