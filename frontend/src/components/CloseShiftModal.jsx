import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, TextField, Button, Paper, Divider } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useSnackbar } from '../context/SnackbarContext';

const style = { 
  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  width: 450, bgcolor: 'background.paper', border: '2px solid #000',
  boxShadow: 24, p: 4, borderRadius: 2
};

// Evita romper si llegan null/undefined
const SummaryLine = ({ label, value }) => {
  const num = parseFloat(value);
  const safe = Number.isFinite(num) ? num : 0;
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 0.5 }}>
      <Typography variant="body2">{label}:</Typography>
      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>${safe.toFixed(2)}</Typography>
    </Box>
  );
};

const CloseShiftModal = ({ open, onClose, onShiftClosed }) => {
  const [closingBalance, setClosingBalance] = useState('');
  const [closingVirtualBalance, setClosingVirtualBalance] = useState('');
  const [summary, setSummary] = useState(null);

  const { endShift, setActiveShift, logout } = useAuth();
  const { showSnackbar } = useSnackbar();

  // Al reabrir el modal, limpiamos estado
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

    if (closingBalance === '' || Number.isNaN(cash)) {
      showSnackbar('Por favor, ingresa un monto de cierre de efectivo válido.', 'warning');
      return;
    }

    const result = await endShift({ closingBalance: cash, closingVirtualBalance: virtual });
    if (result) {
      setSummary(result); // mostramos resumen
    } else {
      showSnackbar('No se pudo cerrar el turno.', 'error');
    }
  };

  // NUEVA POLÍTICA: al cerrar el resumen, se cierra sesión
  const handleSummaryClose = () => {
    setSummary(null);
    setActiveShift(null); // limpiamos turno actual en memoria
    logout();             // forzamos volver a login
  };

  // Evitamos cerrar el modal con "escape/click afuera" cuando está el resumen
  const handleModalClose = () => {
    if (!summary && onClose) onClose();
  };

  return (
    <Modal open={open} onClose={summary ? undefined : handleModalClose}>
      <Box sx={style}>
        {summary ? (
          <>
            <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
              Resumen del Turno
            </Typography>

            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Detalles de Efectivo:</Typography>
              <SummaryLine label="Saldo Inicial" value={summary.cashDetails?.openingBalance} />
              <SummaryLine label="Ventas en Efectivo" value={summary.cashDetails?.totalCashSales} />
              <SummaryLine label="Devoluciones en Efectivo" value={summary.cashDetails?.totalCashReturns} />
              <SummaryLine label="Pagos en Efectivo" value={summary.cashDetails?.totalCashPayments} />
              <Divider sx={{ my: 1 }} />
              <SummaryLine label="Esperado en Caja" value={summary.cashDetails?.expectedInCash} />
              <SummaryLine label="Cierre de Caja" value={summary.cashDetails?.closingBalance} />
              <SummaryLine label="Diferencia" value={summary.cashDetails?.difference} />
            </Paper>

            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Detalles Virtuales:</Typography>
              <SummaryLine label="Saldo Inicial Virtual" value={summary.virtualDetails?.openingVirtualBalance} />
              <SummaryLine label="Ventas Virtuales" value={summary.virtualDetails?.totalVirtualSales} />
              <SummaryLine label="Pagos Virtuales" value={summary.virtualDetails?.totalVirtualPayments} />
              <Divider sx={{ my: 1 }} />
              <SummaryLine label="Esperado Virtual" value={summary.virtualDetails?.expectedVirtualBalance} />
              <SummaryLine label="Cierre Virtual" value={summary.virtualDetails?.closingVirtualBalance} />
              <SummaryLine label="Diferencia Virtual" value={summary.virtualDetails?.differenceVirtual} />
            </Paper>

            <Button onClick={handleSummaryClose} variant="contained" sx={{ mt: 3 }}>
              Cerrar
            </Button>
          </>
        ) : (
          <>
            <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
              Cerrar Caja
            </Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              <TextField
                label="Saldo de Cierre (Efectivo)"
                type="number"
                fullWidth
                value={closingBalance}
                onChange={(e) => setClosingBalance(e.target.value)}
                sx={{ mb: 2 }}
                required
              />
              <TextField
                label="Saldo de Cierre (Virtual)"
                type="number"
                fullWidth
                value={closingVirtualBalance}
                onChange={(e) => setClosingVirtualBalance(e.target.value)}
                sx={{ mb: 2 }}
                required
              />
              <Button type="submit" variant="contained" color="primary" fullWidth>
                Cerrar Turno
              </Button>
              <Button onClick={handleModalClose} fullWidth sx={{ mt: 1 }}>
                Cancelar
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Modal>
  );
};

export default CloseShiftModal;
