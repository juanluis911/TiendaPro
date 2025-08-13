import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Tooltip,
  Box,
  Typography,
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

import { Compra, ESTADOS_COMPRA } from '../../types/compras';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface ComprasTableProps {
  compras: Compra[];
  proveedores: any[];
  onEdit: (compra: Compra) => void;
  onView: (compra: Compra) => void;
  onDelete: (compra: Compra) => void;
  loading?: boolean;
}

const ComprasTable: React.FC<ComprasTableProps> = ({
  compras,
  proveedores,
  onEdit,
  onView,
  onDelete,
  loading = false,
}) => {
  const getProveedorNombre = (proveedorId: string) => {
    const proveedor = proveedores.find(p => p.id === proveedorId);
    return proveedor?.nombre || 'Proveedor no encontrado';
  };

  const getEstadoChip = (estado: string) => {
    const estadoInfo = ESTADOS_COMPRA.find(e => e.value === estado);
    if (!estadoInfo) return null;

    return (
      <Chip
        label={estadoInfo.label}
        color={estadoInfo.color as any}
        size="small"
        sx={{ fontWeight: 'bold' }}
      />
    );
  };

  const isVencida = (compra: Compra) => {
    const hoy = new Date();
    const fechaVencimiento = compra.fechaVencimiento.toDate();
    return compra.estado === 'pendiente' && fechaVencimiento < hoy;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <Typography>Cargando compras...</Typography>
      </Box>
    );
  }

  if (compras.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No hay compras registradas
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Comienza registrando tu primera compra
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell><strong>Factura</strong></TableCell>
            <TableCell><strong>Proveedor</strong></TableCell>
            <TableCell><strong>Fecha Compra</strong></TableCell>
            <TableCell><strong>Fecha Vencimiento</strong></TableCell>
            <TableCell align="right"><strong>Total</strong></TableCell>
            <TableCell><strong>Estado</strong></TableCell>
            <TableCell align="center"><strong>Acciones</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {compras.map((compra) => (
            <TableRow 
              key={compra.id}
              sx={{
                backgroundColor: isVencida(compra) ? 'error.light' : 'inherit',
                '&:hover': {
                  backgroundColor: isVencida(compra) ? 'error.main' : 'action.hover',
                }
              }}
            >
              <TableCell>
                <Typography variant="body2" fontWeight="bold">
                  {compra.numeroFactura}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {compra.productos.length} producto{compra.productos.length !== 1 ? 's' : ''}
                </Typography>
              </TableCell>
              
              <TableCell>
                <Typography variant="body2">
                  {getProveedorNombre(compra.proveedorId)}
                </Typography>
              </TableCell>
              
              <TableCell>
                <Typography variant="body2">
                  {formatDate(compra.fechaCompra.toDate())}
                </Typography>
              </TableCell>
              
              <TableCell>
                <Typography 
                  variant="body2"
                  color={isVencida(compra) ? 'error.main' : 'inherit'}
                  fontWeight={isVencida(compra) ? 'bold' : 'normal'}
                >
                  {formatDate(compra.fechaVencimiento.toDate())}
                </Typography>
                {isVencida(compra) && (
                  <Typography variant="caption" color="error.main">
                    VENCIDA
                  </Typography>
                )}
              </TableCell>
              
              <TableCell align="right">
                <Typography variant="body2" fontWeight="bold">
                  {formatCurrency(compra.total)}
                </Typography>
              </TableCell>
              
              <TableCell>
                {getEstadoChip(compra.estado)}
              </TableCell>
              
              <TableCell align="center">
                <Box display="flex" gap={1} justifyContent="center">
                  <Tooltip title="Ver detalles">
                    <IconButton
                      size="small"
                      onClick={() => onView(compra)}
                      color="info"
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Editar">
                    <IconButton
                      size="small"
                      onClick={() => onEdit(compra)}
                      color="primary"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Eliminar">
                    <IconButton
                      size="small"
                      onClick={() => onDelete(compra)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ComprasTable;