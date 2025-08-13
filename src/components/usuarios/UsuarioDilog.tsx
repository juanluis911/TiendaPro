// src/components/usuarios/UsuarioDialog.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  Divider,
  Alert,
  Chip,
  Grid,
  Paper,
  FormGroup,
  Checkbox,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Security as SecurityIcon,
  Store as StoreIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useSnackbar } from 'notistack';
import { UserProfile, UserRole, Store } from '../../types';
import { userService } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';

interface UsuarioDialogProps {
  open: boolean;
  usuario?: UserProfile | null;
  stores: Store[];
  onClose: (reload?: boolean) => void;
}

interface UsuarioFormData {
  email: string;
  displayName: string;
  password?: string;
  role: UserRole;
  storeAccess: string[];
  permissions: {
    proveedores: boolean;
    inventario: boolean;
    ventas: boolean;
    reportes: boolean;
    configuracion: boolean;
    multitienda: boolean;
  };
  active: boolean;
}

const schema = yup.object({
  email: yup
    .string()
    .email('Formato de email inválido')
    .required('El email es requerido'),
  displayName: yup
    .string()
    .required('El nombre es requerido')
    .min(2, 'El nombre debe tener al menos 2 caracteres'),
  password: yup
    .string()
    .when('$isEditing', (isEditing, schema) => 
      isEditing 
        ? schema.optional()
        : schema.required('La contraseña es requerida').min(6, 'Mínimo 6 caracteres')
    ),
  role: yup
    .string()
    .oneOf(['owner', 'admin', 'manager', 'empleado', 'vendedor'])
    .required('El rol es requerido'),
  storeAccess: yup
    .array()
    .of(yup.string())
    .min(1, 'Debe seleccionar al menos una tienda'),
  permissions: yup.object({
    proveedores: yup.boolean(),
    inventario: yup.boolean(),
    ventas: yup.boolean(),
    reportes: yup.boolean(),
    configuracion: yup.boolean(),
    multitienda: yup.boolean(),
  }),
  active: yup.boolean(),
});

