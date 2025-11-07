import React, { useState } from 'react';
import { Modal, Box, Typography, TextField, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSnackbar } from '../context/SnackbarContext';
import { getTenantFromPath } from '../utils/tenantHelper';

const style = {
  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  width: 400, bgcolor: 'background.paper', border: '2px solid #000',
  boxShadow: 24, p: 4, borderRadius: 2
};

const OpenShiftModal = ({ open, onClose }) => {
    const [openingBalance, setOpeningBalance] = useState('');
    const [openingVirtualBalance, setOpeningVirtualBalance] = useState('');
    const { startShift, shiftLoading } = useAuth();
    const { showSnackbar } = useSnackbar();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const cashBalance = parseFloat(openingBalance) || 0;
        const virtualBalance = parseFloat(openingVirtualBalance) || 0;

        if (openingBalance === '' || isNaN(cashBalance)) {
            showSnackbar('Por favor, ingresa un monto de apertura de efectivo válido.', 'warning');
            return;
        }

        const success = await startShift({
            openingBalance: cashBalance,
            openingVirtualBalance: virtualBalance
        });

        if (success) {
            onClose();
            const tenant = getTenantFromPath();
            const target = tenant ? `/${tenant}/pos` : '/pos';
            navigate(target, { replace: true });
            return;
        }

        showSnackbar('No se pudo iniciar el turno. Inténtalo de nuevo.', 'error');
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={style} component="form" onSubmit={handleSubmit}>
                <Typography variant="h6" component="h2">Abrir Caja</Typography>
                <TextField
                    label="Saldo Inicial en Efectivo"
                    type="number"
                    fullWidth
                    required
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                    sx={{ mt: 2 }}
                    autoFocus
                />
                <TextField
                    label="Saldo Inicial Billeteras Virtuales"
                    type="number"
                    fullWidth
                    required
                    value={openingVirtualBalance}
                    onChange={(e) => setOpeningVirtualBalance(e.target.value)}
                    sx={{ mt: 2 }}
                />
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button onClick={onClose} sx={{ mr: 1 }} disabled={shiftLoading}>Cancelar</Button>
                    <Button type="submit" variant="contained" disabled={shiftLoading}>{shiftLoading ? 'Iniciando...' : 'Iniciar Turno'}</Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default OpenShiftModal;
