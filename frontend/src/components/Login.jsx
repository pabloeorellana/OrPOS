import React, { useState } from 'react';
import { TextField, Button, Typography, Box, Alert, Paper, Avatar, CssBaseline } from '@mui/material';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();

    const handleLogin = async (event) => {
        event.preventDefault();
        setError('');

        try {
            const response = await axios.post('http://localhost:3001/api/auth/login', {
                username,
                password,
            });
            
            const { token, user } = response.data;
            login(user, token);

        } catch (err) {
            console.error('Error en el login:', err);
            if (err.response && err.response.data) {
                setError(err.response.data.message);
            } else {
                setError('No se pudo conectar al servidor.');
            }
        }
    };

    return (
        // Contenedor principal que ocupa toda la pantalla y centra su contenido
        <Box
            sx={{
                minHeight: '100vh',
                backgroundColor: '#f5f5f5',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                p: 2, // Padding para evitar que el form toque los bordes en pantallas pequeñas
            }}
        >
            <CssBaseline />
            <Paper
                elevation={6}
                sx={{
                    p: 4,
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    maxWidth: '400px', // Ancho máximo del formulario
                    width: '100%',
                }}
            >
                <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
                    <ShoppingCartOutlinedIcon />
                </Avatar>
                <Typography component="h1" variant="h5">
                    El Mercadito
                </Typography>
                <Typography component="p" variant="subtitle1" color="text.secondary">
                    Bienvenido
                </Typography>
                <Box component="form" onSubmit={handleLogin} sx={{ mt: 1, width: '100%' }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="username"
                        label="Usuario"
                        name="username"
                        autoComplete="username"
                        autoFocus
                        variant="outlined"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Contraseña"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        variant="outlined"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {error && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>}
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2, py: 1.5 }}
                    >
                        Ingresar
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}

export default Login;