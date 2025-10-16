import React, { useState, useEffect, useRef } from 'react';
import { Grid, Paper, TextField, Typography, List, ListItem, ListItemText, IconButton, Box, Button, Divider, Avatar } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';
import MoneyIcon from '@mui/icons-material/Money';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import QrCodeIcon from '@mui/icons-material/QrCode';
import apiClient from '../api/axios';
import { useAuth } from '../context/AuthContext';

// Sub-componente para mostrar cada producto en la lista de búsqueda
const ProductCard = ({ product, onAdd }) => (
    <Paper variant="outlined" sx={{ p: 1, display: 'flex', alignItems: 'center', mb: 1.5, gap: 2 }}>
        <Avatar 
            variant="rounded" 
            src={product.image_url}
            sx={{ width: 56, height: 56, bgcolor: 'grey.200' }}
        >
            <ShoppingBasketIcon />
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body1" fontWeight="500">{product.name}</Typography>
            <Typography variant="body2" color="text.secondary">Stock: {product.stock}</Typography>
        </Box>
        <Typography variant="h6" fontWeight="500" sx={{ width: '100px', textAlign: 'right' }}>
            ${parseFloat(product.price).toFixed(2)}
        </Typography>
        <IconButton color="secondary" onClick={() => onAdd(product)}>
            <AddShoppingCartIcon sx={{ fontSize: 30 }} />
        </IconButton>
    </Paper>
);


