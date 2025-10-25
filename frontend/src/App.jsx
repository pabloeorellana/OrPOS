import React from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import apiClient from './api/axios';

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

// Este es el layout principal que está protegido.
// Todas las rutas anidadas dentro de él heredarán la protección.
const AppLayout = () => (
    <ProtectedRoute>
        <ShiftHandler>
            <DashboardLayout /> 
            {/* El <Outlet> de DashboardLayout renderizará las rutas hijas */}
        </ShiftHandler>
    </ProtectedRoute>
);

function App() {
  // Componente que resuelve el tenant consultando al backend y redirige
  // a /tenant-login?tenant=... si existe, o a /login si no.
  const RootRedirect = () => {
    const { search } = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
      let mounted = true;
      const params = new URLSearchParams(search);
      const tenant = params.get('tenant');
      const resolve = async () => {
        if (!tenant) {
          if (mounted) {
            setLoading(false);
            navigate('/login', { replace: true });
          }
          return;
        }
        try {
          // Llamada pública para comprobar si el tenant existe
          console.debug('RootRedirect: resolving tenant', tenant);
          const resp = await apiClient.get(`/tenants/resolve?subdomain=${encodeURIComponent(tenant)}`);
          console.debug('RootRedirect: resolve response', resp.status, resp.data);
          if (mounted) {
            setLoading(false);
            navigate(`/tenant-login${search}`, { replace: true });
          }
        } catch (err) {
          // Si el tenant no existe o hay error, navegar al login de superadmin
          console.error('RootRedirect: resolve error', err?.response?.status, err?.message || err);
          if (mounted) {
            setLoading(false);
            navigate('/login', { replace: true });
          }
        }
      };
      resolve();
      return () => { mounted = false; };
    }, [search, navigate]);

    // Mientras resolvemos, no renderizamos nada (evitar flash de rutas)
    return null;
  };

  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    // Forzar redirección temprana desde '/' hacia '/tenant-login?tenant=...'
    try {
      const params = new URLSearchParams(location.search);
      const tenant = params.get('tenant');
      if (location.pathname === '/' && tenant) {
        navigate(`/tenant-login${location.search}`, { replace: true });
      }
    } catch (e) {
      // ignore
    }
  }, [location, navigate]);

  return (
    <Routes>
  {/* Ruta raíz: redirecciona a /tenant-login?tenant=... o a /login */}
  <Route path="/" element={<RootRedirect />} />
  {/* Ruta pública dedicada para login de tenant (preserva query string) */}
  <Route path="/tenant-login" element={<Login />} />
      {/* RUTA PÚBLICA: 'Login' es independiente y siempre accesible */}
      <Route path="/login" element={<Login />} />
      
      {/* RUTA PADRE PROTEGIDA: Atrapa todas las demás rutas y las pasa a AppLayout */}
      <Route path="/*" element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} /> {/* La ruta raíz "/" dentro de la app */}
        
        {/* Todas las rutas que pongas aquí serán renderizadas DENTRO del layout protegido */}
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
        
        {/* Rutas exclusivas para el Superadmin */}
        <Route path="superadmin-dashboard" element={<SuperadminRoute><SuperadminDashboardPage /></SuperadminRoute>} />
        <Route path="superadmin" element={<SuperadminRoute><SuperadminPage /></SuperadminRoute>} />
        <Route path="plans" element={<SuperadminRoute><PlansPage /></SuperadminRoute>} />
        <Route path="permissions-admin" element={<SuperadminRoute><PermissionsAdminPage /></SuperadminRoute>} />
      </Route>

    </Routes>
  );
}

export default App;