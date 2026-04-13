import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SorteoProvider } from './contexts/SorteoContext';
import { WelcomePage } from './pages/WelcomePage';
import { LoginPage } from './pages/LoginPage';
import { LoginUsuario } from './pages/LoginUsuario';
import { LoginAdmin } from './pages/LoginAdmin';
import { HomePage } from './pages/HomePage';
import { MapaSeleccion } from './pages/MapaSeleccion';
import { AdminPage } from './pages/AdminPage';
import { AdminReportes } from './pages/AdminReportes';
import { AdminAsignaciones } from './pages/AdminAsignaciones';
import { AdminResidentes } from './pages/AdminResidentes';
import { AdminConfig } from './pages/AdminConfig';
import { SorteoActivo } from './pages/SorteoActivo';
import { AdminSorteoMonitor } from './pages/AdminSorteoMonitor';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/login" element={<LoginUsuario />} />
      <Route path="/login-usuario" element={<LoginUsuario />} />
      <Route path="/login-admin" element={<LoginAdmin />} />
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mapa-seleccion"
        element={
          <ProtectedRoute>
            <MapaSeleccion />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sorteo-activo"
        element={
          <ProtectedRoute>
            <SorteoActivo />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reportes"
        element={
          <ProtectedRoute>
            <AdminReportes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/asignaciones"
        element={
          <ProtectedRoute>
            <AdminAsignaciones />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/residentes"
        element={
          <ProtectedRoute>
            <AdminResidentes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/config"
        element={
          <ProtectedRoute>
            <AdminConfig />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/monitor"
        element={
          <ProtectedRoute>
            <AdminSorteoMonitor />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SorteoProvider>
          <AppRoutes />
        </SorteoProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
