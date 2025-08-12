// src/components/auth/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: keyof UserProfile['permissions'];
  requiredRole?: UserRole | UserRole[];
  requiredStoreAccess?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredRole,
  requiredStoreAccess,
}) => {
  const { user, userProfile, loading, hasPermission, canAccessStore } = useAuth();
  const location = useLocation();

  // Mostrar loading mientras se carga la autenticación
  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress size={48} />
        <Typography variant="h6" color="text.secondary">
          Cargando...
        </Typography>
      </Box>
    );
  }

  // Redirigir al login si no está autenticado
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar si el perfil del usuario está cargado
  if (!userProfile) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        gap={2}
      >
        <Typography variant="h6" color="error">
          Error: No se pudo cargar el perfil del usuario
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Contacte al administrador del sistema
        </Typography>
      </Box>
    );
  }

  // Verificar si la cuenta está activa
  if (!userProfile.active) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        gap={2}
      >
        <Typography variant="h6" color="error">
          Cuenta Desactivada
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Su cuenta ha sido desactivada. Contacte al administrador.
        </Typography>
      </Box>
    );
  }

  // Verificar permisos específicos
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        gap={2}
      >
        <Typography variant="h6" color="error">
          Acceso Denegado
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No tiene permisos para acceder a esta sección
        </Typography>
      </Box>
    );
  }

  // Verificar roles requeridos
  if (requiredRole) {
    const rolesArray = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!rolesArray.includes(userProfile.role)) {
      return (
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
          gap={2}
        >
          <Typography variant="h6" color="error">
            Acceso Denegado
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Su rol no tiene acceso a esta sección
          </Typography>
        </Box>
      );
    }
  }

  // Verificar acceso a tienda específica
  if (requiredStoreAccess && !canAccessStore(requiredStoreAccess)) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        gap={2}
      >
        <Typography variant="h6" color="error">
          Acceso Denegado
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No tiene acceso a esta tienda
        </Typography>
      </Box>
    );
  }

  // Si todas las verificaciones pasan, renderizar el contenido
  return <>{children}</>;
};

export default ProtectedRoute;