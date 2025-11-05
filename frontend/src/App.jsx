import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Typography } from '@mui/material';

// Importa todos tus componentes y páginas
import Login from './components/Login';
import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ShiftHandler from './components/ShiftHandler';
import TenantWrapper from './components/TenantWrapper';
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

// Layout protegido para tenants (incluye ShiftHandler)
const PrivateLayout = () => (
    <ProtectedRoute>
        <ShiftHandler>
            <DashboardLayout />
        </ShiftHandler>
    </ProtectedRoute>
);

// Layout protegido para superadmin (sin ShiftHandler)
const SuperadminPrivateLayout = () => (
    <ProtectedRoute>
        <DashboardLayout />
    </ProtectedRoute>
);

function App() {
  return (
    <Routes>
      {/* RUTAS PÚBLICAS Y DE NIVEL SUPERIOR */}
      <Route path="/" element={<Typography variant="h3" align="center" sx={{ mt: 5 }}>Bienvenido a OrPOS</Typography>} />
      <Route path="/login" element={<Login />} />
  {/* Ruta para login por query param: /tenant-login?tenant=mercadito */}
  <Route path="/tenant-login" element={<Login />} />
      <Route path="/404-tenant" element={<Typography variant="h4" align="center" sx={{ mt: 5 }}>Error: El negocio que buscas no existe.</Typography>} />

      {/* RUTA PADRE PARA TENANTS (todo lo demás): /mercadito/login, /cafeteria/dashboard, etc. */}
      {/* TenantWrapper se asegura de que el tenant sea válido antes de renderizar las rutas anidadas. */}
      <Route path="/:tenantPath/*" element={<TenantWrapper />}>
          
        {/* Rutas públicas dentro de un tenant */}
        <Route path="login" element={<Login />} />
          
        {/* Todas las demás rutas dentro de un tenant están protegidas */}
        <Route path="*" element={<PrivateLayout />}>
          {/* Outlet renderizará las rutas hijas anidadas dentro de PrivateLayout -> DashboardLayout */}
          <Route path="dashboard" element={<PermissionProtectedRoute permission="dashboard:view"><DashboardPage /></PermissionProtectedRoute>} />
          <Route path="pos" element={<PermissionProtectedRoute permission="pos:use"><POSPage /></PermissionProtectedRoute>} />
          <Route path="sales-history" element={<SalesHistoryPage />} />
          <Route path="shifts-history" element={<PermissionProtectedRoute permission="shifts:history:view"><ShiftsHistoryPage /></PermissionProtectedRoute>} />
          <Route path="purchases" element={<PermissionProtectedRoute permission="purchases:manage"><PurchasePage /></PermissionProtectedRoute>} />
          <Route path="purchases/new" element={<PermissionProtectedRoute permission="purchases:manage"><NewPurchasePage /></PermissionProtectedRoute>} />
          <Route path="products" element={<PermissionProtectedRoute permission="products:manage"><ProductPage /></PermissionProtectedRoute>} />
          <Route path="categories" element={<PermissionProtectedRoute permission="categories:manage"><CategoryPage /></PermissionProtectedRoute>} /> 
          <Route path="suppliers" element={<PermissionProtectedRoute permission="suppliers:manage"><SupplierPage /></PermissionProtectedRoute>} />
          <Route path="users" element={<PermissionProtectedRoute permission="users:manage"><UserPage /></PermissionProtectedRoute>} />
          <Route path="settings" element={<PermissionProtectedRoute permission="settings:manage"><SettingsPage /></PermissionProtectedRoute>} />
          <Route path="audit" element={<PermissionProtectedRoute permission="audit:view"><AuditLogPage /></PermissionProtectedRoute>} />
          <Route path="reports" element={<PermissionProtectedRoute permission="reports:view"><ReportsPage /></PermissionProtectedRoute>} />
          <Route path="permissions" element={<PermissionProtectedRoute permission="users:manage"><PermissionsPage /></PermissionProtectedRoute>} />
          <Route path="business-settings" element={<PermissionProtectedRoute permission="settings:manage"><BusinessSettingsPage /></PermissionProtectedRoute>} />
        </Route>
      </Route>

      {/* RUTAS PROTEGIDAS DEL SUPERADMIN (No tienen prefijo de tenant) */}
      <Route element={<SuperadminPrivateLayout />}>
        <Route path="/superadmin-dashboard" element={<SuperadminRoute><SuperadminDashboardPage /></SuperadminRoute>} />
        <Route path="/superadmin" element={<SuperadminRoute><SuperadminPage /></SuperadminRoute>} />
        <Route path="/plans" element={<SuperadminRoute><PlansPage /></SuperadminRoute>} />
        <Route path="/permissions-admin" element={<SuperadminRoute><PermissionsAdminPage /></SuperadminRoute>} />
        <Route path="/audit" element={<SuperadminRoute><AuditLogPage /></SuperadminRoute>} />
      </Route>
      
    </Routes>
  );
}

export default App;