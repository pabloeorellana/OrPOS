import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Autocomplete, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material';
import { createFilterOptions } from '@mui/material/Autocomplete';
import DeleteIcon from '@mui/icons-material/Delete';
import apiClient from '../api/axios'; // <-- Corregido

const filter = createFilterOptions();

const NewPurchasePage = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [purchaseItems, setPurchaseItems] = useState([]);
    const [totalAmount, setTotalAmount] = useState(0);
    const navigate = useNavigate();

    const fetchProducts = () => {
        apiClient.get('/products').then(res => setProducts(res.data)); // <-- Corregido
    };

    useEffect(() => {
        apiClient.get('/suppliers').then(res => setSuppliers(res.data)); // <-- Corregido
        fetchProducts();
    }, []);

    useEffect(() => {
        const total = purchaseItems.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.cost)), 0);
        setTotalAmount(total);
    }, [purchaseItems]);

    const handleAddProduct = async () => {
        if (!selectedProduct) return;
        let productToAdd = selectedProduct;
        if (selectedProduct.inputValue) {
            try {
                const newProductData = { name: selectedProduct.inputValue, cost: 0, price: 0, stock: 0 };
                const response = await apiClient.post('/products', newProductData); // <-- Corregido
                productToAdd = response.data;
                fetchProducts();
            } catch (error) { alert("No se pudo crear el nuevo producto."); return; }
        }
        if (purchaseItems.some(item => item.id === productToAdd.id)) {
            alert("El producto ya está en la lista."); return;
        }
        setPurchaseItems([...purchaseItems, { ...productToAdd, quantity: 1, cost: parseFloat(productToAdd.cost) || 0 }]);
        setSelectedProduct(null);
    };

    const handleItemChange = (productId, field, value) => {
        setPurchaseItems(purchaseItems.map(item => item.id === productId ? { ...item, [field]: value } : item));
    };

    const handleRemoveItem = (productId) => setPurchaseItems(purchaseItems.filter(item => item.id !== productId));
    
    const handleSavePurchase = async () => {
        if (purchaseItems.length === 0) return;
        const purchaseData = {
            supplierId: selectedSupplier ? selectedSupplier.id : null,
            totalAmount: parseFloat(totalAmount),
            items: purchaseItems.map(item => ({ id: item.id, quantity: parseInt(item.quantity, 10), cost: parseFloat(item.cost) }))
        };
        try {
            await apiClient.post('/purchases', purchaseData); // <-- Corregido
            alert("Compra registrada exitosamente!");
            navigate('/purchases');
        } catch (error) { alert("Hubo un error al registrar la compra."); }
    };

    return (
        <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h4" gutterBottom>Registrar Nueva Compra</Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Autocomplete sx={{ flex: 1 }} options={suppliers} getOptionLabel={(o) => o.name} value={selectedSupplier} onChange={(e, v) => setSelectedSupplier(v)} renderInput={(p) => <TextField {...p} label="Seleccionar Proveedor" />} />
                <Autocomplete sx={{ flex: 1 }} value={selectedProduct} onChange={(e, v) => setSelectedProduct(v)} filterOptions={(o, p) => { const f = filter(o, p); if (p.inputValue !== '') { f.push({ inputValue: p.inputValue, name: `Añadir "${p.inputValue}"` }); } return f; }} options={products} getOptionLabel={(o) => o.inputValue ? o.name : `${o.name} (Stock: ${o.stock})`} selectOnFocus clearOnBlur handleHomeEndKeys freeSolo renderInput={(p) => <TextField {...p} label="Buscar o Crear Producto" />} />
                <Button variant="contained" onClick={handleAddProduct} sx={{ height: '56px' }}>Añadir</Button>
            </Box>
            <TableContainer component={Paper}>
                <Table><TableHead><TableRow><TableCell>Producto</TableCell><TableCell align="center">Cantidad</TableCell><TableCell align="center">Costo Unitario</TableCell><TableCell align="center">Subtotal</TableCell><TableCell align="center">Acciones</TableCell></TableRow></TableHead>
                    <TableBody>
                        {purchaseItems.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>{item.name}</TableCell>
                                <TableCell align="center"><TextField type="number" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)} sx={{ width: '100px' }} size="small" /></TableCell>
                                <TableCell align="center"><TextField type="number" value={item.cost} onChange={(e) => handleItemChange(item.id, 'cost', e.target.value)} sx={{ width: '120px' }} size="small" InputProps={{ startAdornment: '$' }} /></TableCell>
                                <TableCell align="center">${(Number(item.quantity) * Number(item.cost)).toFixed(2)}</TableCell>
                                <TableCell align="center"><IconButton onClick={() => handleRemoveItem(item.id)} color="error"><DeleteIcon /></IconButton></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                <Button variant="outlined" color="secondary" onClick={() => navigate('/purchases')}>Cancelar</Button>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Typography variant="h5">Total: ${totalAmount.toFixed(2)}</Typography>
                    <Button variant="contained" color="primary" onClick={handleSavePurchase} disabled={purchaseItems.length === 0}>Guardar Compra</Button>
                </Box>
            </Box>
        </Paper>
    );
};

export default NewPurchasePage;