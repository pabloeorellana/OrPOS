import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Checkbox, Paper } from '@mui/material';
import apiClient from '../api/axios';
import { useSnackbar } from '../context/SnackbarContext';

const style = {
  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  width: 700, bgcolor: 'background.paper', border: '2px solid #000',
  boxShadow: 24, p: 4, borderRadius: 2
};

const ReturnModal = ({ open, onClose, onSave, sale }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showSnackbar } = useSnackbar();

  // Cargar los items de la venta cuando el modal se abre
useEffect(() => {
  if (open && sale) {
    setLoading(true);
    apiClient.get(`/sales/${sale.id}`)
      .then(res => {
        // Accedemos a la propiedad correcta: res.data.saleItems
        const saleItems = res.data.saleItems.map(item => ({
          ...item,
          selected: false,
          returnQuantity: 1,
          originalQuantity: item.quantity,
        }));
        setItems(saleItems);
        setLoading(false);
      });
  }
}, [sale, open]);

  const handleCheckboxChange = (productName) => {
    setItems(items.map(item =>
      item.name === productName ? { ...item, selected: !item.selected } : item
    ));
  };

  const handleQuantityChange = (productName, newQuantity) => {
    const originalItem = items.find(item => item.name === productName);
    // Validar que la cantidad a devolver no exceda la cantidad original de la venta
    const quantity = Math.min(originalItem.originalQuantity, Math.max(1, parseInt(newQuantity) || 1));
    
    setItems(items.map(item =>
      item.name === productName ? { ...item, returnQuantity: quantity } : item
    ));
  };

  const handleSave = () => {
    const itemsToReturn = items.filter(item => item.selected);
    if (itemsToReturn.length === 0) {
      showSnackbar("Debes seleccionar al menos un producto para devolver.", "warning");
      return;
    }
    
    const totalAmount = itemsToReturn.reduce((sum, item) => sum + (item.price_at_time * item.returnQuantity), 0);
    
    const returnData = {
      saleId: sale.id,
      totalAmount,
      items: itemsToReturn.map(item => ({
        product_id: item.product_id, // Necesitamos el ID del producto
        quantity: item.returnQuantity,
        price_at_time: item.price_at_time,
      })),
    };

    onSave(returnData);
  };
  
  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6">Registrar Devolución para Venta #{sale?.id}</Typography>
        {loading ? <p>Cargando productos...</p> : (
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox"></TableCell>
                  <TableCell>Producto</TableCell>
                  <TableCell align="center">Cant. Original</TableCell>
                  <TableCell align="center">Cant. a Devolver</TableCell>
                  <TableCell align="right">Precio Unitario</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.product_id}>
                    <TableCell padding="checkbox">
                      <Checkbox checked={item.selected} onChange={() => handleCheckboxChange(item.name)} />
                    </TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell align="center">{item.originalQuantity}</TableCell>
                    <TableCell align="center">
                      <TextField
                        type="number"
                        size="small"
                        sx={{ width: '80px' }}
                        value={item.returnQuantity}
                        onChange={(e) => handleQuantityChange(item.name, e.target.value)}
                        disabled={!item.selected}
                        InputProps={{ inputProps: { min: 1, max: item.originalQuantity } }}
                      />
                    </TableCell>
                    <TableCell align="right">${parseFloat(item.price_at_time).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose} sx={{ mr: 1 }}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={loading}>
            Confirmar Devolución
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default ReturnModal;