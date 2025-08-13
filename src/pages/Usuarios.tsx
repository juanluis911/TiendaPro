// src/pages/Usuarios.tsx
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
  Person as PersonIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { userService, storeService, formatDate } from '../services/firebase';
import { UserProfile, Store } from '../types';
import { useSnackbar } from 'notistack';
import UsuarioDialog from '../components/usuarios/UsuarioDialog';
import UsuarioViewDialog from '../components/usuarios/UsuarioViewDialog';
import UsuariosStats from '../components/usuarios/UsuariosStats';
import UsuariosTable from '../components/usuarios/UsuariosTable';
import UsuariosFilters from '../components/usuarios/UsuariosFilters';
import ConfirmDialog from '../components/common/ConfirmDialog';

export interface UsuarioFilters {
  role: string;
  status: string;
  storeAccess: string;
  busqueda: string;
}

const Usuarios: React.FC = () => {
  const { userProfile, userStores, hasPermission } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  
  const [usuarios, setUsuarios] = useState<UserProfile[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados de diálogos
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<UserProfile | null>(null);
  const [viewingUsuario, setViewingUsuario] = useState<UserProfile | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [usuarioToDelete, setUsuarioToDelete] = useState<UserProfile | null>(null);
  
  // Estados de filtros
  const [filters, setFilters] = useState<UsuarioFilters>({
    role: '',
    status: '',
    storeAccess: '',
    busqueda: '',
  });
  
  // Estados de menús
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuUsuario, setMenuUsuario] = useState<UserProfile | null>(null);

  // Verificar permisos
  if (!hasPermission('configuracion')) {
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
      
      // Cargar usuarios y tiendas en paralelo
      const [usuariosData, storesData] = await Promise.all([
        userService.getByOrganizationId(userProfile.organizationId),
        storeService.getByOrganizationId(userProfile.organizationId)
      ]);

      setUsuarios(usuariosData);
      setStores(storesData);
      
    } catch (error) {
      console.error('Error cargando datos:', error);
      enqueueSnackbar('Error al cargar los datos', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar usuarios
  const filteredUsuarios = usuarios.filter(usuario => {
    const matchesSearch = !filters.busqueda || 
      usuario.displayName.toLowerCase().includes(filters.busqueda.toLowerCase()) ||
      usuario.email.toLowerCase().includes(filters.busqueda.toLowerCase());
    
    const matchesRole = !filters.role || usuario.role === filters.role;
    
    const matchesStatus = !filters.status || 
      (filters.status === 'active' && usuario.active) ||
      (filters.status === 'inactive' && !usuario.active);
    
    const matchesStore = !filters.storeAccess || 
      usuario.storeAccess.includes(filters.storeAccess);

    return matchesSearch && matchesRole && matchesStatus && matchesStore;
  });

  // Obtener nombres de tiendas
  const getStoreNames = (storeIds: string[]) => {
    return storeIds.map(id => {
      const store = stores.find(s => s.id === id);
      return store?.name || 'Tienda no encontrada';
    });
  };

  // Manejar acciones
  const handleCreateNew = () => {
    setSelectedUsuario(null);
    setDialogOpen(true);
  };

  const handleEdit = (usuario: UserProfile) => {
    setSelectedUsuario(usuario);
    setDialogOpen(true);
    setAnchorEl(null);
  };

  const handleView = (usuario: UserProfile) => {
    setViewingUsuario(usuario);
    setViewDialogOpen(true);
    setAnchorEl(null);
  };

  const handleToggleStatus = async (usuario: UserProfile) => {
    try {
      await userService.update(usuario.uid, { active: !usuario.active });
      enqueueSnackbar(
        `Usuario ${usuario.active ? 'desactivado' : 'activado'} correctamente`, 
        { variant: 'success' }
      );
      loadData();
    } catch (error) {
      console.error('Error actualizando estado:', error);
      enqueueSnackbar('Error al actualizar el estado del usuario', { variant: 'error' });
    }
    setAnchorEl(null);
  };

  const handleDelete = (usuario: UserProfile) => {
    setUsuarioToDelete(usuario);
    setConfirmDeleteOpen(true);
    setAnchorEl(null);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, usuario: UserProfile) => {
    setAnchorEl(event.currentTarget);
    setMenuUsuario(usuario);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuUsuario(null);
  };

  const confirmDelete = async () => {
    if (!usuarioToDelete) return;

    try {
      await userService.update(usuarioToDelete.uid, { active: false });
      enqueueSnackbar('Usuario eliminado correctamente', { variant: 'success' });
      loadData();
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      enqueueSnackbar('Error al eliminar el usuario', { variant: 'error' });
    } finally {
      setConfirmDeleteOpen(false);
      setUsuarioToDelete(null);
    }
  };

  const handleDialogClose = (reload?: boolean) => {
    setDialogOpen(false);
    setSelectedUsuario(null);
    if (reload) {
      loadData();
    }
  };

  const handleViewDialogClose = () => {
    setViewDialogOpen(false);
    setViewingUsuario(null);
  };

  const handleFiltersChange = (newFilters: UsuarioFilters) => {
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({
      role: '',
      status: '',
      storeAccess: '',
      busqueda: '',
    });
  };

  return (
    <Box>
      {/* Header */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        mb={3}
        flexWrap="wrap"
        gap={2}
      >
        <Typography variant="h4" component="h1">
          Gestión de Usuarios
        </Typography>
        
        <Box display="flex" gap={1} flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
            color={showFilters ? 'primary' : 'inherit'}
          >
            Filtros
          </Button>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateNew}
          >
            Nuevo Usuario
          </Button>
        </Box>
      </Box>

      {/* Estadísticas */}
      <UsuariosStats usuarios={usuarios} loading={loading} />

      {/* Filtros */}
      {showFilters && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <UsuariosFilters
              filters={filters}
              stores={stores}
              onFiltersChange={handleFiltersChange}
              onClearFilters={clearFilters}
            />
          </CardContent>
        </Card>
      )}

      {/* Tabla de usuarios */}
      <Card>
        <CardContent>
          <UsuariosTable
            usuarios={filteredUsuarios}
            stores={stores}
            loading={loading}
            onEdit={handleEdit}
            onView={handleView}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDelete}
            onMenuClick={handleMenuClick}
            getStoreNames={getStoreNames}
          />
        </CardContent>
      </Card>

      {/* Menú contextual */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => menuUsuario && handleView(menuUsuario)}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ver detalles</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => menuUsuario && handleEdit(menuUsuario)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={() => menuUsuario && handleToggleStatus(menuUsuario)}>
          <ListItemIcon>
            {menuUsuario?.active ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>
            {menuUsuario?.active ? 'Desactivar' : 'Activar'}
          </ListItemText>
        </MenuItem>
        
        <MenuItem 
          onClick={() => menuUsuario && handleDelete(menuUsuario)}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Eliminar</ListItemText>
        </MenuItem>
      </Menu>

      {/* Diálogos */}
      <UsuarioDialog
        open={dialogOpen}
        usuario={selectedUsuario}
        stores={stores}
        onClose={handleDialogClose}
      />

      <UsuarioViewDialog
        open={viewDialogOpen}
        usuario={viewingUsuario}
        stores={stores}
        onClose={handleViewDialogClose}
      />

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Eliminar Usuario"
        message={`¿Estás seguro de que deseas eliminar al usuario "${usuarioToDelete?.displayName}"? Esta acción se puede revertir desactivando el usuario.`}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
        confirmText="Eliminar"
        confirmColor="error"
      />
    </Box>
  );
};

export default Usuarios;