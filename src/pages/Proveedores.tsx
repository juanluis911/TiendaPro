// src/pages/Proveedores.tsx (versión actualizada)
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Alert,
  Grid,
  Skeleton,
  Fab,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Store as StoreIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { proveedorService, formatDate } from '../services/firebase';
import { Proveedor } from '../types';
import { useSnackbar } from 'notistack';
import ProveedorDialog from '../components/proveedores/ProveedorDialog';
import ConfirmDialog from '../components/common/ConfirmDialog';

const Proveedores: React.FC = () => {
  const { userProfile, userStores } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [proveedorToDelete, setProveedorToDelete] = useState<Proveedor | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuProveedor, setMenuProveedor] = useState<Proveedor | null>(null);

  const loadProveedores = async () => {
    if (!userProfile?.organizationId) return;

    try {
      setLoading(true);
      const storeFilter = selectedStore === 'all' ? undefined : selectedStore;
      const data = await proveedorService.getByOrganizationAndStore(
        userProfile.organizationId,
        storeFilter
      );
      setProveedores(data);
    } catch (error) {
      console.error('Error loading proveedores:', error);
      enqueueSnackbar('Error al cargar proveedores', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProveedores();
  }, [userProfile?.organizationId, selectedStore]);

  const filteredProveedores = proveedores.filter(proveedor =>
    proveedor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proveedor.contacto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (proveedor.email && proveedor.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateNew = () => {
    setSelectedProveedor(null);
    setDialogOpen(true);
  };

  const handleEdit = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);
    setDialogOpen(true);
    handleCloseMenu();
  };

  const handleView = (proveedor: Proveedor) => {
    // TODO: Implementar vista detallada
    enqueueSnackbar('Vista detallada próximamente', { variant: 'info' });
    handleCloseMenu();
  };

  const handleDelete = (proveedor: Proveedor) => {
    setProveedorToDelete(proveedor);
    setConfirmDeleteOpen(true);
    handleCloseMenu();
  };

  const confirmDelete = async () => {
    if (!proveedorToDelete) return;

    try {
      await proveedorService.delete(proveedorToDelete.id);
      enqueueSnackbar('Proveedor eliminado correctamente', { variant: 'success' });
      loadProveedores();
    } catch (error) {
      console.error('Error deleting proveedor:', error);
      enqueueSnackbar('Error al eliminar proveedor', { variant: 'error' });
    } finally {
      setConfirmDeleteOpen(false);
      setProveedorToDelete(null);
    }
  };

  const handleDialogClose = (reload = false) => {
    setDialogOpen(false);
    setSelectedProveedor(null);
    if (reload) {
      loadProveedores();
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, proveedor: Proveedor) => {
    setAnchorEl(event.currentTarget);
    setMenuProveedor(proveedor);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuProveedor(null);
  };

  const getStoreNames = (storeIds: string[]) => {
    if (!storeIds || storeIds.length === 0) return 'Sin tiendas';
    
    const names = storeIds.map(storeId => {
      const store = userStores.find(s => s.id === storeId);
      return store?.name || storeId;
    });
    
    return names.join(', ');
  };

  const ProveedorCard: React.FC<{ proveedor: Proveedor }> = ({ proveedor }) => (
    <Card sx={{ height: '100%', position: 'relative' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <BusinessIcon color="primary" />
            <Typography variant="h6" component="h3" noWrap>
              {proveedor.nombre}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={(e) => handleMenuOpen(e, proveedor)}
            sx={{ ml: 1 }}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>

        <Box mb={2}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Contacto: {proveedor.contacto}
          </Typography>
          
          <Box display="flex" alignItems="center" gap={0.5} mb={1}>
            <PhoneIcon fontSize="small" color="action" />
            <Typography variant="body2">{proveedor.telefono}</Typography>
          </Box>
          
          {proveedor.email && (
            <Box display="flex" alignItems="center" gap={0.5} mb={1}>
              <EmailIcon fontSize="small" color="action" />
              <Typography variant="body2" noWrap>{proveedor.email}</Typography>
            </Box>
          )}
          
          <Box display="flex" alignItems="center" gap={0.5} mb={2}>
            <LocationIcon fontSize="small" color="action" />
            <Typography variant="body2" noWrap>{proveedor.direccion}</Typography>
          </Box>
        </Box>

        <Box mb={2}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Productos:
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={0.5}>
            {proveedor.tipoProductos.slice(0, 3).map((producto, index) => (
              <Chip key={index} label={producto} size="small" variant="outlined" />
            ))}
            {proveedor.tipoProductos.length > 3 && (
              <Chip 
                label={`+${proveedor.tipoProductos.length - 3} más`} 
                size="small" 
                variant="outlined" 
                color="primary"
              />
            )}
          </Box>
        </Box>

        <Box mb={2}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Tiendas:
          </Typography>
          <Box display="flex" alignItems="center" gap={0.5}>
            <StoreIcon fontSize="small" color="action" />
            <Typography variant="body2" noWrap>
              {proveedor.esGlobal ? 'Todas las tiendas' : getStoreNames(proveedor.storeIds)}
            </Typography>
          </Box>
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Chip
            label={proveedor.activo ? 'Activo' : 'Inactivo'}
            size="small"
            color={proveedor.activo ? 'success' : 'error'}
            variant="outlined"
          />
          <Typography variant="caption" color="text.secondary">
            Creado: {formatDate(proveedor.createdAt)}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Proveedores
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gestiona todos los proveedores de tu organización
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateNew}
          size="large"
        >
          Nuevo Proveedor
        </Button>
      </Box>

      {/* Filtros y búsqueda */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Buscar por nombre, contacto o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            {userStores.length > 1 && (
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Filtrar por tienda"
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="all">Todas las tiendas</option>
                  {userStores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </TextField>
              </Grid>
            )}
            
            <Grid item xs={12} md={2}>
              <Box display="flex" justifyContent="flex-end">
                <Typography variant="body2" color="text.secondary">
                  {filteredProveedores.length} proveedor(es)
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Lista de proveedores */}
      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item}>
              <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      ) : filteredProveedores.length > 0 ? (
        <Grid container spacing={3}>
          {filteredProveedores.map((proveedor) => (
            <Grid item xs={12} sm={6} md={4} key={proveedor.id}>
              <ProveedorCard proveedor={proveedor} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <BusinessIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {searchTerm ? 'No se encontraron proveedores' : 'No hay proveedores registrados'}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              {searchTerm 
                ? 'Intenta con otros términos de búsqueda'
                : 'Comienza agregando tu primer proveedor'
              }
            </Typography>
            {!searchTerm && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateNew}
              >
                Crear Primer Proveedor
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Floating Action Button para móvil */}
      <Fab
        color="primary"
        aria-label="agregar proveedor"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', md: 'none' },
        }}
        onClick={handleCreateNew}
      >
        <AddIcon />
      </Fab>

      {/* Menú contextual */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{
          sx: { minWidth: 160 },
        }}
      >
        <MenuItem onClick={() => menuProveedor && handleView(menuProveedor)}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ver detalles</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => menuProveedor && handleEdit(menuProveedor)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={() => menuProveedor && handleDelete(menuProveedor)}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Eliminar</ListItemText>
        </MenuItem>
      </Menu>

      {/* Diálogos */}
      <ProveedorDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        proveedor={selectedProveedor}
      />

      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Eliminar Proveedor"
        message={`¿Estás seguro de que deseas eliminar el proveedor "${proveedorToDelete?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        confirmColor="error"
        severity="error"
      />
    </Box>
  );
};

export default Proveedores;