import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import ProductPage from './pages/ProductPage';
import UserPage from './pages/UserPage'; // <--- NUEVA LÍNEA
import SupplierPage from './pages/SupplierPage';
import POSPage from './pages/POSPage';
import ShiftHandler from './components/ShiftHandler';
import PurchasePage from './pages/PurchasePage';
import NewPurchasePage from './pages/NewPurchasePage';
import SalesHistoryPage from './pages/SalesHistoryPage';
import CategoryPage from './pages/CategoryPage';


function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      {/* RUTA PROTEGIDA MODIFICADA */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <ShiftHandler> {/* <--- ENVUELVE EL DASHBOARD */}
              <DashboardLayout />
            </ShiftHandler>
          </ProtectedRoute>
        }
      >
        {/* Las rutas hijas no cambian */}
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="products" element={<ProductPage />} />
        <Route path="suppliers" element={<SupplierPage />} />
        <Route path="users" element={<UserPage />} />
        <Route path="pos" element={<POSPage />} />
        <Route path="sales-history" element={<SalesHistoryPage />} />
        <Route path="purchases/new" element={<NewPurchasePage />} />
        <Route path="purchases" element={<PurchasePage />} />
        <Route path="categories" element={<CategoryPage />} /> 
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default App;