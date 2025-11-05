import React, { useState, useEffect, useRef } from 'react';
import { Grid, Paper, TextField, Typography, List, ListItem, ListItemText, IconButton, Box, Button, Divider, Avatar, Chip, Switch, FormControlLabel } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';
import MoneyIcon from '@mui/icons-material/Money';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import QrCodeIcon from '@mui/icons-material/QrCode';
import apiClient from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import WeightInputModal from '../components/WeightInputModal';

const ProductCard = ({ product, onAdd }) => {
    const hasStock = product.stock > 0;
    return (
        <Paper 
            variant="outlined" 
            sx={{ p: 1, display: 'flex', alignItems: 'center', mb: 1.5, gap: 2, opacity: hasStock ? 1 : 0.6, cursor: hasStock ? 'pointer' : 'not-allowed' }}
            onClick={hasStock ? () => onAdd(product) : undefined}
        >
            <Avatar variant="rounded" src={product.image_url} sx={{ width: 56, height: 56, bgcolor: 'grey.200' }}><ShoppingBasketIcon /></Avatar>
            <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body1" fontWeight="500">{product.name}</Typography>
                <Chip 
                    size="small" 
                    label={hasStock ? `Stock: ${product.stock}` + (product.sale_type === 'peso' ? ' Kg' : '') : 'Sin Stock'} 
                    color={product.stock <= 5 && hasStock ? 'warning' : 'default'} 
                    sx={!hasStock ? { bgcolor: 'error.main', color: 'white' } : {}}
                />
            </Box>
            <Typography variant="h6" fontWeight="500" sx={{ width: '100px', textAlign: 'right' }}>
                ${parseFloat(product.price).toFixed(2)}
            </Typography>
            <IconButton color="secondary" onClick={(e) => { e.stopPropagation(); onAdd(product); }} disabled={!hasStock}><AddShoppingCartIcon sx={{ fontSize: 30 }} /></IconButton>
        </Paper>
    );
};

