import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, TextField, Button, Grid, Paper, Divider } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const style = { 
  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  width: 450, bgcolor: 'background.paper', border: '2px solid #000',
  boxShadow: 24, p: 4, borderRadius: 2
};

const SummaryLine = ({ label, value }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 0.5 }}>
        <Typography variant="body2">{label}:</Typography>
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>${value.toFixed(2)}</Typography>
    </Box>
);

const CloseShiftModal = ({ open, onClose }) => {
    const [closingBalance, setClosingBalance] = useState('');
    const [closingVirtualBalance, setClosingVirtualBalance] = useState('');
    const [summary, setSummary] = useState(null);
    const { endShift } = useAuth();

    // Reset state when modal is opened
    useEffect(() => {
        if (open) {
            setClosingBalance('');
            setClosingVirtualBalance('');
            setSummary(null);
        }
    }, [open]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const cash = parseFloat(closingBalance) || 0;
        const virtual = parseFloat(closingVirtualBalance) || 0;

        if (closingBalance === '' || isNaN(cash)) {
            alert('Por favor, ingresa un monto de cierre de efectivo válido.');
            return;
        }

        const result = await endShift({ closingBalance: cash, closingVirtualBalance: virtual });
        if (result) {
            setSummary(result); // Guardar el resumen para mostrarlo
        } else {
            alert('No se pudo cerrar el turno.');
        }
    };

    const handleClose = () => {
        onClose();
    };

    return (
        <Modal open={open} onClose={handleClose}>
            <Box sx={style}>
                <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
                    {summary ? 'Resumen del Turno' : 'Cerrar Caja'}
                </Typography>

                {summary ? (
                    <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>Desglose de Efectivo</Typography>
                        <SummaryLine label="Saldo Inicial" value={summary.cashDetails.openingBalance} />
                        <SummaryLine label="Ventas" value={summary.cashDetails.totalCashSales} />
                        <SummaryLine label="Devoluciones" value={-summary.cashDetails.totalCashReturns} />
                        <Divider sx={{ my: 1 }} />
                        <SummaryLine label="Saldo Esperado" value={summary.cashDetails.expectedInCash} />
                        <SummaryLine label="Saldo Real" value={summary.cashDetails.closingBalance} />
                        <SummaryLine label="Diferencia" value={summary.cashDetails.difference} />
                        
                        <Divider sx={{ my: 2 }} />

                        <Typography variant="subtitle1" gutterBottom>Desglose Virtual</Typography>
                        <SummaryLine label="Saldo Inicial" value={summary.virtualDetails.openingVirtualBalance} />
                        <SummaryLine label="Ventas" value={summary.virtualDetails.totalVirtualSales} />
                        <Divider sx={{ my: 1 }} />
                        <SummaryLine label="Saldo Esperado" value={summary.virtualDetails.expectedVirtualBalance} />
                        <SummaryLine label="Declarado" value={summary.virtualDetails.closingVirtualBalance} />
                        <SummaryLine label="Diferencia" value={summary.virtualDetails.virtualDifference} />
                    </Paper>
                ) : (
                    <Box component="form" onSubmit={handleSubmit}>
                        <TextField
                            label="Saldo Final en Efectivo"
                            type="number"
                            fullWidth
                            required
                            value={closingBalance}
                            onChange={(e) => setClosingBalance(e.target.value)}
                            sx={{ mt: 2 }}
                            autoFocus
                        />
                        <TextField
                            label="Saldo Final Billeteras Virtuales"
                            type="number"
                            fullWidth
                            required
                            value={closingVirtualBalance}
                            onChange={(e) => setClosingVirtualBalance(e.target.value)}
                            sx={{ mt: 2 }}
                        />
                    </Box>
                )}

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    {summary ? (
                        <Button onClick={handleClose} variant="contained">Cerrar</Button>
                    ) : (
                        <>
                            <Button onClick={handleClose} sx={{ mr: 1 }}>Cancelar</Button>
                            <Button onClick={handleSubmit} variant="contained" color="error">Cerrar Turno</Button>
                        </>
                    )}
                </Box>
            </Box>
        </Modal>
    );
};

export default CloseShiftModal;