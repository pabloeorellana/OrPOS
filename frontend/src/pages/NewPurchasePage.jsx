import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Autocomplete, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, MenuItem } from '@mui/material';
import { createFilterOptions } from '@mui/material/Autocomplete';
import DeleteIcon from '@mui/icons-material/Delete';
import apiClient from '../api/axios';

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
        apiClient.get('/products').then(res => setProducts(res.data));
    };

    useEffect(() => {
        apiClient.get('/suppliers').then(res => setSuppliers(res.data));
        fetchProducts();
    }, []);

    useEffect(() => {
        const total = purchaseItems.reduce((sum, item) => {
            const quantity = parseFloat(String(item.quantity).replace(',', '.')) || 0;
            const cost = parseFloat(String(item.cost).replace(',', '.')) || 0;
            return sum + (quantity * cost);
        }, 0);
        setTotalAmount(total);
    }, [purchaseItems]);

    const handleAddProduct = async () => {
        if (!selectedProduct) {
            alert("Por favor, selecciona o crea un producto.");
            return;
        }
        let productToAdd = selectedProduct;

        if (selectedProduct.inputValue) {
            try {
                const newProductData = { name: selectedProduct.inputValue, cost: 0, price: 0, stock: 0 };
                const response = await apiClient.post('/products', newProductData);
                productToAdd = response.data;
                fetchProducts();
            } catch (error) {
                alert("No se pudo crear el nuevo producto.");
                return;
            }
        }

        if (purchaseItems.some(item => item.id === productToAdd.id)) {
            alert("El producto ya está en la lista.");
            return;
        }

        setPurchaseItems([...purchaseItems, { 
            ...productToAdd, 
            quantity: 1, 
            cost: parseFloat(productToAdd.cost) || 0,
            purchase_unit: 'unitario' 
        }]);
        setSelectedProduct(null);
    };
    
    // El onChange ahora es más simple
    const handleItemChange = (productId, field, value) => {
        setPurchaseItems(purchaseItems.map(item => 
            item.id === productId ? { ...item, [field]: value } : item
        ));
    };

    const handleRemoveItem = (productId) => {
        setPurchaseItems(purchaseItems.filter(item => item.id !== productId));
    };
    
    // La conversión se hace aquí, al momento de guardar
    const handleSavePurchase = async () => {
        if (purchaseItems.length === 0) {
            alert("Añade al menos un producto a la compra.");
            return;
        }
        const purchaseData = {
            supplierId: selectedSupplier ? selectedSupplier.id : null,
            totalAmount: totalAmount,
            items: purchaseItems.map(item => ({
                id: item.id,
                quantity: parseFloat(String(item.quantity).replace(',', '.')),
                cost: parseFloat(String(item.cost).replace(',', '.'))
            }))
        };
        try {
            await apiClient.post('/purchases', purchaseData);
            alert("Compra registrada exitosamente!");
            navigate('/purchases');
        } catch (error) {
            alert("Hubo un error al registrar la compra.");
        }
    };

    return (
        <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h4" gutterBottom>Registrar Nueva Compra</Typography>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Autocomplete
                    sx={{ flex: 1 }}
                    options={suppliers}
                    getOptionLabel={(option) => option.name}
                    value={selectedSupplier}
                    onChange={(e, val) => setSelectedSupplier(val)}
                    renderInput={(params) => <TextField {...params} label="Seleccionar Proveedor (Opcional)" />}
                />
                <Autocomplete
                    sx={{ flex: 1 }}
                    value={selectedProduct}
                    onChange={(event, newValue) => {
                        if (typeof newValue === 'string') {
                            setSelectedProduct({ inputValue: newValue, name: `Añadir "${newValue}"` });
                        } else if (newValue && newValue.inputValue) {
                            setSelectedProduct(newValue);
                        } else {
                            setSelectedProduct(newValue);
                        }
                    }}
                    filterOptions={(options, params) => {
                        const filtered = filter(options, params);
                        const { inputValue } = params;
                        const isExisting = options.some((option) => inputValue === option.name);
                        if (inputValue !== '' && !isExisting) {
                            filtered.push({ inputValue: inputValue, name: `Añadir "${inputValue}"` });
                        }
                        return filtered;
                    }}
                    options={products}
                    getOptionLabel={(option) => {
                        if (typeof option === 'string') return option;
                        if (option.inputValue) return option.inputValue;
                        return option.name;
                    }}
                    renderOption={(props, option) => <li {...props}>{option.name}</li>}
                    selectOnFocus
                    clearOnBlur
                    handleHomeEndKeys
                    freeSolo
                    renderInput={(params) => <TextField {...params} label="Buscar o Crear Producto" />}
                />
                <Button variant="contained" onClick={handleAddProduct} sx={{ height: '56px' }}>Añadir</Button>
            </Box>
            
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Producto</TableCell>
                            <TableCell align="center">Unidad de Compra</TableCell>
                            <TableCell align="center">Cantidad</TableCell>
                            <TableCell align="center">Costo Unitario</TableCell>
                            <TableCell align="center">Subtotal</TableCell>
                            <TableCell align="center">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {purchaseItems.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>{item.name}</TableCell>
                                <TableCell align="center">
                                    <TextField value={item.purchase_unit} onChange={(e) => handleItemChange(item.id, 'purchase_unit', e.target.value)} select size="small" sx={{ width: '120px' }}>
                                        <MenuItem value="unitario">Unidad</MenuItem>
                                        <MenuItem value="peso">Kg</MenuItem>
                                    </TextField>
                                </TableCell>
                                <TableCell align="center">
                                    <TextField 
                                        type="text"
                                        value={item.quantity} 
                                        onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)} 
                                        sx={{ width: '100px' }} size="small" 
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <TextField 
                                        type="text"
                                        value={item.cost} 
                                        onChange={(e) => handleItemChange(item.id, 'cost', e.target.value)} 
                                        sx={{ width: '120px' }} 
                                        size="small" 
                                        InputProps={{startAdornment: '$'}}
                                    />
                                </TableCell>
                                <TableCell align="center">${(Number(String(item.quantity).replace(',', '.')) * Number(String(item.cost).replace(',', '.'))).toFixed(2)}</TableCell>
                                <TableCell align="center">
                                    <IconButton onClick={() => handleRemoveItem(item.id)} color="error"><DeleteIcon /></IconButton>
                                </TableCell>
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