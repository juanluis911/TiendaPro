// src/components/pagos/PagosDashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Divider,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Payment as PaymentIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Add as AddIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

// Configurar dayjs para usar español
dayjs.locale('es');
import { useSnackbar } from 'notistack';

import { PagoConDetalles, PagoResumen, METODOS_PAGO } from '../../types/pagos';
import { Compra } from '../../types/compras';
import { useAuth } from '../../contexts/AuthContext';
import pagoService from '../../services/pagoService';
import { compraService } from '../../services/firebase';
import PagoForm from './PagoForm';

interface PagosDashboardProps {
  onVerTodosPagos: () => void;
}

const PagosDashboard: React.FC<PagosDashboardProps> = ({ onVerTodosPagos }) => {
  const { userProfile } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState<PagoResumen | null>(null);
  const [pagosRecientes, setPagosRecientes] = useState<PagoConDetalles[]>([]);
  const [comprasPendientes, setComprasPendientes] = useState<Compra[]>([]);
  const [showPagoForm, setShowPagoForm] = useState(false);
  const [pagosPorMes, setPagosPorMes] = useState<any[]>([]);

  // Cargar datos del dashboard
  const loadDashboardData = async () => {
    if (!userProfile?.organizationId) return;

    setLoading(true);
    try {
      // Cargar resumen de pagos
      const resumenData = await pagoService.getResumen(
        userProfile.organizationId,
        userProfile.storeAccess?.[0]
      );
      setResumen(resumenData);

      // Cargar pagos recientes (últimos 10)
      const pagosData = await pagoService.getWithDetails(
        userProfile.organizationId,
        userProfile.storeAccess?.[0]
      );
      setPagosRecientes(pagosData.slice(0, 10));

      // Cargar compras pendientes
      const comprasPendientesData = await compraService.getByOrganizationAndStore(
        userProfile.organizationId,
        userProfile.storeAccess?.[0]
      );
      const pendientes = comprasPendientesData.filter(compra => 
        compra.estado === 'pendiente' || compra.estado === 'parcial'
      );
      setComprasPendientes(pendientes.slice(0, 5));

      // Cargar datos para gráfica de pagos por mes (últimos 6 meses)
      const mesesData = [];
      for (let i = 5; i >= 0; i--) {
        const fecha = dayjs().subtract(i, 'month');
        const inicioMes = fecha.startOf('month').toDate();
        const finMes = fecha.endOf('month').toDate();
        
        const pagosDelMes = await pagoService.getByDateRange(
          userProfile.organizationId,
          inicioMes,
          finMes,
          userProfile.storeAccess?.[0]
        );
        
        const totalMes = pagosDelMes.reduce((sum, pago) => sum + pago.monto, 0);
        
        mesesData.push({
          mes: fecha.format('MMM YYYY'),
          total: totalMes,
          cantidad: pagosDelMes.length
        });
      }
      setPagosPorMes(mesesData);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      enqueueSnackbar('Error al cargar los datos del dashboard', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [userProfile]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const getMetodoIcon = (metodo: string) => {
    const metodoPago = METODOS_PAGO.find(m => m.value === metodo);
    return metodoPago?.icon || '💰';
  };

  // Datos para gráfica de métodos de pago
  const metodosData = resumen ? [
    { name: 'Efectivo', value: resumen.pagosPorMetodo.efectivo, color: '#4CAF50' },
    { name: 'Transferencia', value: resumen.pagosPorMetodo.transferencia, color: '#2196F3' },
    { name: 'Cheque', value: resumen.pagosPorMetodo.cheque, color: '#FF9800' },
    { name: 'Tarjeta', value: resumen.pagosPorMetodo.tarjeta, color: '#9C27B0' }
  ].filter(item => item.value > 0) : [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box sx={{ 
          bgcolor: 'background.paper', 
          p: 2, 
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          boxShadow: 2
        }}>
          <Typography variant="body2" fontWeight="bold">
            {label}
          </Typography>
          <Typography variant="body2" color="primary">
            Total: {formatCurrency(payload[0].value)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Pagos: {payload[0].payload.cantidad}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Cargando dashboard de pagos...
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Dashboard de Pagos
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ViewIcon />}
            onClick={onVerTodosPagos}
          >
            Ver Todos
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowPagoForm(true)}
          >
            Nuevo Pago
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Métricas principales */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Pagos del Mes
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {resumen ? formatCurrency(resumen.pagosDelMes) : '$0.00'}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <PaymentIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Promedio Mensual
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {resumen ? formatCurrency(resumen.promedioMensual) : '$0.00'}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <TrendingUpIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Compras Pendientes
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {comprasPendientes.length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <ScheduleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Total Año
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {resumen ? formatCurrency(resumen.totalPagos) : '$0.00'}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <CheckCircleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Gráficas */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tendencia de Pagos (Últimos 6 meses)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={pagosPorMes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" fill="#1976d2" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Métodos de Pago
              </Typography>
              {metodosData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={metodosData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {metodosData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No hay datos de métodos de pago
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Pagos recientes */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pagos Recientes
              </Typography>
              {pagosRecientes.length > 0 ? (
                <List>
                  {pagosRecientes.map((pago, index) => (
                    <React.Fragment key={pago.id}>
                      <ListItem>
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                            <span style={{ fontSize: '1rem' }}>
                              {getMetodoIcon(pago.metodoPago)}
                            </span>
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body1" fontWeight="medium">
                                {pago.proveedorInfo.nombre}
                              </Typography>
                              <Typography variant="body1" fontWeight="bold" color="success.main">
                                {formatCurrency(pago.monto)}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" color="text.secondary">
                                {pago.compraInfo.numeroFactura}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {dayjs(pago.fechaPago.toDate()).format('DD/MM/YYYY')}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < pagosRecientes.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No hay pagos recientes
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Compras pendientes */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Compras Pendientes de Pago
              </Typography>
              {comprasPendientes.length > 0 ? (
                <List>
                  {comprasPendientes.map((compra, index) => (
                    <React.Fragment key={compra.id}>
                      <ListItem>
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: 'warning.main', width: 32, height: 32 }}>
                            <WarningIcon fontSize="small" />
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body1" fontWeight="medium">
                                {compra.proveedorNombre}
                              </Typography>
                              <Typography variant="body1" fontWeight="bold" color="error.main">
                                {formatCurrency(compra.total)}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" color="text.secondary">
                                {compra.numeroFactura}
                              </Typography>
                              <Chip
                                label={compra.estado.toUpperCase()}
                                size="small"
                                color={compra.estado === 'parcial' ? 'warning' : 'error'}
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < comprasPendientes.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  ¡Excelente! No hay compras pendientes
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Formulario de nuevo pago */}
      <PagoForm
        open={showPagoForm}
        onClose={() => setShowPagoForm(false)}
        onSuccess={loadDashboardData}
      />
    </Box>
  );
};

export default PagosDashboard;