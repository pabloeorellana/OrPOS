import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Modal, Paper, Typography, Button, Box } from '@mui/material';
import OpenShiftModal from './OpenShiftModal';
import { useLocation } from 'react-router-dom';

const ShiftHandler = ({ children }) => {
    const { user, activeShift, logout, shiftLoading } = useAuth();
    const location = useLocation();
    const [openModal, setOpenModal] = useState(false);

    if (shiftLoading) {
        return null;
    }

    // admin bypass
    if (user?.isSuperAdmin || user?.role === 'admin' || user?.role === 'administrador') {
        return children;
    }

    // Mostrar bloqueo SOLO en rutas del POS
    const pathParts = location.pathname.split('/').filter(Boolean);
    const isPosRoute = pathParts[pathParts.length - 1] === 'pos' || pathParts.includes('pos');

    // Para empleados: bloquear UI con un modal si no hay turno activo y está en POS
    return (
        <>
            <Modal
                open={isPosRoute && !activeShift}
                onClose={() => { /* bloqueado: no cerrar al clicar afuera */ }}
                disableEscapeKeyDown
                BackdropProps={{ sx: { backdropFilter: 'blur(3px)' } }}
                aria-labelledby="shift-blocker-title"
            >
                <Paper sx={{ p: 4, width: 420, maxWidth: '90%', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', outline: 'none' }}>
                    <Typography id="shift-blocker-title" component="h1" variant="h5" fontWeight={600}>
                        Bienvenido, {user?.username}
                    </Typography>
                    <Typography sx={{ mt: 2, textAlign: 'center' }}>
                        Debes abrir la caja para empezar a operar.
                    </Typography>
                    <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
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
                            onClick={logout}
                        >
                            Cerrar Sesión
                        </Button>
                    </Box>
                    <OpenShiftModal open={openModal} onClose={() => setOpenModal(false)} />
                </Paper>
            </Modal>
            {children}
        </>
    );
};

export default ShiftHandler;