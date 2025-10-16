import React from 'react';
import { Modal, Box, Typography, Button, Grid } from '@mui/material';

const style = {
  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  width: 400, bgcolor: 'background.paper', border: '2px solid #000', boxShadow: 24, p: 4
};

const PaymentModal = ({ open, onClose, onFinalize }) => {
    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={style}>
                <Typography variant="h6" component="h2" textAlign="center">
                    Seleccionar Medio de Pago
                </Typography>
                <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={12}>
                        <Button fullWidth variant="contained" onClick={() => onFinalize('Efectivo')} sx={{ py: 1.5 }}>Efectivo</Button>
                    </Grid>
                    <Grid item xs={12}>
                        <Button fullWidth variant="contained" onClick={() => onFinalize('Tarjeta')} sx={{ py: 1.5 }}>Tarjeta</Button>
                    </Grid>
                    <Grid item xs={12}>
                        <Button fullWidth variant="outlined" onClick={() => onFinalize('Otro')}>Otro</Button>
                    </Grid>
                </Grid>
            </Box>
        </Modal>
    );
};

export default PaymentModal;