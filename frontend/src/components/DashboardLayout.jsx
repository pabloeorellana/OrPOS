import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppBar, Toolbar, Typography, Button, Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, CssBaseline, Divider, Alert, AlertTitle, useTheme, useMediaQuery, IconButton } from '@mui/material';
import { Outlet, Link } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import InventoryIcon from '@mui/icons-material/Inventory';
import GroupIcon from '@mui/icons-material/Group';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CloseShiftModal from './CloseShiftModal';
import PolicyIcon from '@mui/icons-material/Policy';
import HistoryIcon from '@mui/icons-material/History';
import CategoryIcon from '@mui/icons-material/Category';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SecurityIcon from '@mui/icons-material/Security';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import GavelIcon from '@mui/icons-material/Gavel';
import { getTenantFromPath } from '../utils/tenantHelper';

const drawerWidth = 240;

const allMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', permission: 'dashboard:view' },
    { text: 'Ventas (POS)', icon: <PointOfSaleIcon />, path: '/pos', permission: 'pos:use' },
    { text: 'Historial de Ventas', icon: <HistoryIcon />, path: '/sales-history', permission: ['sales:history:view_all', 'sales:history:view_own'] },
    { text: 'Arqueo de Cajas', icon: <AccountBalanceWalletIcon />, path: '/shifts-history', permission: 'shifts:history:view' },
    { text: 'Compras', icon: <ReceiptIcon />, path: '/purchases', permission: 'purchases:manage' },
    { text: 'Pagos', icon: <MonetizationOnIcon />, path: '/payments', permission: 'payments:view' },
    { text: 'Productos', icon: <InventoryIcon />, path: '/products', permission: 'products:manage' },
    { text: 'Categorías', icon: <CategoryIcon />, path: '/categories', permission: 'categories:manage' },
    { text: 'Proveedores', icon: <LocalShippingIcon />, path: '/suppliers', permission: 'suppliers:manage' },
    { text: 'Mi Negocio', icon: <BusinessCenterIcon />, path: '/business-settings', permission: 'settings:manage' },
    { text: 'Usuarios', icon: <GroupIcon />, path: '/users', permission: 'users:manage' },
    { text: 'Configuración General', icon: <SettingsIcon />, path: '/settings', permission: 'settings:manage' },
    { text: 'Auditoría', icon: <PolicyIcon />, path: '/audit', permission: 'audit:view' },
    { text: 'Reportes', icon: <AssessmentIcon />, path: '/reports', permission: 'reports:view' },
    { text: 'Permisos', icon: <SecurityIcon />, path: '/permissions', permission: 'users:manage' }
];

const DashboardLayout = () => {
    const { user, logout, activeShift, isImpersonating, exitImpersonation } = useAuth();
    const [closeModalOpen, setCloseModalOpen] = useState(false);
    const [visibleMenuItems, setVisibleMenuItems] = useState([]);
    const [mobileOpen, setMobileOpen] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        if (!user) { setVisibleMenuItems([]); return; }
        const tenantInPath = getTenantFromPath();

        if (user.isSuperAdmin && !tenantInPath) {
            setVisibleMenuItems([
                { text: 'Dashboard Global', icon: <DashboardIcon />, path: '/superadmin-dashboard' },
                { text: 'Gestionar Negocios', icon: <SupervisorAccountIcon />, path: '/superadmin' },
                { text: 'Gestionar Planes', icon: <MonetizationOnIcon />, path: '/plans' },
                { text: 'Gestionar Permisos', icon: <GavelIcon />, path: '/permissions-admin' },
                { text: 'Auditoría Global', icon: <PolicyIcon />, path: '/audit' }
            ]);
        } else if (user.permissions) {
            const allowedItems = allMenuItems.filter(item => {
                if (Array.isArray(item.permission)) {
                    return item.permission.some(p => user.permissions.includes(p));
                }
                return user.permissions.includes(item.permission);
            });
            setVisibleMenuItems(allowedItems);
        } else {
            setVisibleMenuItems([]);
        }
    }, [user]);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const tenant = getTenantFromPath();
    const base = user?.isSuperAdmin ? '' : (tenant ? `/${tenant}` : '');

    const drawerContent = (
        <div>
            <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                <img src="/orposlogo.png" alt="OrPOS Logo" style={{ height: '40px' }} />
                {/* 
                En el futuro, podrías reemplazar Typography con un logo:
                <img src="/path/to/logo.svg" alt="OrPOS Logo" style={{ height: '40px' }} />
                */}
            </Toolbar>
            <Divider />
            <List>
                {visibleMenuItems.map((item) => (
                    <ListItem key={item.text} disablePadding component={Link} to={`${base}${item.path}`} sx={{ color: 'inherit', textDecoration: 'none' }} onClick={isMobile ? handleDrawerToggle : undefined}>
                        <ListItemButton>
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </div>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Box sx={{ flexGrow: 1 }} />

                    {!user?.isSuperAdmin && (
                        <>
                            <Typography variant="subtitle2" sx={{ mr: 2, border: '1px solid white', borderRadius: 1, px: 1, py: 0.5, display: { xs: 'none', md: 'block' } }}>
                                Caja Abierta: ${activeShift?.opening_balance ? parseFloat(activeShift.opening_balance).toFixed(2) : '0.00'}
                            </Typography>
                            <Typography variant="subtitle1" sx={{ mr: 2, display: { xs: 'none', md: 'block' } }}>Hola, {user ? user.username : 'Invitado'}</Typography>
                            <Button color="inherit" onClick={() => setCloseModalOpen(true)} sx={{ display: { xs: 'none', md: 'block' } }}>Cerrar Caja</Button>
                        </>
                    )}
                    <Button color="inherit" onClick={logout} sx={{ ml: 1 }}>Cerrar Sesión</Button>
                </Toolbar>
            </AppBar>
            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
                aria-label="mailbox folders"
            >
                {/* Temporary Drawer for Mobile */}
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true, // Better open performance on mobile.
                    }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                >
                    {drawerContent}
                </Drawer>
                {/* Permanent Drawer for Desktop */}
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                    open
                >
                    {drawerContent}
                </Drawer>
            </Box>
            <Box
                component="main"
                sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, height: '100vh', overflow: 'auto' }}
            >
                <Toolbar />
                {isImpersonating && (
                    <Alert severity="warning" sx={{ mb: 2 }} action={
                        <Button color="inherit" size="small" onClick={exitImpersonation}>
                            VOLVER A SUPERADMIN
                        </Button>
                    }>
                        <AlertTitle>Modo de Suplantación Activo</AlertTitle>
                        Estás navegando como <strong>{user?.username}</strong>.
                    </Alert>
                )}
                <Outlet />
            </Box>
            <CloseShiftModal open={closeModalOpen} onClose={() => setCloseModalOpen(false)} />
        </Box>
    );
}
export default DashboardLayout;