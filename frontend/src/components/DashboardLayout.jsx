import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppBar, Toolbar, Typography, Button, Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, CssBaseline, Divider } from '@mui/material';
import { Outlet, Link } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import InventoryIcon from '@mui/icons-material/Inventory';
import GroupIcon from '@mui/icons-material/Group';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CloseShiftModal from './CloseShiftModal';
import HistoryIcon from '@mui/icons-material/History';
import CategoryIcon from '@mui/icons-material/Category';

const drawerWidth = 240;

// --- CORRECCIÓN DE PERMISOS PARA EL MENÚ ---
const allMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: ['administrador', 'propietario', 'empleado'] },
    { text: 'Ventas (POS)', icon: <PointOfSaleIcon />, path: '/pos', roles: ['administrador', 'propietario', 'empleado'] },
    { text: 'Historial de Ventas', icon: <HistoryIcon />, path: '/sales-history', roles: ['administrador', 'propietario'] },
    { text: 'Compras', icon: <ReceiptIcon />, path: '/purchases', roles: ['administrador', 'propietario'] },
    // AHORA LOS EMPLEADOS PUEDEN VER EL MENÚ DE PRODUCTOS
    { text: 'Productos', icon: <InventoryIcon />, path: '/products', roles: ['administrador', 'propietario', 'empleado'] },
    { text: 'Categorías', icon: <CategoryIcon />, path: '/categories', roles: ['administrador', 'propietario'] }, 
    { text: 'Proveedores', icon: <LocalShippingIcon />, path: '/suppliers', roles: ['administrador', 'propietario'] },
    { text: 'Usuarios', icon: <GroupIcon />, path: '/users', roles: ['administrador'] },
];

const DashboardLayout = () => {
    const { user, logout, activeShift } = useAuth();
    const [closeModalOpen, setCloseModalOpen] = useState(false);
    const [visibleMenuItems, setVisibleMenuItems] = useState([]);

    useEffect(() => {
        if (user?.role) {
            const allowedItems = allMenuItems.filter(item => item.roles.includes(user.role));
            setVisibleMenuItems(allowedItems);
        }
    }, [user]);

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar position="fixed" sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px` }}>
                <Toolbar>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>El Mercadito - Dashboard</Typography>
                    <Typography variant="subtitle2" sx={{ mr: 2, border: '1px solid white', borderRadius: 1, px: 1, py: 0.5 }}>
                        Caja Abierta: ${activeShift?.opening_balance ? parseFloat(activeShift.opening_balance).toFixed(2) : '0.00'}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ mr: 2 }}>Hola, {user ? user.username : 'Invitado'}</Typography>
                    <Button color="inherit" onClick={() => setCloseModalOpen(true)}>Cerrar Caja</Button>
                    <Button color="inherit" onClick={logout} sx={{ ml: 1 }}>Cerrar Sesión</Button>
                </Toolbar>
            </AppBar>
            <Drawer sx={{ width: drawerWidth, flexShrink: 0, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' } }} variant="permanent" anchor="left">
                <Toolbar />
                <Divider />
                <List>
                    {visibleMenuItems.map((item) => (
                        <ListItem key={item.text} disablePadding component={Link} to={item.path} sx={{ color: 'inherit', textDecoration: 'none' }}>
                            <ListItemButton>
                                <ListItemIcon>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.text} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Drawer>
            <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3, height: '100vh', overflow: 'auto' }}>
                <Toolbar />
                <Outlet /> 
            </Box>
            <CloseShiftModal open={closeModalOpen} onClose={() => setCloseModalOpen(false)} />
        </Box>
    );
}

export default DashboardLayout;