const roleLabels: Record<UserRole, string> = {
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

const UsuarioDialog: React.FC<UsuarioDialogProps> = ({
  open,
  usuario,
  stores,
  onClose,
}) => {
  const { userProfile } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const isEditing = Boolean(usuario);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UsuarioFormData>({
    resolver: yupResolver(schema, { context: { isEditing } }),
    defaultValues: {
      email: '',
      displayName: '',
      password: '',
      role: 'empleado',
      storeAccess: [],
      permissions: {
        proveedores: false,
        inventario: false,
        ventas: false,
        reportes: false,
        configuracion: false,
        multitienda: false,
      },
      active: true,
    },
  });

  const selectedRole = watch('role');
  const selectedStores = watch('storeAccess');

  // Cargar datos del usuario al abrir el diálogo
  useEffect(() => {
    if (open) {
      if (usuario) {
        // Editar usuario existente
        reset({
          email: usuario.email,
          displayName: usuario.displayName,
          role: usuario.role,
          storeAccess: usuario.storeAccess,
          permissions: usuario.permissions,
          active: usuario.active,
        });
      } else {
        // Nuevo usuario
        reset({
          email: '',
          displayName: '',
          password: '',
          role: 'empleado',
          storeAccess: [],
          permissions: {
            proveedores: false,
            inventario: false,
            ventas: false,
            reportes: false,
            configuracion: false,
            multitienda: false,
          },
          active: true,
        });
      }
    }
  }, [open, usuario, reset]);

  // Configurar permisos predeterminados según el rol
  useEffect(() => {
    const defaultPermissions = {
      owner: {
        proveedores: true,
        inventario: true,
        ventas: true,
        reportes: true,
        configuracion: true,
        multitienda: true,
      },
      admin: {
        proveedores: true,
        inventario: true,
        ventas: true,
        reportes: true,
        configuracion: true,
        multitienda: true,
      },
      manager: {
        proveedores: true,
        inventario: true,
        ventas: true,
        reportes: true,
        configuracion: false,
        multitienda: false,
      },
      empleado: {
        proveedores: true,
        inventario: true,
        ventas: false,
        reportes: false,
        configuracion: false,
        multitienda: false,
      },
      vendedor: {
        proveedores: false,
        inventario: true,
        ventas: true,
        reportes: false,
        configuracion: false,
        multitienda: false,
      },
    };

    if (selectedRole && !isEditing) {
      setValue('permissions', defaultPermissions[selectedRole]);
    }
  }, [selectedRole, setValue, isEditing]);

  const handleSelectAllStores = () => {
    const allStoreIds = stores.filter(store => store.active).map(store => store.id);
    setValue('storeAccess', allStoreIds);
  };

  const handleDeselectAllStores = () => {
    setValue('storeAccess', []);
  };

  const onSubmit = async (data: UsuarioFormData) => {
    if (!userProfile?.organizationId) return;

    try {
      setLoading(true);

      if (isEditing && usuario) {
        // Actualizar usuario existente
        const updateData: Partial<UserProfile> = {
          displayName: data.displayName,
          role: data.role,
          storeAccess: data.storeAccess,
          permissions: data.permissions,
          active: data.active,
        };

        await userService.update(usuario.uid, updateData);
        enqueueSnackbar('Usuario actualizado correctamente', { variant: 'success' });
      } else {
        // Crear nuevo usuario
        if (!data.password) {
          throw new Error('La contraseña es requerida para nuevos usuarios');
        }

        // Crear usuario en Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          data.email,
          data.password
        );

        // Crear perfil en Firestore
        const newUserData: Omit<UserProfile, 'uid'> = {
          email: data.email,
          displayName: data.displayName,
          organizationId: userProfile.organizationId,
          role: data.role,
          storeAccess: data.storeAccess,
          permissions: data.permissions,
          active: data.active,
          createdAt: new Date() as any,
          createdBy: userProfile.uid,
        };

        await userService.createWithId(userCredential.user.uid, newUserData);
        enqueueSnackbar('Usuario creado correctamente', { variant: 'success' });
      }

      onClose(true);
    } catch (error: any) {
      console.error('Error saving usuario:', error);
      const errorMessage = error.code === 'auth/email-already-in-use' 
        ? 'Este email ya está registrado'
        : error.message || 'Error al guardar el usuario';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const canEditRole = () => {
    if (!userProfile) return false;
    // Solo owner y admin pueden cambiar roles
    return ['owner', 'admin'].includes(userProfile.role);
  };

  const getAvailableRoles = (): UserRole[] => {
    if (!userProfile) return [];
    
    switch (userProfile.role) {
      case 'owner':
        return ['owner', 'admin', 'manager', 'empleado', 'vendedor'];
      case 'admin':
        return ['admin', 'manager', 'empleado', 'vendedor'];
      default:
        return ['empleado', 'vendedor'];
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => onClose()}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <PersonIcon />
            <Typography variant="h6">
              {isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
            </Typography>
          </Box>
          <IconButton onClick={() => onClose()}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Información básica */}
            <Grid item xs={12}>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <EmailIcon color="primary" />
                  <Typography variant="h6">Información Personal</Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="email"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Email"
                          type="email"
                          fullWidth
                          disabled={isEditing} // No permitir cambiar email en edición
                          error={!!errors.email}
                          helperText={errors.email?.message}
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="displayName"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Nombre completo"
                          fullWidth
                          error={!!errors.displayName}
                          helperText={errors.displayName?.message}
                        />
                      )}
                    />
                  </Grid>
                  
                  {!isEditing && (
                    <Grid item xs={12} md={6}>
                      <Controller
                        name="password"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Contraseña"
                            type="password"
                            fullWidth
                            error={!!errors.password}
                            helperText={errors.password?.message}
                          />
                        )}
                      />
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Grid>

            {/* Rol y configuración */}
            <Grid item xs={12}>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <SecurityIcon color="primary" />
                  <Typography variant="h6">Rol y Configuración</Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="role"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.role}>
                          <InputLabel>Rol</InputLabel>
                          <Select
                            {...field}
                            label="Rol"
                            disabled={!canEditRole()}
                          >
                            {getAvailableRoles().map((role) => (
                              <MenuItem key={role} value={role}>
                                {roleLabels[role]}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="active"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={
                            <Switch
                              checked={field.value}
                              onChange={field.onChange}
                              color="primary"
                            />
                          }
                          label="Usuario activo"
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Acceso a tiendas */}
            <Grid item xs={12}>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <StoreIcon color="primary" />
                    <Typography variant="h6">Acceso a Tiendas</Typography>
                  </Box>
                  <Box>
                    <Button size="small" onClick={handleSelectAllStores}>
                      Seleccionar todas
                    </Button>
                    <Button size="small" onClick={handleDeselectAllStores}>
                      Deseleccionar todas
                    </Button>
                  </Box>
                </Box>
                
                <Controller
                  name="storeAccess"
                  control={control}
                  render={({ field }) => (
                    <FormGroup>
                      <Grid container spacing={1}>
                        {stores.filter(store => store.active).map((store) => (
                          <Grid item xs={12} sm={6} md={4} key={store.id}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={field.value.includes(store.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      field.onChange([...field.value, store.id]);
                                    } else {
                                      field.onChange(field.value.filter(id => id !== store.id));
                                    }
                                  }}
                                />
                              }
                              label={store.name}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </FormGroup>
                  )}
                />
                {errors.storeAccess && (
                  <Typography color="error" variant="caption">
                    {errors.storeAccess.message}
                  </Typography>
                )}
              </Paper>
            </Grid>

            {/* Permisos */}
            <Grid item xs={12}>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <SecurityIcon color="primary" />
                  <Typography variant="h6">Permisos del Sistema</Typography>
                </Box>
                
                <Grid container spacing={2}>
                  {Object.entries(permissionLabels).map(([key, label]) => (
                    <Grid item xs={12} sm={6} md={4} key={key}>
                      <Controller
                        name={`permissions.${key as keyof UsuarioFormData['permissions']}`}
                        control={control}
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={field.value}
                                onChange={field.onChange}
                                disabled={key === 'multitienda' && !['owner', 'admin'].includes(selectedRole)}
                              />
                            }
                            label={label}
                          />
                        )}
                      />
                    </Grid>
                  ))}
                </Grid>
                
                <Alert severity="info" sx={{ mt: 2 }}>
                  Los permisos se configuran automáticamente según el rol seleccionado, pero pueden ser personalizados.
                </Alert>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => onClose()} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Usuario')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default UsuarioDialog;