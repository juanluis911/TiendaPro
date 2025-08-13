// src/components/usuarios/UsuariosStats.tsx
import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Skeleton,
  LinearProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as ManagerIcon,
  Work as EmpleadoIcon,
  PointOfSale as VendedorIcon,
  CheckCircle as ActiveIcon,
  Block as InactiveIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import { UserProfile } from '../../types';

interface UsuariosStatsProps {
  usuarios: UserProfile[];
  loading: boolean;
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  subtitle?: string;
  progress?: number;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
  subtitle,
  progress,
  loading = false,
}) => {
  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <Skeleton variant="circular" width={48} height={48} />
            <Box flex={1}>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: `${color}.main`,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
          <Box flex={1}>
            <Typography variant="h4" component="div" fontWeight={700}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        {progress !== undefined && (
          <Box mt={2}>
            <LinearProgress
              variant="determinate"
              value={progress}
              color={color}
              sx={{ height: 6, borderRadius: 3 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              {progress.toFixed(1)}%
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const UsuariosStats: React.FC<UsuariosStatsProps> = ({ usuarios = [], loading }) => {
  if (loading) {
    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[...Array(6)].map((_, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
            <StatCard
              title=""
              value=""
              icon={<PersonIcon />}
              color="primary"
              loading={true}
            />
          </Grid>
        ))}
      </Grid>
    );
  }

  // Calcular estadísticas con protección contra undefined
  const safeUsuarios = Array.isArray(usuarios) ? usuarios : [];
  const totalUsuarios = safeUsuarios.length;
  const usuariosActivos = safeUsuarios.filter(u => u?.active).length;
  const usuariosInactivos = totalUsuarios - usuariosActivos;

  // Estadísticas por rol
  const roleStats = {
    owner: safeUsuarios.filter(u => u?.role === 'owner').length,
    admin: safeUsuarios.filter(u => u?.role === 'admin').length,
    manager: safeUsuarios.filter(u => u?.role === 'manager').length,
    empleado: safeUsuarios.filter(u => u?.role === 'empleado').length,
    vendedor: safeUsuarios.filter(u => u?.role === 'vendedor').length,
  };

  // Calcular porcentajes
  const porcentajeActivos = totalUsuarios > 0 ? (usuariosActivos / totalUsuarios) * 100 : 0;
  const porcentajeInactivos = totalUsuarios > 0 ? (usuariosInactivos / totalUsuarios) * 100 : 0;

  // Usuarios creados este mes (simulado)
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const usuariosEsteMes = safeUsuarios.filter(u => {
    if (!u?.createdAt) return false;
    try {
      const fechaCreacion = u.createdAt.toDate();
      return fechaCreacion >= inicioMes;
    } catch {
      return false;
    }
  }).length;

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {/* Total de usuarios */}
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <StatCard
          title="Total Usuarios"
          value={totalUsuarios}
          icon={<PersonIcon />}
          color="primary"
          subtitle={`${usuariosEsteMes} este mes`}
        />
      </Grid>

      {/* Usuarios activos */}
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <StatCard
          title="Usuarios Activos"
          value={usuariosActivos}
          icon={<ActiveIcon />}
          color="success"
          progress={porcentajeActivos}
        />
      </Grid>

      {/* Usuarios inactivos */}
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <StatCard
          title="Usuarios Inactivos"
          value={usuariosInactivos}
          icon={<InactiveIcon />}
          color="error"
          progress={porcentajeInactivos}
        />
      </Grid>

      {/* Administradores */}
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <StatCard
          title="Administradores"
          value={roleStats.owner + roleStats.admin}
          icon={<AdminIcon />}
          color="warning"
          subtitle="Owner + Admin"
        />
      </Grid>

      {/* Gerentes */}
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <StatCard
          title="Gerentes"
          value={roleStats.manager}
          icon={<ManagerIcon />}
          color="info"
        />
      </Grid>

      {/* Empleados y Vendedores */}
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <StatCard
          title="Empleados"
          value={roleStats.empleado + roleStats.vendedor}
          icon={<EmpleadoIcon />}
          color="secondary"
          subtitle="Empleados + Vendedores"
        />
      </Grid>
    </Grid>
  );
};

export default UsuariosStats;