const POSPage = () => {
    const [cart, setCart] = useState([]);
    const [total, setTotal] = useState(0);
    const [allProducts, setAllProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showPaymentOptions, setShowPaymentOptions] = useState(false);
    const barcodeInputRef = useRef(null);
    const { user, activeShift } = useAuth();

    useEffect(() => {
        const fetchAllProducts = async () => {
            try {
                const response = await apiClient.get('/products');
                setAllProducts(response.data);
                setFilteredProducts(response.data);
            } catch (error) {
                console.error("No se pudieron cargar los productos", error);
            }
        };
        fetchAllProducts();
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (!searchTerm) {
                setFilteredProducts(allProducts);
            } else {
                setFilteredProducts(
                    allProducts.filter(p =>
                        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.barcode?.includes(searchTerm)
                    )
                );
            }
        }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm, allProducts]);

    useEffect(() => {
        const newTotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
        setTotal(newTotal);
    }, [cart]);

    useEffect(() => {
        if (cart.length === 0) {
            setShowPaymentOptions(false);
        }
    }, [cart]);

    const addProductToCart = (product) => {
        const existingProduct = cart.find(item => item.id === product.id);
        if (existingProduct) {
            updateCartQuantity(product.id, existingProduct.quantity + 1);
        } else {
            setCart([...cart, { ...product, price: parseFloat(product.price), quantity: 1 }]);
        }
        setSearchTerm('');
        barcodeInputRef.current?.focus();
    };

    const handleBarcodeSubmit = async (e) => {
        e.preventDefault();
        if (!searchTerm) return;
        try {
            const response = await apiClient.get(`/products/barcode/${searchTerm}`);
            addProductToCart(response.data);
        } catch (error) {
            // No hacer nada si no se encuentra
        }
    };

    const updateCartQuantity = (productId, newQuantity) => {
        const quantity = Math.max(1, parseInt(newQuantity) || 1);
        setCart(cart.map(item =>
            item.id === productId ? { ...item, quantity: quantity } : item
        ));
    };

    const handleRemoveItem = (productId) => {
        setCart(cart.filter(item => item.id !== productId));
    };

    const handleFinalizeSale = async (paymentMethod) => {
        if (cart.length === 0) return;
        
        const saleData = {
            userId: user.id,
            totalAmount: total,
            shiftId: activeShift.id,
            items: cart.map(item => ({ id: item.id, quantity: item.quantity, price: item.price })),
            paymentMethod: paymentMethod
        };

        try {
            await apiClient.post('/sales', saleData);
            alert(`Venta con ${paymentMethod} registrada!`);
            setCart([]);
            setShowPaymentOptions(false);
        } catch (error) {
            alert("Hubo un error al registrar la venta.");
        }
    };

    return (
        <Box sx={{ display: 'flex', gap: 2, height: 'calc(100vh - 112px)' }}>
            {/* Columna Izquierda */}
            <Paper sx={{ width: '60%', p: 2, display: 'flex', flexDirection: 'column' }}>
                <Box component="form" onSubmit={handleBarcodeSubmit}>
                    <TextField fullWidth label="Buscar productos" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} inputRef={barcodeInputRef} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pb: 1, borderBottom: 1, borderColor: 'divider', color: 'text.secondary', fontWeight: 'bold' }}>
                    <Typography>PRODUCTO</Typography>
                    <Typography sx={{ width: '100px', textAlign: 'right' }}>PRECIO</Typography>
                    <Box sx={{ width: '48px' }} />
                </Box>
                <Box sx={{ flexGrow: 1, overflowY: 'auto', pt: 1 }}>
                    {filteredProducts.map(product => (
                        <ProductCard key={product.id} product={product} onAdd={addProductToCart} />
                    ))}
                </Box>
            </Paper>

            {/* Columna Derecha */}
            <Paper sx={{ width: '40%', p: 2, display: 'flex', flexDirection: 'column', bgcolor: '#eef2f5' }}>
                <Typography variant="h6">Venta Actual</Typography>
                <Box sx={{ display: 'flex', color: 'text.secondary', fontWeight: 'bold', borderBottom: 1, borderColor: 'divider', pb: 1, mt: 1, px: 2 }}>
                    <Typography sx={{ width: '15%' }}>CANT</Typography>
                    <Typography sx={{ flexGrow: 1 }}>NOMBRE</Typography>
                    <Typography sx={{ width: '25%', textAlign: 'right' }}>TOTAL</Typography>
                    <Box sx={{ width: '40px' }} />
                </Box>
                <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                    <List>
                        {cart.map(item => (
                           <ListItem key={item.id} disablePadding sx={{ display: 'flex', alignItems: 'center', py: 1, px: 2 }}>
                               <TextField type="number" value={item.quantity} onChange={(e) => updateCartQuantity(item.id, e.target.value)} sx={{ width: '15%' }} size="small" inputProps={{ min: 1, style: { textAlign: 'center' } }} />
                               <ListItemText primary={item.name} secondary={`@ $${item.price.toFixed(2)}`} sx={{ flexGrow: 1, ml: 2 }} />
                               <Typography sx={{ width: '25%', fontWeight: 'bold', textAlign: 'right' }}>${(item.price * item.quantity).toFixed(2)}</Typography>
                               <IconButton edge="end" color="error" onClick={() => handleRemoveItem(item.id)} sx={{ ml: 1 }}><DeleteIcon /></IconButton>
                           </ListItem>
                        ))}
                    </List>
                </Box>
                <Box sx={{ pt: 2, mt: 'auto', borderTop: 1, borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, mb: 2 }}>
                        <Typography variant="h5">Total:</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 500 }}>${total.toFixed(2)}</Typography>
                    </Box>
                    {!showPaymentOptions ? (
                        <Button fullWidth variant="contained" color="secondary" sx={{ py: 1.5, fontSize: '1.2rem' }} onClick={() => setShowPaymentOptions(true)} disabled={cart.length === 0}>
                            Pagar ${total.toFixed(2)}
                        </Button>
                    ) : (
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textAlign:'center' }}>SELECCIONE MÉTODO DE PAGO:</Typography>
                            <Grid container spacing={1}>
                                <Grid item xs={6}><Button fullWidth variant="contained" onClick={() => handleFinalizeSale('Efectivo')} startIcon={<MoneyIcon />} sx={{ height: '50px' }}>Efectivo</Button></Grid>
                                <Grid item xs={6}><Button fullWidth variant="contained" onClick={() => handleFinalizeSale('Tarjeta')} startIcon={<CreditCardIcon />} sx={{ height: '50px' }}>Tarjeta</Button></Grid>
                                <Grid item xs={6}><Button fullWidth variant="contained" onClick={() => handleFinalizeSale('Transferencia')} startIcon={<SwapHorizIcon />} sx={{ height: '50px' }}>Transf.</Button></Grid>
                                <Grid item xs={6}><Button fullWidth variant="contained" onClick={() => handleFinalizeSale('QR')} startIcon={<QrCodeIcon />} sx={{ height: '50px' }}>QR</Button></Grid>
                            </Grid>
                            <Button fullWidth variant="text" size="small" color="error" sx={{mt: 1}} onClick={() => setShowPaymentOptions(false)}>Cancelar</Button>
                        </Box>
                    )}
                </Box>
            </Paper>
        </Box>
    );
};

export default POSPage;