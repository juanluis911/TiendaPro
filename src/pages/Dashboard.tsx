// src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Alert,
  Skeleton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Business,
  ShoppingCart,
  Payment,
  Schedule,
  Store as StoreIcon,
  Refresh,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { DashboardStats } from '../types';
import {
  proveedorService,
  compraService,
  pagoService,
  formatCurrency,
  formatDate,
} from '../services/firebase';
import { Timestamp } from 'firebase/firestore';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  icon,
  color,
  trend,
}) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box flex={1}>
          <Typography color="text.secondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography variant="h4" component="div" fontWeight="bold">
            {value}
          </Typography>
          {trend && (
            <Box display="flex" alignItems="center" mt={1}>
              {trend.isPositive ? (
                <TrendingUp color="success" fontSize="small" />
              ) : (
                <TrendingDown color="error" fontSize="small" />
              )}
              <Typography
                variant="body2"
                color={trend.isPositive ? 'success.main' : 'error.main'}
                ml={0.5}
              >
                {Math.abs(trend.value)}%
              </Typography>
            </Box>
          )}
        </Box>
        <Box
          sx={{
            backgroundColor: `${color}.light`,
            borderRadius: '50%',
            p: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  const { userProfile, organization, userStores, hasPermission } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [proximosVencimientos, setProximosVencimientos] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    if (!userProfile?.organizationId) return;

    try {
      setLoading(true);
      setError(null);

      // Obtener estadísticas básicas
      const [proveedores, comprasPendientes, vencidos] = await Promise.all([
        // Total de proveedores activos
        proveedorService.getByOrganizationAndStore(userProfile.organizationId),
        // Compras pendientes
        compraService.getPendingPayments(userProfile.organizationId),
        // Pagos vencidos
        compraService.getOverduePayments(userProfile.organizationId),
      ]);

      // Calcular monto total pendiente
      const montoTotalPendiente = comprasPendientes.reduce(
        (total, compra) => total + compra.total,
        0
      );

      // Obtener próximos vencimientos (próximos 7 días)
      const proximosDias = new Date();
      proximosDias.setDate(proximosDias.getDate() + 7);
      
      const vencimientosProximos = comprasPendientes.filter(compra => {
        const fechaVencimiento = compra.fechaVencimiento.toDate();
        return fechaVencimiento <= proximosDias && fechaVencimiento > new Date();
      });

      // Obtener estadísticas del mes actual
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      const [comprasEsteMes, pagosEsteMes] = await Promise.all([
        compraService.getByOrganizationAndStore(userProfile.organizationId),
        pagoService.getByOrganizationAndStore(userProfile.organizationId),
      ]);

      const comprasMesActual = comprasEsteMes.filter(
        compra => compra.createdAt.toDate() >= inicioMes
      ).length;

      const pagosMesActual = pagosEsteMes.filter(
        pago => pago.createdAt.toDate() >= inicioMes
      ).length;

      setStats({
        totalProveedores: proveedores.length,
        comprasPendientes: comprasPendientes.length,
        montoTotalPendiente,
        vencimientosProximos: vencimientosProximos.length,
        comprasEsteMes: comprasMesActual,
        pagosEsteMes: pagosMesActual,
      });

      setProximosVencimientos(vencimientosProximos.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission('proveedores')) {
      loadDashboardData();
    } else {
      setLoading(false);
    }
  }, [userProfile?.organizationId, hasPermission]);

  if (!hasPermission('proveedores')) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Bienvenido a TiendaPro
        </Typography>
        <Alert severity="info">
          Tu usuario no tiene permisos para ver las estadísticas. 
          Contacta al administrador para obtener acceso.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Resumen de {organization?.name}
          </Typography>
        </Box>
        <Tooltip title="Actualizar datos">
          <IconButton onClick={loadDashboardData} disabled={loading}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Estadísticas principales */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          {loading ? (
            <Skeleton variant="rectangular" height={120} />
          ) : (
            <DashboardCard
              title="Total Proveedores"
              value={stats?.totalProveedores || 0}
              icon={<Business color="primary" />}
              color="primary"
            />
          )}
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          {loading ? (
            <Skeleton variant="rectangular" height={120} />
          ) : (
            <DashboardCard
              title="Compras Pendientes"
              value={stats?.comprasPendientes || 0}
              icon={<ShoppingCart color="warning" />}
              color="warning"
            />
          )}
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          {loading ? (
            <Skeleton variant="rectangular" height={120} />
          ) : (
            <DashboardCard
              title="Monto Pendiente"
              value={formatCurrency(stats?.montoTotalPendiente || 0)}
              icon={<Payment color="error" />}
              color="error"
            />
          )}
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          {loading ? (
            <Skeleton variant="rectangular" height={120} />
          ) : (
            <DashboardCard
              title="Vencen Pronto"
              value={stats?.vencimientosProximos || 0}
              icon={<Schedule color="warning" />}
              color="warning"
            />
          )}
        </Grid>
      </Grid>

      {/* Estadísticas del mes */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Actividad de este mes
              </Typography>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary">
                    {loading ? <Skeleton width={60} /> : stats?.comprasEsteMes || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Compras registradas
                  </Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="h4" color="success.main">
                    {loading ? <Skeleton width={60} /> : stats?.pagosEsteMes || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pagos realizados
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Próximos Vencimientos
              </Typography>
              {loading ? (
                <>
                  <Skeleton height={40} />
                  <Skeleton height={40} />
                  <Skeleton height={40} />
                </>
              ) : proximosVencimientos.length > 0 ? (
                <List dense>
                  {proximosVencimientos.map((compra, index) => (
                    <ListItem key={index} divider>
                      <ListItemIcon>
                        <Warning color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Factura: ${compra.numeroFactura}`}
                        secondary={`Vence: ${formatDate(compra.fechaVencimiento)} - ${formatCurrency(compra.total)}`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box textAlign="center" py={3}>
                  <CheckCircle color="success" sx={{ fontSize: 48, mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No hay vencimientos próximos
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Información de tiendas */}
      {userStores.length > 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Mis Tiendas
            </Typography>
            <Grid container spacing={2}>
              {userStores.map((store) => (
                <Grid item xs={12} sm={6} md={4} key={store.id}>
                  <Box
                    display="flex"
                    alignItems="center"
                    p={2}
                    border={1}
                    borderColor="divider"
                    borderRadius={2}
                  >
                    <StoreIcon color="primary" sx={{ mr: 2 }} />
                    <Box>
                      <Typography variant="subtitle2">{store.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {store.address}
                      </Typography>
                      <Chip
                        label={store.active ? 'Activa' : 'Inactiva'}
                        size="small"
                        color={store.active ? 'success' : 'error'}
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default Dashboard;