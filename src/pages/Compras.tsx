import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';

import { useAuth } from '../contexts/AuthContext';
// Importar desde firebase.ts donde ya está definido el servicio
import { 
  compraService, 
  proveedorService,
  formatCurrency,
  formatDate
} from '../services/firebase';

// Componentes
import CompraForm from '../components/compras/CompraForm';
import ComprasTable from '../components/compras/ComprasTable';
import ComprasFilters from '../components/compras/ComprasFilters';
import ComprasStats from '../components/compras/ComprasStats';
import CompraViewDialog from '../components/compras/CompraViewDialog';

// Tipos
import { Compra, CompraFormData, CompraFilters } from '../types/compras';
import { Proveedor } from '../types';

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
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingCompra, setEditingCompra] = useState<Compra | null>(null);
  const [viewingCompra, setViewingCompra] = useState<Compra | null>(null);
  const [deletingCompra, setDeletingCompra] = useState<Compra | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados de filtros
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<CompraFilters>({
    proveedor: '',
    estado: '',
    fechaDesde: null,
    fechaHasta: null,
    busqueda: '',
  });

  // Verificar permisos
  if (!hasPermission('proveedores')) {
    return (
      <Box p={3}>
        <Alert severity="error">
          No tienes permisos para acceder a esta sección.
        </Alert>
      </Box>
    );
  }

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
  const handleSubmit = async (data: CompraFormData) => {
    if (!userProfile?.organizationId) return;

    try {
      setIsSubmitting(true);
      
      const compraData = {
        organizationId: userProfile.organizationId,
        storeId: selectedStore === 'all' ? userStores[0]?.id : selectedStore,
        proveedorId: data.proveedorId,
        numeroFactura: data.numeroFactura,
        fechaCompra: data.fechaCompra.toDate(),
        fechaVencimiento: data.fechaVencimiento.toDate(),
        productos: data.productos.map(producto => ({
          nombre: producto.nombre,
          cantidad: Number(producto.cantidad),
          unidad: producto.unidad,
          precioUnitario: Number(producto.precioUnitario),
          subtotal: Number(producto.cantidad) * Number(producto.precioUnitario)
        })),
        total: data.total,
        estado: 'pendiente' as const,
        notas: data.notas || '',
        createdBy: userProfile.email,
        createdAt: new Date(),
      };

      if (editingCompra) {
        await compraService.update(editingCompra.id, {
          ...compraData,
          updatedAt: new Date(),
        });
        enqueueSnackbar('Compra actualizada exitosamente', { variant: 'success' });
      } else {
        await compraService.create(compraData);
        enqueueSnackbar('Compra registrada exitosamente', { variant: 'success' });
      }

      handleCloseDialog();
      loadData();
    } catch (error) {
      console.error('Error saving compra:', error);
      enqueueSnackbar('Error al guardar la compra', { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejar edición
  const handleEdit = (compra: Compra) => {
    setEditingCompra(compra);
    setOpenDialog(true);
  };

  // Manejar vista
  const handleView = (compra: Compra) => {
    setViewingCompra(compra);
    setOpenViewDialog(true);
  };

  // Manejar eliminación
  const handleDelete = (compra: Compra) => {
    setDeletingCompra(compra);
    setOpenDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deletingCompra) return;

    try {
      await compraService.delete(deletingCompra.id);
      enqueueSnackbar('Compra eliminada exitosamente', { variant: 'success' });
      setOpenDeleteDialog(false);
      setDeletingCompra(null);
      loadData();
    } catch (error) {
      console.error('Error deleting compra:', error);
      enqueueSnackbar('Error al eliminar la compra', { variant: 'error' });
    }
  };

  // Cerrar diálogos
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCompra(null);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setViewingCompra(null);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setDeletingCompra(null);
  };

  // Alternar filtros
  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };

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

      {/* Estadísticas */}
      <ComprasStats compras={filteredCompras} />

      {/* Filtros */}
      <ComprasFilters
        filters={filters}
        onFiltersChange={setFilters}
        proveedores={proveedores}
        showFilters={showFilters}
        onToggleFilters={handleToggleFilters}
      />

      {/* Tabla de compras */}
      <ComprasTable
        compras={filteredCompras}
        proveedores={proveedores}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
        loading={loading}
      />

      {/* Formulario de compra */}
      <CompraForm
        open={openDialog}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        editingCompra={editingCompra}
        proveedores={proveedores}
        isSubmitting={isSubmitting}
      />

      {/* Diálogo de vista */}
      <CompraViewDialog
        open={openViewDialog}
        onClose={handleCloseViewDialog}
        compra={viewingCompra}
        proveedorNombre={viewingCompra ? getProveedorNombre(viewingCompra.proveedorId) : ''}
      />

      {/* Diálogo de confirmación de eliminación */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar la compra {deletingCompra?.numeroFactura}?
            Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>
            Cancelar
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            startIcon={<DeleteIcon />}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Compras;