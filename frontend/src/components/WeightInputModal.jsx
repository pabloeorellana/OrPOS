import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, TextField, Button } from '@mui/material';
import { useSnackbar } from '../context/SnackbarContext';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const WeightInputModal = ({ open, onClose, onConfirm, product }) => {
    const [weight, setWeight] = useState('');
    const inputRef = React.useRef(null);
    const { showSnackbar } = useSnackbar();

    // Enfocar el campo de texto cuando el modal se abre
    useEffect(() => {
        if (open) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [open]);

    const handleConfirm = () => {
        const numericWeight = parseFloat(weight);
        if (numericWeight > 0) {
            onConfirm(numericWeight);
            setWeight(''); // Limpiar para la próxima vez
        } else {
            showSnackbar('Por favor, ingresa un peso válido.', 'warning');
        }
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleConfirm();
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={style}>
                <Typography variant="h6" component="h2">
                    Ingresar Peso para:
                </Typography>
                <Typography variant="h5" color="primary" sx={{ mb: 2 }}>
                    {product?.name}
                </Typography>
                <TextField
                    label="Peso en Kg (ej: 0.250 para 250gr)"
                    type="number"
                    fullWidth
                    autoFocus
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    onKeyPress={handleKeyPress}
                    inputRef={inputRef}
                    InputProps={{ inputProps: { step: "0.001", min: 0 } }}
                />
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button onClick={onClose} sx={{ mr: 1 }}>Cancelar</Button>
                    <Button variant="contained" onClick={handleConfirm}>
                        Aceptar
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default WeightInputModal;