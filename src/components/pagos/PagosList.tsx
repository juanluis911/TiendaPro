// src/components/pagos/PagosList.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

import { PagoConDetalles, METODOS_PAGO } from '../../types/pagos';
import { useAuth } from '../../contexts/AuthContext';
import pagoService from '../../services/pagoService';
import PagoForm from './PagoForm';
import PagoDetail from './PagoDetail';

interface PagosListProps {
  onNuevoPago?: () => void;
}

const PagosList: React.FC<PagosListProps> = ({ onNuevoPago }) => {
  const { userProfile } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  // Estados principales
  const [pagos, setPagos] = useState<PagoConDetalles[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [fechaInicio, setFechaInicio] = useState<dayjs.Dayjs | null>(null);
  const [fechaFin, setFechaFin] = useState<dayjs.Dayjs | null>(null);
  const [metodoPagoFilter, setMetodoPagoFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Estados de UI
  const [selectedPago, setSelectedPago] = useState<PagoConDetalles | null>(null);
  const [showPagoForm, setShowPagoForm] = useState(false);
  const [showPagoDetail, setShowPagoDetail] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pagoToDelete, setPagoToDelete] = useState<PagoConDetalles | null>(null);

  // Cargar pagos
  const loadPagos = async () => {
    if (!userProfile?.organizationId) return;

    setLoading(true);
    try {
      let pagosData: PagoConDetalles[] = [];

      if (fechaInicio && fechaFin) {
        // Buscar por rango de fechas si están definidas
        const pagosPorFecha = await pagoService.getByDateRange(
          userProfile.organizationId,
          fechaInicio.toDate(), // Convertir dayjs a Date
          fechaFin.toDate(),    // Convertir dayjs a Date
          userProfile.storeAccess?.[0]
        );

        // Obtener detalles para cada pago
        for (const pago of pagosPorFecha) {
          const pagosConDetalles = await pagoService.getWithDetails(
            userProfile.organizationId,
            userProfile.storeAccess?.[0]
          );
          const pagoConDetalle = pagosConDetalles.find(p => p.id === pago.id);
          if (pagoConDetalle) {
            pagosData.push(pagoConDetalle);
          }
        }
      } else {
        // Cargar todos los pagos con detalles
        pagosData = await pagoService.getWithDetails(
          userProfile.organizationId,
          userProfile.storeAccess?.[0]
        );
      }

      setPagos(pagosData);
    } catch (error) {
      console.error('Error loading pagos:', error);
      enqueueSnackbar('Error al cargar los pagos', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPagos();
  }, [userProfile, fechaInicio, fechaFin]);

  // Filtrar pagos
  const filteredPagos = pagos.filter((pago) => {
    const matchesSearch = !searchTerm || 
      pago.proveedorInfo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pago.compraInfo.numeroFactura.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pago.referencia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pago.notas?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMetodo = !metodoPagoFilter || pago.metodoPago === metodoPagoFilter;

    return matchesSearch && matchesMetodo;
  });

  // Paginación
  const paginatedPagos = filteredPagos.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, pago: PagoConDetalles) => {
    setAnchorEl(event.currentTarget);
    setSelectedPago(pago);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPago(null);
  };

  const handleViewDetails = () => {
    setShowPagoDetail(true);
    handleMenuClose();
  };

  const handleDeletePago = () => {
    setPagoToDelete(selectedPago);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const confirmDelete = async () => {
    if (!pagoToDelete) return;

    try {
      await pagoService.delete(pagoToDelete.id);
      enqueueSnackbar('Pago eliminado exitosamente', { variant: 'success' });
      loadPagos();
    } catch (error) {
      console.error('Error deleting pago:', error);
      enqueueSnackbar('Error al eliminar el pago', { variant: 'error' });
    } finally {
      setDeleteDialogOpen(false);
      setPagoToDelete(null);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFechaInicio(null);
    setFechaFin(null);
    setMetodoPagoFilter('');
    setPage(0);
  };

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

  const getMetodoLabel = (metodo: string) => {
    const metodoPago = METODOS_PAGO.find(m => m.value === metodo);
    return metodoPago?.label || metodo;
  };

  return (
    <Box>
      {/* Header con filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Gestión de Pagos
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Ocultar Filtros' : 'Filtros'}
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setShowPagoForm(true);
                  if (onNuevoPago) onNuevoPago();
                }}
              >
                Nuevo Pago
              </Button>
            </Box>
          </Box>

          {/* Barra de búsqueda */}
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Buscar por proveedor, factura, referencia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                {filteredPagos.length} pago(s) encontrado(s)
                {filteredPagos.length !== pagos.length && ` de ${pagos.length} total`}
              </Typography>
            </Grid>
          </Grid>

          {/* Filtros expandibles */}
          {showFilters && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <DatePicker
                label="Fecha Inicio"
                value={fechaInicio}
                onChange={setFechaInicio}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <DatePicker
                label="Fecha Fin"
                value={fechaFin}
                onChange={setFechaFin}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small'
                  }
                }}
              />
            </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Método de Pago</InputLabel>
                    <Select
                      value={metodoPagoFilter}
                      onChange={(e) => setMetodoPagoFilter(e.target.value)}
                      label="Método de Pago"
                    >
                      <MenuItem value="">Todos</MenuItem>
                      {METODOS_PAGO.map((metodo) => (
                        <MenuItem key={metodo.value} value={metodo.value}>
                          {metodo.icon} {metodo.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={clearFilters}
                    size="large"
                  >
                    Limpiar Filtros
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Tabla de pagos */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Proveedor</TableCell>
                <TableCell>Factura</TableCell>
                <TableCell>Monto</TableCell>
                <TableCell>Método</TableCell>
                <TableCell>Referencia</TableCell>
                <TableCell>Estado Compra</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography>Cargando pagos...</Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedPagos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="text.secondary">
                      No se encontraron pagos
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPagos.map((pago) => (
                  <TableRow key={pago.id} hover>
                    <TableCell>
                      <Typography variant="body2">
                        {dayjs(pago.fechaPago.toDate()).format('DD/MM/YYYY')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {dayjs(pago.fechaPago.toDate()).format('HH:mm')}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {pago.proveedorInfo.nombre}
                      </Typography>
                      {pago.proveedorInfo.telefono && (
                        <Typography variant="caption" color="text.secondary">
                          {pago.proveedorInfo.telefono}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">
                        {pago.compraInfo.numeroFactura}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Total: {formatCurrency(pago.compraInfo.total)}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontWeight="medium" color="success.main">
                        {formatCurrency(pago.monto)}
                      </Typography>
                      {pago.montoPendiente > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          Pendiente: {formatCurrency(pago.montoPendiente)}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{getMetodoIcon(pago.metodoPago)}</span>
                        <Typography variant="body2">
                          {getMetodoLabel(pago.metodoPago)}
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">
                        {pago.referencia || '-'}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={pago.compraInfo.estado.toUpperCase()}
                        size="small"
                        color={
                          pago.compraInfo.estado === 'pagado' ? 'success' :
                          pago.compraInfo.estado === 'parcial' ? 'warning' : 'error'
                        }
                      />
                    </TableCell>

                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, pago)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Paginación */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredPagos.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
          }
        />
      </Card>

      {/* Menú contextual */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewDetails}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ver Detalles</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeletePago}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Eliminar</ListItemText>
        </MenuItem>
      </Menu>

      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            ⚠️ Esta acción no se puede deshacer
          </Alert>
          <Typography>
            ¿Está seguro que desea eliminar este pago?
          </Typography>
          {pagoToDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>Proveedor:</strong> {pagoToDelete.proveedorInfo.nombre}
              </Typography>
              <Typography variant="body2">
                <strong>Monto:</strong> {formatCurrency(pagoToDelete.monto)}
              </Typography>
              <Typography variant="body2">
                <strong>Fecha:</strong> {dayjs(pagoToDelete.fechaPago.toDate()).format('DD/MM/YYYY')}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Formulario de nuevo pago */}
      <PagoForm
        open={showPagoForm}
        onClose={() => setShowPagoForm(false)}
        onSuccess={loadPagos}
      />

      {/* Detalle del pago */}
      {selectedPago && (
        <PagoDetail
          open={showPagoDetail}
          onClose={() => setShowPagoDetail(false)}
          pago={selectedPago}
        />
      )}
    </Box>
  );
};

export default PagosList;