// src/components/usuarios/UsuarioViewDialog.tsx
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  Grid,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  Store as StoreIcon,
  CalendarToday as CalendarIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as ManagerIcon,
  Work as EmpleadoIcon,
  PointOfSale as VendedorIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { UserProfile, Store } from '../../types';
import { formatDate } from '../../services/firebase';

interface UsuarioViewDialogProps {
  open: boolean;
  usuario: UserProfile | null;
  stores: Store[];
  onClose: () => void;
}

const roleIcons = {
  owner: <AdminIcon />,
  admin: <AdminIcon />,
  manager: <ManagerIcon />,
  empleado: <EmpleadoIcon />,
  vendedor: <VendedorIcon />,
};

const roleColors = {
  owner: 'error' as const,
  admin: 'warning' as const,
  manager: 'info' as const,
  empleado: 'primary' as const,
  vendedor: 'success' as const,
};

const roleLabels = {
  owner: 'Propietario',
  admin: 'Administrador',
  manager: 'Gerente',
  empleado: 'Empleado',
  vendedor: 'Vendedor',
};

const permissionLabels = {
  proveedores: 'Gestión de Proveedores',
  inventario: 'Control de Inventario',
  ventas: 'Gestión de Ventas',
  reportes: 'Reportes y Estadísticas',
  configuracion: 'Configuración del Sistema',
  multitienda: 'Gestión Multi-tienda',
};

const UsuarioViewDialog: React.FC<UsuarioViewDialogProps> = ({
  open,
  usuario,
  stores,
  onClose,
}) => {
  if (!usuario) return null;

  const getUserStores = () => {
    return stores.filter(store => usuario.storeAccess.includes(store.id));
  };

  const getActivePermissions = () => {
    return Object.entries(usuario.permissions)
      .filter(([_, value]) => value)
      .map(([key, _]) => key as keyof typeof permissionLabels);
  };

  const userStores = getUserStores();
  const activePermissions = getActivePermissions();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: roleColors[usuario.role],
              }}
            >
              {usuario.displayName.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h6">
                {usuario.displayName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Detalles del usuario
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Información personal */}
          <Grid item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 2, height: 'fit-content' }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <PersonIcon color="primary" />
                <Typography variant="h6">Información Personal</Typography>
              </Box>
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <EmailIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email"
                    secondary={usuario.email}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Nombre completo"
                    secondary={usuario.displayName}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <BusinessIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="ID de Usuario"
                    secondary={usuario.uid}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <CalendarIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Fecha de creación"
                    secondary={formatDate(usuario.createdAt)}
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>

          {/* Rol y estado */}
          <Grid item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 2, height: 'fit-content' }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <SecurityIcon color="primary" />
                <Typography variant="h6">Rol y Estado</Typography>
              </Box>
              
              <Box display="flex" flexDirection="column" gap={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Rol del usuario
                  </Typography>
                  <Chip
                    icon={roleIcons[usuario.role]}
                    label={roleLabels[usuario.role]}
                    color={roleColors[usuario.role]}
                    variant="outlined"
                    size="medium"
                  />
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Estado actual
                  </Typography>
                  <Chip
                    icon={usuario.active ? <CheckIcon /> : <CancelIcon />}
                    label={usuario.active ? 'Activo' : 'Inactivo'}
                    color={usuario.active ? 'success' : 'error'}
                    variant={usuario.active ? 'filled' : 'outlined'}
                    size="medium"
                  />
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Creado por
                  </Typography>
                  <Typography variant="body1">
                    {usuario.createdBy === usuario.uid ? 'Auto-registro' : usuario.createdBy}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Acceso a tiendas */}
          <Grid item xs={12}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <StoreIcon color="primary" />
                <Typography variant="h6">Acceso a Tiendas</Typography>
              </Box>
              
              {userStores.length > 0 ? (
                <Grid container spacing={1}>
                  {userStores.map((store) => (
                    <Grid item key={store.id}>
                      <Chip
                        icon={<StoreIcon />}
                        label={store.name}
                        variant="outlined"
                        color="primary"
                        sx={{
                          '& .MuiChip-label': {
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography color="text.secondary">
                  Este usuario no tiene acceso a ninguna tienda
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Permisos del sistema */}
          <Grid item xs={12}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <SecurityIcon color="primary" />
                <Typography variant="h6">Permisos del Sistema</Typography>
              </Box>
              
              <Grid container spacing={2}>
                {Object.entries(permissionLabels).map(([key, label]) => {
                  const hasPermission = usuario.permissions[key as keyof typeof usuario.permissions];
                  
                  return (
                    <Grid item xs={12} sm={6} md={4} key={key}>
                      <Box 
                        display="flex" 
                        alignItems="center" 
                        gap={1}
                        sx={{
                          p: 1,
                          borderRadius: 1,
                          bgcolor: hasPermission ? 'success.light' : 'grey.100',
                          color: hasPermission ? 'success.contrastText' : 'text.secondary',
                        }}
                      >
                        {hasPermission ? <CheckIcon fontSize="small" /> : <CancelIcon fontSize="small" />}
                        <Typography variant="body2" sx={{ fontWeight: hasPermission ? 600 : 400 }}>
                          {label}
                        </Typography>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
              
              <Box mt={2}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Resumen:</strong> {activePermissions.length} de {Object.keys(permissionLabels).length} permisos habilitados
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Información adicional */}
          <Grid item xs={12}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Información Adicional
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    ID de Organización
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                    {usuario.organizationId}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Número de tiendas asignadas
                  </Typography>
                  <Typography variant="body1">
                    {userStores.length} tienda{userStores.length !== 1 ? 's' : ''}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Permisos de configuración
                  </Typography>
                  <Typography variant="body1">
                    {usuario.permissions.configuracion ? 'Habilitado' : 'Deshabilitado'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Acceso multi-tienda
                  </Typography>
                  <Typography variant="body1">
                    {usuario.permissions.multitienda ? 'Habilitado' : 'Deshabilitado'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UsuarioViewDialog;