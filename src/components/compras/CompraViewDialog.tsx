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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Print as PrintIcon,
} from '@mui/icons-material';

import { Compra, ESTADOS_COMPRA } from '../../types/compras';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface CompraViewDialogProps {
  open: boolean;
  onClose: () => void;
  compra: Compra | null;
  proveedorNombre: string;
}

const CompraViewDialog: React.FC<CompraViewDialogProps> = ({
  open,
  onClose,
  compra,
  proveedorNombre,
}) => {
  if (!compra) return null;

  const getEstadoChip = (estado: string) => {
    const estadoInfo = ESTADOS_COMPRA.find(e => e.value === estado);
    if (!estadoInfo) return null;

    return (
      <Chip
        label={estadoInfo.label}
        color={estadoInfo.color as any}
        size="medium"
        sx={{ fontWeight: 'bold' }}
      />
    );
  };

  const isVencida = () => {
    const hoy = new Date();
    const fechaVencimiento = compra.fechaVencimiento.toDate();
    return compra.estado === 'pendiente' && fechaVencimiento < hoy;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" fontWeight="bold">
            Detalle de Compra
          </Typography>
          {getEstadoChip(compra.estado)}
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Información básica */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="primary">
              Información General
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary">
                Número de Factura
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {compra.numeroFactura}
              </Typography>
            </Box>

            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary">
                Proveedor
              </Typography>
              <Typography variant="body1">
                {proveedorNombre}
              </Typography>
            </Box>

            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary">
                Registrado por
              </Typography>
              <Typography variant="body1">
                {compra.createdBy}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary">
                Fecha de Compra
              </Typography>
              <Typography variant="body1">
                {formatDate(compra.fechaCompra.toDate())}
              </Typography>
            </Box>

            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary">
                Fecha de Vencimiento
              </Typography>
              <Typography 
                variant="body1"
                color={isVencida() ? 'error.main' : 'inherit'}
                fontWeight={isVencida() ? 'bold' : 'normal'}
              >
                {formatDate(compra.fechaVencimiento.toDate())}
                {isVencida() && ' (VENCIDA)'}
              </Typography>
            </Box>

            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary">
                Fecha de Registro
              </Typography>
              <Typography variant="body1">
                {formatDate(compra.createdAt.toDate())}
              </Typography>
            </Box>
          </Grid>

          {/* Productos */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
              Productos
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Producto</strong></TableCell>
                    <TableCell align="right"><strong>Cantidad</strong></TableCell>
                    <TableCell><strong>Unidad</strong></TableCell>
                    <TableCell align="right"><strong>Precio Unit.</strong></TableCell>
                    <TableCell align="right"><strong>Subtotal</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {compra.productos.map((producto, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {producto.nombre}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {producto.cantidad}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {producto.unidad}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {formatCurrency(producto.precioUnitario)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(producto.subtotal)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Fila del total */}
                  <TableRow>
                    <TableCell colSpan={4} align="right">
                      <Typography variant="h6" fontWeight="bold">
                        Total:
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="h6" fontWeight="bold" color="primary">
                        {formatCurrency(compra.total)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* Notas */}
          {compra.notas && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                Notas
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body1">
                  {compra.notas}
                </Typography>
              </Paper>
            </Grid>
          )}

          {/* Resumen financiero */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, bgcolor: 'primary.light', mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total de productos:
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {compra.productos.length} producto{compra.productos.length !== 1 ? 's' : ''}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total a pagar:
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="primary.main">
                    {formatCurrency(compra.total)}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={handlePrint}
          startIcon={<PrintIcon />}
          variant="outlined"
        >
          Imprimir
        </Button>
        <Button
          onClick={onClose}
          variant="contained"
          startIcon={<CloseIcon />}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CompraViewDialog;