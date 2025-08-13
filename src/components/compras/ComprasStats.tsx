import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';

import { Compra } from '../../types/compras';
import { formatCurrency } from '../../utils/formatters';

interface ComprasStatsProps {
  compras: Compra[];
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'primary' | 'warning' | 'error' | 'success' | 'info';
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle }) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="h4" fontWeight="bold" color={`${color}.main`}>
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
        <Box
          sx={{
            backgroundColor: `${color}.light`,
            borderRadius: '50%',
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {React.cloneElement(icon as React.ReactElement, { 
            sx: { fontSize: 32, color: `${color}.main` } 
          })}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const ComprasStats: React.FC<ComprasStatsProps> = ({ compras }) => {
  // Calcular estadísticas
  const totalCompras = compras.length;
  const comprasPendientes = compras.filter(c => c.estado === 'pendiente').length;
  const comprasPagadas = compras.filter(c => c.estado === 'pagado').length;
  
  // Compras vencidas (pendientes con fecha de vencimiento pasada)
  const hoy = new Date();
  const comprasVencidas = compras.filter(c => 
    c.estado === 'pendiente' && c.fechaVencimiento.toDate() < hoy
  ).length;

  // Monto total pendiente
  const montoTotalPendiente = compras
    .filter(c => c.estado === 'pendiente')
    .reduce((total, compra) => total + compra.total, 0);

  // Monto total pagado este mes
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const montoMesPagado = compras
    .filter(c => 
      c.estado === 'pagado' && 
      c.fechaCompra.toDate() >= inicioMes
    )
    .reduce((total, compra) => total + compra.total, 0);

  // Próximos vencimientos (próximos 7 días)
  const proximosDias = new Date();
  proximosDias.setDate(proximosDias.getDate() + 7);
  
  const proximosVencimientos = compras.filter(c =>
    c.estado === 'pendiente' &&
    c.fechaVencimiento.toDate() <= proximosDias &&
    c.fechaVencimiento.toDate() > hoy
  ).length;

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={2.4}>
        <StatCard
          title="Total Compras"
          value={totalCompras}
          icon={<ReceiptIcon />}
          color="primary"
          subtitle="Todas las compras"
        />
      </Grid>

      <Grid item xs={12} sm={6} md={2.4}>
        <StatCard
          title="Pendientes"
          value={comprasPendientes}
          icon={<ScheduleIcon />}
          color="warning"
          subtitle={formatCurrency(montoTotalPendiente)}
        />
      </Grid>

      <Grid item xs={12} sm={6} md={2.4}>
        <StatCard
          title="Vencidas"
          value={comprasVencidas}
          icon={<WarningIcon />}
          color="error"
          subtitle="Requieren atención"
        />
      </Grid>

      <Grid item xs={12} sm={6} md={2.4}>
        <StatCard
          title="Pagadas"
          value={comprasPagadas}
          icon={<CheckCircleIcon />}
          color="success"
          subtitle="Completadas"
        />
      </Grid>

      <Grid item xs={12} sm={6} md={2.4}>
        <StatCard
          title="Próx. Venc."
          value={proximosVencimientos}
          icon={<MoneyIcon />}
          color="info"
          subtitle="Próximos 7 días"
        />
      </Grid>

      {/* Alertas especiales */}
      {(comprasVencidas > 0 || proximosVencimientos > 0) && (
        <Grid item xs={12}>
          <Box display="flex" gap={2} flexWrap="wrap">
            {comprasVencidas > 0 && (
              <Chip
                icon={<WarningIcon />}
                label={`${comprasVencidas} compra${comprasVencidas !== 1 ? 's' : ''} vencida${comprasVencidas !== 1 ? 's' : ''}`}
                color="error"
                variant="filled"
              />
            )}
            {proximosVencimientos > 0 && (
              <Chip
                icon={<ScheduleIcon />}
                label={`${proximosVencimientos} próxima${proximosVencimientos !== 1 ? 's' : ''} a vencer`}
                color="warning"
                variant="filled"
              />
            )}
          </Box>
        </Grid>
      )}
    </Grid>
  );
};

export default ComprasStats;