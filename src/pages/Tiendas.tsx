// src/pages/Tiendas.tsx
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
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
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
  Person as PersonIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { storeService, userService, formatDate } from '../services/firebase';
import { Store, UserProfile } from '../types';
import { useSnackbar } from 'notistack';
import TiendaDialog from '../components/tiendas/TiendaDialog';
import TiendaViewDialog from '../components/tiendas/TiendaViewDialog';
import TiendasStats from '../components/tiendas/TiendasStats';
import ConfirmDialog from '../components/common/ConfirmDialog';

const Tiendas: React.FC = () => {
  const { userProfile, userStores, hasPermission } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  
  const [tiendas, setTiendas] = useState<Store[]>([]);
  const [usuarios, setUsuarios] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados de diálogos
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedTienda, setSelectedTienda] = useState<Store | null>(null);
  const [viewingTienda, setViewingTienda] = useState<Store | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [tiendaToDelete, setTiendaToDelete] = useState<Store | null>(null);
  
  // Estados de menús
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuTienda, setMenuTienda] = useState<Store | null>(null);

  // Verificar permisos
  if (!hasPermission('multitienda')) {
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
  }, [userProfile?.organizationId]);

  const loadData = async () => {
    if (!userProfile?.organizationId) return;

    try {
      setLoading(true);
      
      // Cargar tiendas y usuarios en paralelo
      const [tiendasData, usuariosData] = await Promise.all([
        storeService.getByOrganizationId(userProfile.organizationId),
        userService.getByOrganizationId(userProfile.organizationId)
      ]);

      setTiendas(tiendasData);
      setUsuarios(usuariosData);
      
    } catch (error) {
      console.error('Error cargando datos:', error);
      enqueueSnackbar('Error al cargar los datos', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar tiendas por búsqueda
  const filteredTiendas = tiendas.filter(tienda =>
    tienda.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tienda.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tienda.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Obtener nombre del manager
  const getManagerName = (managerId: string) => {
    const manager = usuarios.find(u => u.uid === managerId);
    return manager?.displayName || 'No asignado';
  };

  // Manejar acciones
  const handleCreateNew = () => {
    setSelectedTienda(null);
    setDialogOpen(true);
  };

  const handleEdit = (tienda: Store) => {
    setSelectedTienda(tienda);
    setDialogOpen(true);
    setAnchorEl(null);
  };

  const handleView = (tienda: Store) => {
    setViewingTienda(tienda);
    setViewDialogOpen(true);
    setAnchorEl(null);
  };

  const handleDelete = (tienda: Store) => {
    setTiendaToDelete(tienda);
    setConfirmDeleteOpen(true);
    setAnchorEl(null);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, tienda: Store) => {
    setAnchorEl(event.currentTarget);
    setMenuTienda(tienda);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuTienda(null);
  };

  const confirmDelete = async () => {
    if (!tiendaToDelete) return;

    try {
      await storeService.update(tiendaToDelete.id, { active: false });
      enqueueSnackbar('Tienda desactivada correctamente', { variant: 'success' });
      loadData();
    } catch (error) {
      console.error('Error desactivando tienda:', error);
      enqueueSnackbar('Error al desactivar la tienda', { variant: 'error' });
    } finally {
      setConfirmDeleteOpen(false);
      setTiendaToDelete(null);
    }
  };

  const handleDialogClose = (reload?: boolean) => {
    setDialogOpen(false);
    setSelectedTienda(null);
    if (reload) {
      loadData();
    }
  };

  const handleViewDialogClose = () => {
    setViewDialogOpen(false);
    setViewingTienda(null);
  };

  // Renderizar tarjeta de tienda
  const renderTiendaCard = (tienda: Store) => (
    <Card key={tienda.id} sx={{ height: '100%', position: 'relative' }}>
      <CardContent>
        {/* Botón de menú */}
        <IconButton
          size="small"
          onClick={(e) => handleMenuClick(e, tienda)}
          sx={{ position: 'absolute', top: 8, right: 8 }}
        >
          <MoreVertIcon />
        </IconButton>

        {/* Información principal */}
        <Box mb={2}>
          <Typography variant="h6" gutterBottom noWrap>
            {tienda.name}
          </Typography>
          
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <LocationIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary" noWrap>
              {tienda.address}
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <PhoneIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {tienda.phone}
            </Typography>
          </Box>

          {tienda.email && (
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <EmailIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary" noWrap>
                {tienda.email}
              </Typography>
            </Box>
          )}

          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <PersonIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {getManagerName(tienda.manager)}
            </Typography>
          </Box>
        </Box>

        {/* Estado y fecha */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Chip
            label={tienda.active ? 'Activa' : 'Inactiva'}
            size="small"
            color={tienda.active ? 'success' : 'error'}
            variant="outlined"
          />
          <Typography variant="caption" color="text.secondary">
            Creada: {formatDate(tienda.createdAt)}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Estadísticas */}
      <TiendasStats tiendas={tiendas} usuarios={usuarios} />

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Gestión de Tiendas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Administra todas las tiendas de tu organización
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateNew}
          size="large"
        >
          Nueva Tienda
        </Button>
      </Box>

      {/* Filtros y búsqueda */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                placeholder="Buscar por nombre, dirección o email..."
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
            
            <Grid item xs={12} md={4}>
              <Box display="flex" justifyContent="flex-end" alignItems="center" gap={2}>
                <Typography variant="body2" color="text.secondary">
                  {filteredTiendas.length} tienda(s)
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Lista de tiendas */}
      {loading ? (
        <Grid container spacing={3}>
          {[...Array(6)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="60%" height={32} />
                  <Skeleton variant="text" width="80%" />
                  <Skeleton variant="text" width="70%" />
                  <Skeleton variant="text" width="50%" />
                  <Box display="flex" justifyContent="space-between" mt={2}>
                    <Skeleton variant="rectangular" width={60} height={24} />
                    <Skeleton variant="text" width="30%" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : filteredTiendas.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <BusinessIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No hay tiendas registradas
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              {searchTerm ? 'No se encontraron tiendas que coincidan con la búsqueda' : 'Comienza agregando tu primera tienda'}
            </Typography>
            {!searchTerm && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateNew}
              >
                Crear Primera Tienda
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredTiendas.map((tienda) => (
            <Grid item xs={12} sm={6} md={4} key={tienda.id}>
              {renderTiendaCard(tienda)}
            </Grid>
          ))}
        </Grid>
      )}

      {/* Menú contextual */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => menuTienda && handleView(menuTienda)}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Ver detalles" />
        </MenuItem>
        <MenuItem onClick={() => menuTienda && handleEdit(menuTienda)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Editar" />
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => menuTienda && handleDelete(menuTienda)}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Desactivar" />
        </MenuItem>
      </Menu>

      {/* Diálogos */}
      <TiendaDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        tienda={selectedTienda}
        usuarios={usuarios}
      />

      <TiendaViewDialog
        open={viewDialogOpen}
        onClose={handleViewDialogClose}
        tienda={viewingTienda}
        manager={viewingTienda ? usuarios.find(u => u.uid === viewingTienda.manager) : undefined}
      />

      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Desactivar Tienda"
        message={`¿Estás seguro de que quieres desactivar la tienda "${tiendaToDelete?.name}"? Esta acción se puede revertir desde la configuración.`}
        confirmText="Desactivar"
        cancelText="Cancelar"
        severity="warning"
      />
    </Box>
  );
};

export default Tiendas;