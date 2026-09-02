import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import RoleSwitcherBar from './components/RoleSwitcherBar';

import LoginPage from './pages/LoginPage';
import CustomerDashboard from './pages/CustomerDashboard';
import PharmacyDashboard from './pages/PharmacyDashboard';
import DispatcherDashboard from './pages/DispatcherDashboard';
import RiderDashboard from './pages/RiderDashboard';

// Role-based Route Guard
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        Loading PharmaDrop...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to default route for user's role
    if (user.role === 'CUSTOMER') return <Navigate to="/customer/orders" replace />;
    if (user.role === 'PHARMACY_STAFF') return <Navigate to="/pharmacy/new-delivery" replace />;
    if (user.role === 'DISPATCHER') return <Navigate to="/dispatcher/unassigned" replace />;
    if (user.role === 'RIDER') return <Navigate to="/rider/deliveries" replace />;
  }

  return children;
};

// Main Redirector for Root '/'
const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'CUSTOMER') return <Navigate to="/customer/orders" replace />;
  if (user.role === 'PHARMACY_STAFF') return <Navigate to="/pharmacy/new-delivery" replace />;
  if (user.role === 'DISPATCHER') return <Navigate to="/dispatcher/unassigned" replace />;
  if (user.role === 'RIDER') return <Navigate to="/rider/deliveries" replace />;

  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-100">
          {/* Top Demo Quick-Role Switcher Header Bar */}
          <RoleSwitcherBar />

          <div className="flex-1">
            <Routes>
              {/* Public Auth Route */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<LoginPage />} />

              {/* Customer Routes */}
              <Route
                path="/customer/orders"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER', 'DISPATCHER', 'PHARMACY_STAFF']}>
                    <CustomerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/orders/:id"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER', 'DISPATCHER', 'PHARMACY_STAFF']}>
                    <CustomerDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Pharmacy Staff Routes */}
              <Route
                path="/pharmacy/new-delivery"
                element={
                  <ProtectedRoute allowedRoles={['PHARMACY_STAFF', 'DISPATCHER']}>
                    <PharmacyDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pharmacy/deliveries"
                element={
                  <ProtectedRoute allowedRoles={['PHARMACY_STAFF', 'DISPATCHER']}>
                    <PharmacyDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Dispatcher Routes */}
              <Route
                path="/dispatcher/unassigned"
                element={
                  <ProtectedRoute allowedRoles={['DISPATCHER']}>
                    <DispatcherDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dispatcher/deliveries"
                element={
                  <ProtectedRoute allowedRoles={['DISPATCHER']}>
                    <DispatcherDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Rider Routes */}
              <Route
                path="/rider/deliveries"
                element={
                  <ProtectedRoute allowedRoles={['RIDER', 'DISPATCHER']}>
                    <RiderDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rider/deliveries/:id"
                element={
                  <ProtectedRoute allowedRoles={['RIDER', 'DISPATCHER']}>
                    <RiderDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Default Index Route */}
              <Route path="/" element={<RootRedirect />} />

              {/* Fallback */}
              <Route path="*" element={<RootRedirect />} />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
