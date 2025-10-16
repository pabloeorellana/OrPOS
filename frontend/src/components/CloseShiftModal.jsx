import React, { useState } from 'react';
import { Modal, Box, Typography, TextField, Button } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const style = { /* ... (mismo estilo que el modal anterior) ... */ 
  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  width: 400, bgcolor: 'background.paper', border: '2px solid #000',
  boxShadow: 24, p: 4, borderRadius: 2
};

const CloseShiftModal = ({ open, onClose }) => {
    const [closingBalance, setClosingBalance] = useState('');
    const { endShift } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (closingBalance === '' || isNaN(closingBalance)) {
            alert('Por favor, ingresa un monto de cierre válido.');
            return;
        }
        const success = await endShift(parseFloat(closingBalance));
        if (success) {
            onClose();
        } else {
            alert('No se pudo cerrar el turno.');
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={style} component="form" onSubmit={handleSubmit}>
                <Typography variant="h6" component="h2">Cerrar Caja</Typography>
                <TextField
                    label="Monto de Cierre (conteo de efectivo)"
                    type="number"
                    fullWidth
                    required
                    value={closingBalance}
                    onChange={(e) => setClosingBalance(e.target.value)}
                    sx={{ mt: 2 }}
                    autoFocus
                />
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button onClick={onClose} sx={{ mr: 1 }}>Cancelar</Button>
                    <Button type="submit" variant="contained" color="error">Cerrar Turno</Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default CloseShiftModal;