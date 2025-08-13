// src/components/pagos/PagoDetail.tsx
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Box,
  Divider,
  Chip,
  Card,
  CardContent,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Payment as PaymentIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { PagoConDetalles, METODOS_PAGO } from '../../types/pagos';

interface PagoDetailProps {
  open: boolean;
  onClose: () => void;
  pago: PagoConDetalles;
}

const PagoDetail: React.FC<PagoDetailProps> = ({ open, onClose, pago }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const getMetodoInfo = (metodo: string) => {
    return METODOS_PAGO.find(m => m.value === metodo) || { value: metodo, label: metodo, icon: '💰' };
  };

  const metodoPago = getMetodoInfo(pago.metodoPago);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon color="primary" />
            <Typography variant="h6">
              Detalle del Pago
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Información Principal del Pago */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Información del Pago
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <PaymentIcon color="action" />
                      <Typography variant="body2" color="text.secondary">
                        Monto Pagado
                      </Typography>
                    </Box>
                    <Typography variant="h5" color="success.main" fontWeight="bold">
                      {formatCurrency(pago.monto)}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <CalendarIcon color="action" />
                      <Typography variant="body2" color="text.secondary">
                        Fecha de Pago
                      </Typography>
                    </Box>
                    <Typography variant="h6">
                      {format(pago.fechaPago.toDate(), 'EEEE, dd MMMM yyyy', { locale: es })}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {format(pago.fechaPago.toDate(), 'HH:mm', { locale: es })} hrs
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Método de Pago
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span style={{ fontSize: '1.5rem' }}>{metodoPago.icon}</span>
                      <Typography variant="body1" fontWeight="medium">
                        {metodoPago.label}
                      </Typography>
                    </Box>
                  </Grid>

                  {pago.referencia && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Referencia
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {pago.referencia}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Información del Proveedor */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <PersonIcon color="primary" />
                  <Typography variant="h6" color="primary">
                    Proveedor
                  </Typography>
                </Box>
                
                <Typography variant="h6" gutterBottom>
                  {pago.proveedorInfo.nombre}
                </Typography>
                
                {pago.proveedorInfo.telefono && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    📞 {pago.proveedorInfo.telefono}
                  </Typography>
                )}
                
                {pago.proveedorInfo.email && (
                  <Typography variant="body2" color="text.secondary">
                    ✉️ {pago.proveedorInfo.email}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Información de la Compra */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <ReceiptIcon color="primary" />
                  <Typography variant="h6" color="primary">
                    Compra Asociada
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Número de Factura
                </Typography>
                <Typography variant="h6" gutterBottom>
                  {pago.compraInfo.numeroFactura}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Fecha de Compra
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {format(pago.compraInfo.fechaCompra.toDate(), 'dd/MM/yyyy', { locale: es })}
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Estado
                </Typography>
                <Chip
                  label={pago.compraInfo.estado.toUpperCase()}
                  size="small"
                  color={
                    pago.compraInfo.estado === 'pagado' ? 'success' :
                    pago.compraInfo.estado === 'parcial' ? 'warning' : 'error'
                  }
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Resumen Financiero */}
          <Grid item xs={12}>
            <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Resumen Financiero
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Total de la Compra
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {formatCurrency(pago.compraInfo.total)}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Total Pagado
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" color="success.main">
                        {formatCurrency(pago.totalPagado)}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Este Pago
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" color="primary.main">
                        {formatCurrency(pago.monto)}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Saldo Pendiente
                      </Typography>
                      <Typography 
                        variant="h6" 
                        fontWeight="bold" 
                        color={pago.montoPendiente > 0 ? "error.main" : "success.main"}
                      >
                        {formatCurrency(pago.montoPendiente)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Barra de progreso visual */}
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Progreso de Pago
                  </Typography>
                  <Box sx={{ 
                    width: '100%', 
                    height: 20, 
                    bgcolor: 'grey.200', 
                    borderRadius: 1,
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <Box sx={{ 
                      width: `${(pago.totalPagado / pago.compraInfo.total) * 100}%`,
                      height: '100%',
                      bgcolor: pago.montoPendiente > 0 ? 'warning.main' : 'success.main',
                      transition: 'width 0.3s ease'
                    }} />
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontWeight: 'bold',
                        color: 'white',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                      }}
                    >
                      {((pago.totalPagado / pago.compraInfo.total) * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Notas del Pago */}
          {pago.notas && (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <DescriptionIcon color="primary" />
                    <Typography variant="h6" color="primary">
                      Notas
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ 
                    p: 2, 
                    bgcolor: 'background.default', 
                    borderRadius: 1,
                    fontStyle: 'italic'
                  }}>
                    "{pago.notas}"
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Información de Auditoría */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Registrado por
                </Typography>
                <Typography variant="body2">
                  {pago.registradoPorNombre || 'Usuario no disponible'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Fecha de registro
                </Typography>
                <Typography variant="body2">
                  {format(pago.createdAt.toDate(), 'dd/MM/yyyy HH:mm', { locale: es })}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="contained">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PagoDetail;