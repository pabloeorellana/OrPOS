import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Container, Paper, Typography, Button, Box } from '@mui/material';
import OpenShiftModal from './OpenShiftModal';

const ShiftHandler = ({ children }) => {
    const { user, activeShift, logout } = useAuth(); // logout añadido
    const [openModal, setOpenModal] = useState(false);

    // --- LÓGICA CORREGIDA PARA SUPERADMIN ---
    // Si el usuario es superadmin o administrador, no aplicamos ninguna restricción de turno.
    if (user?.isSuperAdmin || user?.role === 'administrador') {
        return children; // Simplemente renderiza el contenido de la aplicación.
    }

    // Para los otros roles (empleado, propietario), aplicamos la lógica de turno.
    if (!activeShift) {
        return (
            <Container component="main" maxWidth="sm" sx={{ mt: 8 }}>
                <Paper sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography component="h1" variant="h4">
                        Bienvenido, {user?.username}
                    </Typography>
                    <Typography sx={{ mt: 2 }}>
                        No tienes un turno activo. Debes abrir la caja para empezar a operar.
                    </Typography>
                    <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                        <Button
                            variant="contained"
                            size="large"
                            onClick={() => setOpenModal(true)}
                        >
                            Abrir Caja
                        </Button>
                        <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={logout} // Llama a logout
                        >
                            Cerrar Sesión
                        </Button>
                    </Box>
                </Paper>
                <OpenShiftModal open={openModal} onClose={() => setOpenModal(false)} />
            </Container>
        );
    }

    return children;
};

export default ShiftHandler;