const POSPage = () => {
    const [cart, setCart] = useState([]);
    const [subtotal, setSubtotal] = useState(0);
    const [total, setTotal] = useState(0);
    const [tableServiceFee, setTableServiceFee] = useState(0);
    const [applyTableService, setApplyTableService] = useState(false);
    const [allProducts, setAllProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showPaymentOptions, setShowPaymentOptions] = useState(false);
    const [isWeightModalOpen, setWeightModalOpen] = useState(false);
    const [productToWeigh, setProductToWeigh] = useState(null);
    const barcodeInputRef = useRef(null);
    const { user, activeShift } = useAuth();
    const location = useLocation();
    
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [productsRes, settingsRes] = await Promise.all([
                    apiClient.get('/products'),
                    apiClient.get('/settings/table_service_fee')
                ]);
                setAllProducts(productsRes.data);
                setFilteredProducts(productsRes.data);
                setTableServiceFee(parseFloat(settingsRes.data.value) || 0);
            } catch (error) { console.error("Error al cargar datos iniciales:", error); }
        };
        fetchInitialData();
    }, [location.pathname]);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (!searchTerm) { setFilteredProducts(allProducts); } 
            else { setFilteredProducts(allProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode?.includes(searchTerm))); }
        }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm, allProducts]);

    useEffect(() => {
        const newSubtotal = cart.reduce((sum, item) => sum + item.final_price, 0);
        setSubtotal(newSubtotal);
    }, [cart]);

    useEffect(() => {
        const finalTotal = applyTableService ? subtotal + tableServiceFee : subtotal;
        setTotal(finalTotal);
    }, [subtotal, tableServiceFee, applyTableService]);

    useEffect(() => {
        if (cart.length === 0) { setShowPaymentOptions(false); setApplyTableService(false); }
    }, [cart]);

    const addProductToCart = (product) => {
        if (product.stock <= 0) { alert(`El producto "${product.name}" no tiene stock.`); return; }

        if (product.sale_type === 'peso') {
            setProductToWeigh(product);
            setWeightModalOpen(true);
            return;
        }

        const itemInCart = cart.find(item => item.product_id === product.id && !item.isWeighted);
        if (itemInCart && itemInCart.quantity >= product.stock) { alert(`No puedes añadir más de "${product.name}".`); return; }

        if (itemInCart) {
            updateCartQuantity(itemInCart.id, itemInCart.quantity + 1);
        } else {
            setCart([...cart, {
                id: `${product.id}-${Date.now()}`,
                product_id: product.id,
                name: product.name,
                price_per_unit: parseFloat(product.price),
                final_price: parseFloat(product.price),
                quantity: 1,
                isWeighted: false,
                stock: product.stock,
            }]);
        }
        setSearchTerm('');
        barcodeInputRef.current?.focus();
    };

    const handleWeightConfirm = (weight) => {
        const product = productToWeigh;
        if (weight > product.stock) {
            alert(`Stock insuficiente. Stock actual: ${product.stock} Kg.`);
            return;
        }
        const finalPrice = parseFloat(product.price) * weight;
        setCart([...cart, {
            id: `${product.id}-${Date.now()}`,
            product_id: product.id,
            name: `${product.name} (${weight.toFixed(3)} Kg)`,
            price_per_unit: parseFloat(product.price),
            final_price: finalPrice,
            quantity: weight,
            isWeighted: true,
            stock: product.stock,
        }]);
        setWeightModalOpen(false);
        setProductToWeigh(null);
        barcodeInputRef.current?.focus();
    };

    const handleBarcodeSubmit = async (e) => { e.preventDefault(); if (!searchTerm) return; try { const r = await apiClient.get(`/products/barcode/${searchTerm}`); addProductToCart(r.data); } catch (error) {} };
    
    const updateCartQuantity = (cartItemId, newQuantity) => {
        setCart(cart.map(item => {
            if (item.id === cartItemId && !item.isWeighted) {
                const quantity = Math.min(item.stock, Math.max(1, parseInt(newQuantity) || 1));
                return { ...item, quantity: quantity, final_price: item.price_per_unit * quantity };
            }
            return item;
        }));
    };

    const handleRemoveItem = (itemId) => setCart(cart.filter(i => i.id !== itemId));
    
    const handleFinalizeSale = async (paymentMethod) => {
        if (cart.length === 0) return;
        const saleData = {
            userId: user.id,
            totalAmount: total,
            shiftId: activeShift.id,
            paymentMethod: paymentMethod,
            items: cart.map(item => ({
                id: item.product_id,
                quantity: item.quantity,
                price: item.price_per_unit
            }))
        };
        try {
            await apiClient.post('/sales', saleData);
            alert(`Venta con ${paymentMethod} registrada!`);
            setCart([]);
            setShowPaymentOptions(false);
        } catch (error) {
            alert(error.response?.data?.message || "Error al registrar la venta.");
        }
    };

    return (
        <Box sx={{ display: 'flex', gap: 2, height: 'calc(100vh - 112px)' }}>
            <Paper sx={{ width: '60%', p: 2, display: 'flex', flexDirection: 'column' }}>
                <Box component="form" onSubmit={handleBarcodeSubmit}><TextField fullWidth label="Buscar productos" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} inputRef={barcodeInputRef} /></Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pb: 1, borderBottom: 1, borderColor: 'divider', color: 'text.secondary', fontWeight: 'bold' }}>
                    <Typography>PRODUCTO</Typography>
                    <Typography sx={{ width: '100px', textAlign: 'right', mr: 7.5 }}>PRECIO</Typography>
                </Box>
                <Box sx={{ flexGrow: 1, overflowY: 'auto', pt: 1 }}>{filteredProducts.map(product => (<ProductCard key={product.id} product={product} onAdd={addProductToCart} />))}</Box>
            </Paper>

            <Paper sx={{ width: '40%', p: 2, display: 'flex', flexDirection: 'column', bgcolor: '#eef2f5' }}>
                <Typography variant="h6">Venta Actual</Typography>
                <Box sx={{ display: 'flex', color: 'text.secondary', fontWeight: 'bold', borderBottom: 1, borderColor: 'divider', pb: 1, mt: 1, px: 2 }}>
                    <Typography sx={{ width: '15%' }}>CANT</Typography>
                    <Typography sx={{ flexGrow: 1 }}>NOMBRE</Typography>
                    <Typography sx={{ width: '25%', textAlign: 'right' }}>TOTAL</Typography>
                    <Box sx={{ width: '40px' }} />
                </Box>
                <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                    <List>{cart.map(item => (
                           <ListItem key={item.id} disablePadding sx={{ display: 'flex', alignItems: 'center', py: 1, px: 2 }}>
                               <TextField type="number" value={item.quantity} onChange={(e) => updateCartQuantity(item.id, e.target.value)} sx={{ width: '15%' }} size="small" disabled={item.isWeighted} inputProps={{ min: 1, max: item.stock, style: { textAlign: 'center' } }} />
                               <ListItemText primary={item.name} secondary={!item.isWeighted ? `$${item.price_per_unit.toFixed(2)}` : 'Por Peso'} sx={{ flexGrow: 1, ml: 2 }} />
                               <Typography sx={{ width: '25%', fontWeight: 'bold', textAlign: 'right' }}>${item.final_price.toFixed(2)}</Typography>
                               <IconButton edge="end" color="error" onClick={() => handleRemoveItem(item.id)} sx={{ ml: 1 }}><DeleteIcon /></IconButton>
                           </ListItem>
                        ))}
                    </List>
                </Box>
                <Box sx={{ pt: 2, mt: 'auto', borderTop: 1, borderColor: 'divider' }}>
                    <Box sx={{ px: 2, mb: 2 }}>
                        <FormControlLabel control={<Switch checked={applyTableService} onChange={(e) => setApplyTableService(e.target.checked)} color="secondary" />} label={`Servicio de Mesa (+ $${tableServiceFee.toFixed(2)})`} disabled={cart.length === 0 || tableServiceFee <= 0}/>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                            <Typography variant="h5">Total:</Typography>
                            <Typography variant="h4" sx={{ fontWeight: 500 }}>${total.toFixed(2)}</Typography>
                        </Box>
                    </Box>
                    {!showPaymentOptions ? (
                        <Button fullWidth variant="contained" color="secondary" sx={{ py: 1.5, fontSize: '1.2rem' }} onClick={() => setShowPaymentOptions(true)} disabled={cart.length === 0}>Pagar ${total.toFixed(2)}</Button>
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

            <WeightInputModal
                open={isWeightModalOpen}
                onClose={() => setWeightModalOpen(false)}
                onConfirm={handleWeightConfirm}
                product={productToWeigh}
            />
        </Box>
    );
};

export default POSPage;