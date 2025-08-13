// src/pages/Compras.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Fab,
  Alert,
  InputAdornment,
  Tooltip,
  Select,
  FormControl,
  InputLabel,
  Collapse,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Receipt as ReceiptIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Payment as PaymentIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useSnackbar } from 'notistack';
import dayjs, { Dayjs } from 'dayjs';
import { Timestamp } from 'firebase/firestore';

import { useAuth } from '../contexts/AuthContext';
import {
  compraService,
  proveedorService,
  formatCurrency,
  formatDate,
  formatDateTime,
} from '../services/firebase';
import { Compra, Proveedor, ProductoCompra } from '../types';

// Schema de validación
const compraSchema = yup.object({
  proveedorId: yup.string().required('El proveedor es requerido'),
  numeroFactura: yup.string().required('El número de factura es requerido'),
  fechaCompra: yup.mixed().required('La fecha de compra es requerida'),
  fechaVencimiento: yup.mixed().required('La fecha de vencimiento es requerida'),
  productos: yup.array().of(
    yup.object({
      nombre: yup.string().required('El nombre del producto es requerido'),
      cantidad: yup.number().positive('La cantidad debe ser positiva').required('La cantidad es requerida'),
      unidad: yup.string().required('La unidad es requerida'),
      precioUnitario: yup.number().positive('El precio debe ser positivo').required('El precio unitario es requerido'),
    })
  ).min(1, 'Debe agregar al menos un producto'),
  notas: yup.string(),
});

interface CompraFormData {
  proveedorId: string;
  numeroFactura: string;
  fechaCompra: Dayjs | null;
  fechaVencimiento: Dayjs | null;
  productos: ProductoCompra[];
  notas: string;
}

interface Filters {
  proveedor: string;
  estado: string;
  fechaDesde: Dayjs | null;
  fechaHasta: Dayjs | null;
  busqueda: string;
}

const estadoColors: Record<string, 'default' | 'warning' | 'error' | 'success'> = {
  pendiente: 'warning',
  pagado: 'success',
  vencido: 'error',
};

const estadoIcons: Record<string, React.ReactNode> = {
  pendiente: <ScheduleIcon fontSize="small" />,
  pagado: <CheckCircleIcon fontSize="small" />,
  vencido: <WarningIcon fontSize="small" />,
};

