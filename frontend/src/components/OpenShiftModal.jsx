import React, { useState } from 'react';
import { Modal, Box, Typography, TextField, Button } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const style = {
  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  width: 400, bgcolor: 'background.paper', border: '2px solid #000',
  boxShadow: 24, p: 4, borderRadius: 2
};

const OpenShiftModal = ({ open, onClose }) => {
    const [openingBalance, setOpeningBalance] = useState('');
    const { startShift } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (openingBalance === '' || isNaN(openingBalance)) {
            alert('Por favor, ingresa un monto de apertura válido.');
            return;
        }
        const success = await startShift(parseFloat(openingBalance));
        if (success) {
            onClose();
        } else {
            alert('No se pudo iniciar el turno. Inténtalo de nuevo.');
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={style} component="form" onSubmit={handleSubmit}>
                <Typography variant="h6" component="h2">Abrir Caja</Typography>
                <TextField
                    label="Monto de Apertura"
                    type="number"
                    fullWidth
                    required
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                    sx={{ mt: 2 }}
                    autoFocus
                />
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button onClick={onClose} sx={{ mr: 1 }}>Cancelar</Button>
                    <Button type="submit" variant="contained">Iniciar Turno</Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default OpenShiftModal;