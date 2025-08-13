// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/es';

import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Proveedores from './pages/Proveedores';
import Compras from './pages/Compras';
import Pagos from './pages/Pagos';
import Tiendas from './pages/Tiendas';
import Usuarios from './pages/Usuarios';
import Reportes from './pages/Reportes';
import Configuracion from './pages/Configuracion';
import NotFound from './pages/NotFound';



// Configuración del tema
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
        <SnackbarProvider 
          maxSnack={3}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <AuthProvider>
            <Router>
              <Routes>
                {/* Rutas públicas */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Rutas protegidas */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Navigate to="/dashboard" replace />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Dashboard />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/proveedores" element={
                  <ProtectedRoute requiredPermission="proveedores">
                    <MainLayout>
                      <Proveedores />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/compras" element={
                  <ProtectedRoute requiredPermission="proveedores">
                    <MainLayout>
                      <Compras />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/pagos" element={
                  <ProtectedRoute requiredPermission="proveedores">
                    <MainLayout>
                      <Pagos />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/tiendas" element={
                  <ProtectedRoute requiredPermission="multitienda">
                    <MainLayout>
                      <Tiendas />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/usuarios" element={
                  <ProtectedRoute 
                    requiredPermission="configuracion"
                    requiredRole={['owner', 'admin']}
                  >
                    <MainLayout>
                      <Usuarios />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/reportes" element={
                  <ProtectedRoute requiredPermission="reportes">
                    <MainLayout>
                      <Reportes />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/configuracion" element={
                  <ProtectedRoute requiredPermission="configuracion">
                    <MainLayout>
                      <Configuracion />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                {/* Ruta 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
          </AuthProvider>
        </SnackbarProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default App;