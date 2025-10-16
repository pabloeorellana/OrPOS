import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Container, Paper, Typography, Button } from '@mui/material';
import OpenShiftModal from './OpenShiftModal';

const ShiftHandler = ({ children }) => {
    const { user, activeShift } = useAuth();
    const [openModal, setOpenModal] = useState(false);

    // --- LÓGICA CORREGIDA ---
    // Si el usuario es administrador, no aplicamos ninguna restricción de turno.
    if (user?.role === 'administrador') {
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
                    <Button
                        variant="contained"
                        sx={{ mt: 3, py: 1.5, px: 5 }}
                        onClick={() => setOpenModal(true)}
                    >
                        Abrir Caja
                    </Button>
                </Paper>
                <OpenShiftModal open={openModal} onClose={() => setOpenModal(false)} />
            </Container>
        );
    }

    // Si hay un turno activo para el empleado/propietario, muestra el contenido.
    return children;
};

export default ShiftHandler;