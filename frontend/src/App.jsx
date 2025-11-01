import React from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import apiClient from './api/axios';
import { useAuth } from './context/AuthContext';
import { getSubdomain } from './utils/subdomain'; // Importamos la utilidad

import Login from './components/Login';
import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
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

// Layout protegido, se mantiene igual
const AppLayout = () => (
    <ProtectedRoute>
        <ShiftHandler>
            <DashboardLayout /> 
        </ShiftHandler>
    </ProtectedRoute>
);

function App() {
  // Componente que resuelve el tenant y redirige al login apropiado
  const RootRedirector = () => {
    const { user, isAuthLoading } = useAuth();
    const navigate = useNavigate();
    
    // Mientras la autenticación inicial está en curso, no hacemos nada para evitar flashes
    if (isAuthLoading) {
      return null;
    }
    
    // Si el usuario ya está autenticado, no hay necesidad de redirigir.
    // AppLayout se encargará de mostrar el contenido correcto.
    if (user) {
      // Si un usuario logueado llega a la raíz, lo enviamos a su dashboard.
      const homeRoute = user.isSuperAdmin ? "/superadmin-dashboard" : "/dashboard";
      return <Navigate to={homeRoute} replace />;
    }
    
    // Si no hay usuario, determinamos a qué login enviarlo
    const subdomain = getSubdomain();

if (subdomain && subdomain !== 'www' && subdomain !== '') {
  console.debug(`Subdominio detectado: ${subdomain}`);
  return <Navigate to={`/login${window.location.search}`} replace />;
}

// Sin subdominio → dominio principal
console.debug('Acceso desde dominio principal (orpos.site)');
return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      {/* RUTAS PÚBLICAS: Sólo la página de Login es pública */}
      <Route path="/login" element={<Login />} />
      
      {/* RUTA PROTEGIDA PADRE: Todas las demás rutas viven aquí y son protegidas por AppLayout */}
      <Route path="/*" element={<AppLayout />}>
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
        
        <Route path="superadmin-dashboard" element={<SuperadminRoute><SuperadminDashboardPage /></SuperadminRoute>} />
        <Route path="superadmin" element={<SuperadminRoute><SuperadminPage /></SuperadminRoute>} />
        <Route path="plans" element={<SuperadminRoute><PlansPage /></SuperadminRoute>} />
        <Route path="permissions-admin" element={<SuperadminRoute><PermissionsAdminPage /></SuperadminRoute>} />
      </Route>

      {/* RUTA RAÍZ ("catch-all" inicial): El punto de entrada a la aplicación. */}
      {/* Su única misión es llamar a nuestro redirector inteligente. */}
      <Route path="/" element={<RootRedirector />} />
    </Routes>
  );
}

export default App;