const Compras: React.FC = () => {
  const { userProfile, userStores, hasPermission } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  // Estados principales
  const [compras, setCompras] = useState<Compra[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<string>('all');

  // Estados de diálogos
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [editingCompra, setEditingCompra] = useState<Compra | null>(null);
  const [viewingCompra, setViewingCompra] = useState<Compra | null>(null);

  // Estados de filtros
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    proveedor: '',
    estado: '',
    fechaDesde: null,
    fechaHasta: null,
    busqueda: '',
  });

  // Form setup
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CompraFormData>({
    resolver: yupResolver(compraSchema),
    defaultValues: {
      proveedorId: '',
      numeroFactura: '',
      fechaCompra: dayjs(),
      fechaVencimiento: dayjs().add(30, 'days'),
      productos: [{ nombre: '', cantidad: 1, unidad: 'kg', precioUnitario: 0, subtotal: 0 }],
      notas: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'productos',
  });

  const productos = watch('productos');

  // Calcular total automáticamente
  useEffect(() => {
    productos.forEach((producto, index) => {
      const subtotal = producto.cantidad * producto.precioUnitario;
      setValue(`productos.${index}.subtotal`, subtotal);
    });
  }, [productos, setValue]);

  const total = productos.reduce((sum, producto) => sum + (producto.subtotal || 0), 0);

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, [userProfile?.organizationId, selectedStore]);

  const loadData = async () => {
    if (!userProfile?.organizationId) return;

    try {
      setLoading(true);
      const storeId = selectedStore === 'all' ? undefined : selectedStore;

      const [comprasData, proveedoresData] = await Promise.all([
        compraService.getByOrganizationAndStore(userProfile.organizationId, storeId),
        proveedorService.getByOrganizationAndStore(userProfile.organizationId, storeId),
      ]);

      setCompras(comprasData);
      setProveedores(proveedoresData);
    } catch (error) {
      console.error('Error loading data:', error);
      enqueueSnackbar('Error al cargar los datos', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar compras
  const filteredCompras = compras.filter((compra) => {
    if (filters.proveedor && compra.proveedorId !== filters.proveedor) return false;
    if (filters.estado && compra.estado !== filters.estado) return false;
    if (filters.busqueda) {
      const searchTerm = filters.busqueda.toLowerCase();
      if (
        !compra.numeroFactura.toLowerCase().includes(searchTerm) &&
        !compra.productos.some(p => p.nombre.toLowerCase().includes(searchTerm))
      ) {
        return false;
      }
    }
    if (filters.fechaDesde) {
      const fechaCompra = compra.fechaCompra.toDate();
      if (fechaCompra < filters.fechaDesde.startOf('day').toDate()) return false;
    }
    if (filters.fechaHasta) {
      const fechaCompra = compra.fechaCompra.toDate();
      if (fechaCompra > filters.fechaHasta.endOf('day').toDate()) return false;
    }
    return true;
  });

  // Obtener nombre del proveedor
  const getProveedorNombre = (proveedorId: string) => {
    const proveedor = proveedores.find(p => p.id === proveedorId);
    return proveedor?.nombre || 'Proveedor no encontrado';
  };

  // Manejar envío del formulario
  const onSubmit = async (data: CompraFormData) => {
    if (!userProfile?.organizationId) return;

    try {
      const compraData = {
        organizationId: userProfile.organizationId,
        storeId: selectedStore === 'all' ? userStores[0]?.id || '' : selectedStore,
        proveedorId: data.proveedorId,
        numeroFactura: data.numeroFactura,
        productos: data.productos.map(p => ({
          ...p,
          subtotal: p.cantidad * p.precioUnitario,
        })),
        total,
        fechaCompra: Timestamp.fromDate(data.fechaCompra!.toDate()),
        fechaVencimiento: Timestamp.fromDate(data.fechaVencimiento!.toDate()),
        estado: 'pendiente' as const,
        notas: data.notas || '',
        createdBy: userProfile.uid,
      };

      if (editingCompra) {
        await compraService.update(editingCompra.id, compraData);
        enqueueSnackbar('Compra actualizada exitosamente', { variant: 'success' });
      } else {
        await compraService.create(compraData);
        enqueueSnackbar('Compra creada exitosamente', { variant: 'success' });
      }

      handleCloseDialog();
      loadData();
    } catch (error) {
      console.error('Error saving compra:', error);
      enqueueSnackbar('Error al guardar la compra', { variant: 'error' });
    }
  };

  // Manejar edición
  const handleEdit = (compra: Compra) => {
    setEditingCompra(compra);
    reset({
      proveedorId: compra.proveedorId,
      numeroFactura: compra.numeroFactura,
      fechaCompra: dayjs(compra.fechaCompra.toDate()),
      fechaVencimiento: dayjs(compra.fechaVencimiento.toDate()),
      productos: compra.productos,
      notas: compra.notas,
    });
    setOpenDialog(true);
  };

  // Manejar eliminación
  const handleDelete = async (compra: Compra) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta compra?')) return;

    try {
      await compraService.delete(compra.id);
      enqueueSnackbar('Compra eliminada exitosamente', { variant: 'success' });
      loadData();
    } catch (error) {
      console.error('Error deleting compra:', error);
      enqueueSnackbar('Error al eliminar la compra', { variant: 'error' });
    }
  };

  // Cerrar diálogo
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCompra(null);
    reset({
      proveedorId: '',
      numeroFactura: '',
      fechaCompra: dayjs(),
      fechaVencimiento: dayjs().add(30, 'days'),
      productos: [{ nombre: '', cantidad: 1, unidad: 'kg', precioUnitario: 0, subtotal: 0 }],
      notas: '',
    });
  };

  // Agregar producto
  const addProducto = () => {
    append({ nombre: '', cantidad: 1, unidad: 'kg', precioUnitario: 0, subtotal: 0 });
  };

  // Limpiar filtros
  const clearFilters = () => {
    setFilters({
      proveedor: '',
      estado: '',
      fechaDesde: null,
      fechaHasta: null,
      busqueda: '',
    });
  };

  if (!hasPermission('proveedores')) {
    return (
      <Box>
        <Alert severity="error">
          No tienes permisos para ver las compras.
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
            Compras
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gestión de compras a proveedores
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          size="large"
        >
          Nueva Compra
        </Button>
      </Box>

      {/* Selector de tienda */}
      {userStores.length > 1 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Tienda</InputLabel>
              <Select
                value={selectedStore}
                label="Tienda"
                onChange={(e) => setSelectedStore(e.target.value)}
              >
                <MenuItem value="all">Todas las tiendas</MenuItem>
                {userStores.map((store) => (
                  <MenuItem key={store.id} value={store.id}>
                    {store.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </CardContent>
        </Card>
      )}

      {/* Estadísticas rápidas */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <ReceiptIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{filteredCompras.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Compras
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <ScheduleIcon color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">
                    {filteredCompras.filter(c => c.estado === 'pendiente').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pendientes
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <WarningIcon color="error" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">
                    {filteredCompras.filter(c => c.estado === 'vencido').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Vencidas
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PaymentIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">
                    {formatCurrency(filteredCompras.reduce((sum, c) => sum + c.total, 0))}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Monto
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Filtros</Typography>
            <IconButton
              onClick={() => setShowFilters(!showFilters)}
              size="small"
            >
              {showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
          
          <Collapse in={showFilters}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Buscar"
                  value={filters.busqueda}
                  onChange={(e) => setFilters(prev => ({ ...prev, busqueda: e.target.value }))}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Proveedor</InputLabel>
                  <Select
                    value={filters.proveedor}
                    label="Proveedor"
                    onChange={(e) => setFilters(prev => ({ ...prev, proveedor: e.target.value }))}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {proveedores.map((proveedor) => (
                      <MenuItem key={proveedor.id} value={proveedor.id}>
                        {proveedor.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={filters.estado}
                    label="Estado"
                    onChange={(e) => setFilters(prev => ({ ...prev, estado: e.target.value }))}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="pendiente">Pendiente</MenuItem>
                    <MenuItem value="pagado">Pagado</MenuItem>
                    <MenuItem value="vencido">Vencido</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <DatePicker
                  label="Fecha desde"
                  value={filters.fechaDesde}
                  onChange={(date) => setFilters(prev => ({ ...prev, fechaDesde: date }))}
                  slotProps={{
                    textField: { size: 'small', fullWidth: true }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <DatePicker
                  label="Fecha hasta"
                  value={filters.fechaHasta}
                  onChange={(date) => setFilters(prev => ({ ...prev, fechaHasta: date }))}
                  slotProps={{
                    textField: { size: 'small', fullWidth: true }
                  }}
                />
              </Grid>
            </Grid>
            <Box mt={2} display="flex" gap={1}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={clearFilters}
                size="small"
              >
                Limpiar Filtros
              </Button>
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      {/* Tabla de compras */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Factura</TableCell>
                <TableCell>Proveedor</TableCell>
                <TableCell>Fecha Compra</TableCell>
                <TableCell>Vencimiento</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : filteredCompras.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No se encontraron compras
                  </TableCell>
                </TableRow>
              ) : (
                filteredCompras.map((compra) => (
                  <TableRow key={compra.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {compra.numeroFactura}
                      </Typography>
                    </TableCell>
                    <TableCell>{getProveedorNombre(compra.proveedorId)}</TableCell>
                    <TableCell>{formatDate(compra.fechaCompra)}</TableCell>
                    <TableCell>{formatDate(compra.fechaVencimiento)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(compra.total)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={estadoIcons[compra.estado]}
                        label={compra.estado.toUpperCase()}
                        color={estadoColors[compra.estado]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Ver detalles">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setViewingCompra(compra);
                            setOpenViewDialog(true);
                          }}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(compra)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(compra)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* FAB para nueva compra en móvil */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', sm: 'none' },
        }}
        onClick={() => setOpenDialog(true)}
      >
        <AddIcon />
      </Fab>

      {/* Diálogo de crear/editar compra */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        scroll="body"
      >
        <DialogTitle>
          {editingCompra ? 'Editar Compra' : 'Nueva Compra'}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Grid container spacing={2}>
              {/* Información básica */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name="proveedorId"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="Proveedor"
                      error={!!errors.proveedorId}
                      helperText={errors.proveedorId?.message}
                      margin="normal"
                    >
                      {proveedores.map((proveedor) => (
                        <MenuItem key={proveedor.id} value={proveedor.id}>
                          {proveedor.nombre}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="numeroFactura"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Número de Factura"
                      error={!!errors.numeroFactura}
                      helperText={errors.numeroFactura?.message}
                      margin="normal"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="fechaCompra"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      {...field}
                      label="Fecha de Compra"
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          margin: 'normal',
                          error: !!errors.fechaCompra,
                          helperText: errors.fechaCompra?.message,
                        }
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="fechaVencimiento"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      {...field}
                      label="Fecha de Vencimiento"
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          margin: 'normal',
                          error: !!errors.fechaVencimiento,
                          helperText: errors.fechaVencimiento?.message,
                        }
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Productos */}
              <Grid item xs={12}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} mb={1}>
                  <Typography variant="h6">Productos</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={addProducto}
                    size="small"
                  >
                    Agregar Producto
                  </Button>
                </Box>
                <Divider />
              </Grid>

              {fields.map((field, index) => (
                <Grid item xs={12} key={field.id}>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={3}>
                        <Controller
                          name={`productos.${index}.nombre`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Producto"
                              size="small"
                              error={!!errors.productos?.[index]?.nombre}
                              helperText={errors.productos?.[index]?.nombre?.message}
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={6} sm={2}>
                        <Controller
                          name={`productos.${index}.cantidad`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Cantidad"
                              type="number"
                              size="small"
                              error={!!errors.productos?.[index]?.cantidad}
                              helperText={errors.productos?.[index]?.cantidad?.message}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={6} sm={2}>
                        <Controller
                          name={`productos.${index}.unidad`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              select
                              fullWidth
                              label="Unidad"
                              size="small"
                              error={!!errors.productos?.[index]?.unidad}
                              helperText={errors.productos?.[index]?.unidad?.message}
                            >
                              <MenuItem value="kg">kg</MenuItem>
                              <MenuItem value="g">g</MenuItem>
                              <MenuItem value="l">l</MenuItem>
                              <MenuItem value="ml">ml</MenuItem>
                              <MenuItem value="pz">pz</MenuItem>
                              <MenuItem value="caja">caja</MenuItem>
                              <MenuItem value="costal">costal</MenuItem>
                            </TextField>
                          )}
                        />
                      </Grid>
                      <Grid item xs={6} sm={2}>
                        <Controller
                          name={`productos.${index}.precioUnitario`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Precio Unit."
                              type="number"
                              size="small"
                              error={!!errors.productos?.[index]?.precioUnitario}
                              helperText={errors.productos?.[index]?.precioUnitario?.message}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              InputProps={{
                                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                              }}
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={6} sm={2}>
                        <TextField
                          fullWidth
                          label="Subtotal"
                          size="small"
                          value={formatCurrency(productos[index]?.subtotal || 0)}
                          InputProps={{ readOnly: true }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={1}>
                        <IconButton
                          color="error"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Card>
                </Grid>
              ))}

              {/* Total */}
              <Grid item xs={12}>
                <Box display="flex" justifyContent="flex-end" mt={2}>
                  <Typography variant="h6">
                    Total: {formatCurrency(total)}
                  </Typography>
                </Box>
              </Grid>

              {/* Notas */}
              <Grid item xs={12}>
                <Controller
                  name="notas"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Notas (opcional)"
                      multiline
                      rows={3}
                      margin="normal"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : editingCompra ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Diálogo de visualización */}
      <Dialog
        open={openViewDialog}
        onClose={() => {
          setOpenViewDialog(false);
          setViewingCompra(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            Detalles de Compra
            <Box>
              <IconButton
                onClick={() => handleEdit(viewingCompra!)}
                color="primary"
                size="small"
              >
                <EditIcon />
              </IconButton>
              <IconButton
                onClick={() => {
                  // Aquí puedes implementar la funcionalidad de descargar/imprimir
                  console.log('Descargar compra:', viewingCompra);
                }}
                color="primary"
                size="small"
              >
                <DownloadIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {viewingCompra && (
            <Box>
              {/* Información general */}
              <Grid container spacing={2} mb={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Número de Factura
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {viewingCompra.numeroFactura}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Proveedor
                  </Typography>
                  <Typography variant="body1">
                    {getProveedorNombre(viewingCompra.proveedorId)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Fecha de Compra
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(viewingCompra.fechaCompra)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Fecha de Vencimiento
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(viewingCompra.fechaVencimiento)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Estado
                  </Typography>
                  <Chip
                    icon={estadoIcons[viewingCompra.estado]}
                    label={viewingCompra.estado.toUpperCase()}
                    color={estadoColors[viewingCompra.estado]}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {formatCurrency(viewingCompra.total)}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Productos */}
              <Typography variant="h6" gutterBottom>
                Productos
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Producto</TableCell>
                      <TableCell align="right">Cantidad</TableCell>
                      <TableCell>Unidad</TableCell>
                      <TableCell align="right">Precio Unit.</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {viewingCompra.productos.map((producto, index) => (
                      <TableRow key={index}>
                        <TableCell>{producto.nombre}</TableCell>
                        <TableCell align="right">{producto.cantidad}</TableCell>
                        <TableCell>{producto.unidad}</TableCell>
                        <TableCell align="right">
                          {formatCurrency(producto.precioUnitario)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(producto.subtotal)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={4} align="right">
                        <Typography variant="h6">Total:</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="h6" color="primary">
                          {formatCurrency(viewingCompra.total)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Notas */}
              {viewingCompra.notas && (
                <Box mt={3}>
                  <Typography variant="h6" gutterBottom>
                    Notas
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {viewingCompra.notas}
                  </Typography>
                </Box>
              )}

              {/* Información de auditoría */}
              <Box mt={3} p={2} bgcolor="grey.50" borderRadius={1}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Información de registro
                </Typography>
                <Typography variant="body2">
                  Creado: {formatDateTime(viewingCompra.createdAt)}
                </Typography>
                <Typography variant="body2">
                  Por: {viewingCompra.createdBy}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenViewDialog(false);
              setViewingCompra(null);
            }}
          >
            Cerrar
          </Button>
          <Button
            variant="contained"
            startIcon={<PaymentIcon />}
            onClick={() => {
              // Aquí puedes implementar la navegación al módulo de pagos
              console.log('Registrar pago para compra:', viewingCompra);
            }}
          >
            Registrar Pago
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Compras;