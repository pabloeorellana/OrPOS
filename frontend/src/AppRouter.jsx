import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

import Login from './components/Login';
import DashboardLayout from './components/DashboardLayout';
import ShiftHandler from './components/ShiftHandler';
import PermissionProtectedRoute from './components/PermissionProtectedRoute';
import SuperadminRoute from './components/SuperadminRoute';
import DashboardPage from './pages/DashboardPage';
import ProductPage from './pages/ProductPage';
import UserPage from './pages/UserPage';
import SupplierPage from './pages/SupplierPage';
import POSPage from './pages/POSPage';
import PurchasePage from './pages/PurchasePage';
import NewPurchasePage from './pages/NewPurchasePage';
import SalesHistoryPage from './pages/SalesHistoryPage';
import CategoryPage from './pages/CategoryPage';
import SettingsPage from './pages/SettingsPage';
import ShiftsHistoryPage from './pages/ShiftsHistoryPage';
import AuditLogPage from './pages/AuditLogPage';
import ReportsPage from './pages/ReportsPage';
import PermissionsPage from './pages/PermissionsPage';
import SuperadminPage from './pages/SuperadminPage';
import BusinessSettingsPage from './pages/BusinessSettingsPage';
import PlansPage from './pages/PlansPage';
import PermissionsAdminPage from './pages/PermissionsAdminPage';
import SuperadminDashboardPage from './pages/SuperadminDashboardPage';

const AppRouter = () => {
    const { user, isAuthLoading } = useAuth();
    const location = useLocation();

    // Muestra spinner mientras se verifica el token
    if (isAuthLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Si la carga terminó y no hay usuario, muestra las rutas públicas
    if (!user) {
        return (
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="*" element={<Navigate to={`/login${location.search}`} replace />} />
            </Routes>
        );
    }
    
    // Si hay usuario, calculamos su página de inicio correcta.
    let homeRoute = "/dashboard";
    if (user.isSuperAdmin) {
        homeRoute = "/superadmin-dashboard";
    } else if (user.role === 'empleado') {
        homeRoute = "/pos";
    }

    // Redirección si un usuario logueado va a la página principal o al login
    if (location.pathname === '/' || location.pathname === '/login') {
        return <Navigate to={homeRoute} replace />;
    }

    // Si hay usuario, muestra las rutas protegidas
    return (
        <DashboardLayout>
            <ShiftHandler>
                <Routes>
                    <Route path="/dashboard" element={<PermissionProtectedRoute permission="dashboard:view"><DashboardPage /></PermissionProtectedRoute>} />
                    <Route path="/pos" element={<PermissionProtectedRoute permission="pos:use"><POSPage /></PermissionProtectedRoute>} />
                    <Route path="/sales-history" element={<SalesHistoryPage />} />
                    <Route path="/shifts-history" element={<PermissionProtectedRoute permission="shifts:history:view"><ShiftsHistoryPage /></PermissionProtectedRoute>} />
                    <Route path="/purchases" element={<PermissionProtectedRoute permission="purchases:manage"><PurchasePage /></PermissionProtectedRoute>} />
                    <Route path="/purchases/new" element={<PermissionProtectedRoute permission="purchases:manage"><NewPurchasePage /></PermissionProtectedRoute>} />
                    <Route path="/products" element={<PermissionProtectedRoute permission="products:manage"><ProductPage /></PermissionProtectedRoute>} />
                    <Route path="/categories" element={<PermissionProtectedRoute permission="categories:manage"><CategoryPage /></PermissionProtectedRoute>} /> 
                    <Route path="/suppliers" element={<PermissionProtectedRoute permission="suppliers:manage"><SupplierPage /></PermissionProtectedRoute>} />
                    <Route path="/users" element={<PermissionProtectedRoute permission="users:manage"><UserPage /></PermissionProtectedRoute>} />
                    <Route path="/settings" element={<PermissionProtectedRoute permission="settings:manage"><SettingsPage /></PermissionProtectedRoute>} />
                    <Route path="/audit" element={<PermissionProtectedRoute permission="audit:view"><AuditLogPage /></PermissionProtectedRoute>} />
                    <Route path="/reports" element={<PermissionProtectedRoute permission="reports:view"><ReportsPage /></PermissionProtectedRoute>} />
                    <Route path="/permissions" element={<PermissionProtectedRoute permission="users:manage"><PermissionsPage /></PermissionProtectedRoute>} />
                    <Route path="/business-settings" element={<PermissionProtectedRoute permission="settings:manage"><BusinessSettingsPage /></PermissionProtectedRoute>} />
                    
                    {/* Rutas exclusivas para Superadmin */}
                    <Route path="/superadmin-dashboard" element={<SuperadminRoute><SuperadminDashboardPage /></SuperadminRoute>} />
                    <Route path="/superadmin" element={<SuperadminRoute><SuperadminPage /></SuperadminRoute>} />
                    <Route path="/plans" element={<SuperadminRoute><PlansPage /></SuperadminRoute>} />
                    <Route path="/permissions-admin" element={<SuperadminRoute><PermissionsAdminPage /></SuperadminRoute>} />
                    
                    <Route path="*" element={<Typography variant="h4" align="center" sx={{ mt: 4 }}>404 - Página no encontrada</Typography>} />
                </Routes>
            </ShiftHandler>
        </DashboardLayout>
    );
};

export default AppRouter;