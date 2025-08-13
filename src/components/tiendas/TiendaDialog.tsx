// src/components/tiendas/TiendaDialog.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Grid,
  FormControlLabel,
  Switch,
  Typography,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Chip,
} from '@mui/material';
import { 
  Business as BusinessIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  AccessTime as TimeIcon 
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import { storeService } from '../../services/firebase';
import { Store, UserProfile } from '../../types';
import { useSnackbar } from 'notistack';
import { Timestamp } from 'firebase/firestore';

const DIAS_SEMANA = [
  { value: 'monday', label: 'Lunes' },
  { value: 'tuesday', label: 'Martes' },
  { value: 'wednesday', label: 'Miércoles' },
  { value: 'thursday', label: 'Jueves' },
  { value: 'friday', label: 'Viernes' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' },
];

const MONEDAS = [
  { value: 'MXN', label: 'Peso Mexicano (MXN)' },
  { value: 'USD', label: 'Dólar Estadounidense (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
];

const ZONAS_HORARIAS = [
  { value: 'America/Mexico_City', label: 'México (Ciudad de México)' },
  { value: 'America/Tijuana', label: 'México (Tijuana)' },
  { value: 'America/Hermosillo', label: 'México (Hermosillo)' },
  { value: 'America/Merida', label: 'México (Mérida)' },
];

const schema = yup.object({
  name: yup
    .string()
    .required('El nombre de la tienda es requerido')
    .min(2, 'Debe tener al menos 2 caracteres'),
  address: yup
    .string()
    .required('La dirección es requerida')
    .min(5, 'Debe tener al menos 5 caracteres'),
  phone: yup
    .string()
    .required('El teléfono es requerido')
    .matches(/^[0-9+\-\s()]+$/, 'Ingrese un teléfono válido'),
  email: yup
    .string()
    .email('Ingrese un email válido')
    .required('El email es requerido'),
  manager: yup
    .string()
    .required('Debe seleccionar un encargado'),
  currency: yup
    .string()
    .required('Seleccione una moneda'),
  timezone: yup
    .string()
    .required('Seleccione una zona horaria'),
  businessHours: yup.object({
    open: yup
      .string()
      .required('Hora de apertura requerida')
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)'),
    close: yup
      .string()
      .required('Hora de cierre requerida')
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)')
      .test('is-after-open', 'La hora de cierre debe ser posterior a la apertura', function(value) {
        const { open } = this.parent;
        if (!open || !value) return true;
        return value > open;
      }),
    days: yup
      .array()
      .of(yup.string())
      .min(1, 'Debe seleccionar al menos un día')
      .required('Los días de operación son requeridos'),
  }),
  active: yup.boolean(),
});

interface TiendaFormData {
  name: string;
  address: string;
  phone: string;
  email: string;
  manager: string;
  currency: string;
  timezone: string;
  businessHours: {
    open: string;
    close: string;
    days: string[];
  };
  active: boolean;
}

interface TiendaDialogProps {
  open: boolean;
  onClose: (reload?: boolean) => void;
  tienda?: Store | null;
  usuarios: UserProfile[];
}

const TiendaDialog: React.FC<TiendaDialogProps> = ({
  open,
  onClose,
  tienda,
  usuarios,
}) => {
  const { userProfile } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);

  const isEditing = !!tienda;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TiendaFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      email: '',
      manager: '',
      currency: 'MXN',
      timezone: 'America/Mexico_City',
      businessHours: {
        open: '08:00',
        close: '20:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      },
      active: true,
    },
  });

  // Resetear formulario cuando cambie la tienda o se abra el diálogo
  useEffect(() => {
    if (open) {
      if (tienda) {
        reset({
          name: tienda.name,
          address: tienda.address,
          phone: tienda.phone,
          email: tienda.email,
          manager: tienda.manager,
          currency: tienda.config.currency,
          timezone: tienda.config.timezone,
          businessHours: {
            open: tienda.config.businessHours.open,
            close: tienda.config.businessHours.close,
            days: tienda.config.businessHours.days,
          },
          active: tienda.active,
        });
      } else {
        reset({
          name: '',
          address: '',
          phone: '',
          email: '',
          manager: '',
          currency: 'MXN',
          timezone: 'America/Mexico_City',
          businessHours: {
            open: '08:00',
            close: '20:00',
            days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
          },
          active: true,
        });
      }
    }
  }, [open, tienda, reset]);

  const onSubmit = async (data: TiendaFormData) => {
    if (!userProfile?.organizationId) {
      enqueueSnackbar('Error: No se encontró la organización', { variant: 'error' });
      return;
    }

    setLoading(true);

    try {
      const tiendaData = {
        organizationId: userProfile.organizationId,
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        manager: data.manager,
        active: data.active,
        config: {
          currency: data.currency,
          timezone: data.timezone,
          businessHours: {
            open: data.businessHours.open,
            close: data.businessHours.close,
            days: data.businessHours.days,
          },
        },
        createdBy: userProfile.uid,
      };

      if (isEditing && tienda) {
        await storeService.update(tienda.id, tiendaData);
        enqueueSnackbar('Tienda actualizada correctamente', { variant: 'success' });
      } else {
        await storeService.create(tiendaData);
        enqueueSnackbar('Tienda creada correctamente', { variant: 'success' });
      }

      onClose(true);
    } catch (error) {
      console.error('Error guardando tienda:', error);
      enqueueSnackbar('Error al guardar la tienda', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  // Filtrar usuarios que pueden ser managers
  const availableManagers = usuarios.filter(usuario => 
    usuario.active && 
    ['owner', 'admin', 'manager'].includes(usuario.role)
  );

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <BusinessIcon color="primary" />
          <Box>
            <Typography variant="h6" component="div">
              {isEditing ? 'Editar Tienda' : 'Nueva Tienda'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isEditing ? 'Modifica la información de la tienda' : 'Completa los datos de la nueva tienda'}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box component="form" noValidate sx={{ mt: 1 }}>
          {/* Información básica */}
          <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2, mb: 2 }}>
            Información Básica
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Nombre de la Tienda"
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    disabled={loading}
                    placeholder="Ej: Frutería Central"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Email"
                    type="email"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    disabled={loading}
                    placeholder="tienda@ejemplo.com"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Dirección"
                    multiline
                    rows={2}
                    error={!!errors.address}
                    helperText={errors.address?.message}
                    disabled={loading}
                    placeholder="Calle, número, colonia, ciudad..."
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Teléfono"
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
                    disabled={loading}
                    placeholder="(555) 123-4567"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="manager"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.manager}>
                    <InputLabel>Encargado</InputLabel>
                    <Select
                      {...field}
                      label="Encargado"
                      disabled={loading}
                    >
                      {availableManagers.map((usuario) => (
                        <MenuItem key={usuario.uid} value={usuario.uid}>
                          <Box>
                            <Typography variant="body2">
                              {usuario.displayName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {usuario.email} • {usuario.role}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.manager && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                        {errors.manager.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Configuración */}
          <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 2 }}>
            Configuración
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.currency}>
                    <InputLabel>Moneda</InputLabel>
                    <Select
                      {...field}
                      label="Moneda"
                      disabled={loading}
                    >
                      {MONEDAS.map((moneda) => (
                        <MenuItem key={moneda.value} value={moneda.value}>
                          {moneda.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.currency && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                        {errors.currency.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="timezone"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.timezone}>
                    <InputLabel>Zona Horaria</InputLabel>
                    <Select
                      {...field}
                      label="Zona Horaria"
                      disabled={loading}
                    >
                      {ZONAS_HORARIAS.map((zona) => (
                        <MenuItem key={zona.value} value={zona.value}>
                          {zona.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.timezone && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                        {errors.timezone.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Horarios de operación */}
          <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 2 }}>
            <TimeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Horarios de Operación
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Controller
                name="businessHours.open"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Hora de Apertura"
                    type="time"
                    error={!!errors.businessHours?.open}
                    helperText={errors.businessHours?.open?.message}
                    disabled={loading}
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="businessHours.close"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Hora de Cierre"
                    type="time"
                    error={!!errors.businessHours?.close}
                    helperText={errors.businessHours?.close?.message}
                    disabled={loading}
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="businessHours.days"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.businessHours?.days}>
                    <InputLabel>Días de Operación</InputLabel>
                    <Select
                      {...field}
                      multiple
                      label="Días de Operación"
                      disabled={loading}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(selected as string[]).map((value) => {
                            const dia = DIAS_SEMANA.find(d => d.value === value);
                            return (
                              <Chip key={value} label={dia?.label} size="small" />
                            );
                          })}
                        </Box>
                      )}
                    >
                      {DIAS_SEMANA.map((dia) => (
                        <MenuItem key={dia.value} value={dia.value}>
                          {dia.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.businessHours?.days && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                        {errors.businessHours.days.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Estado */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Controller
                name="active"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        {...field}
                        checked={field.value}
                        disabled={loading}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2">
                          Tienda Activa
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Las tiendas inactivas no aparecerán en los filtros principales
                        </Typography>
                      </Box>
                    }
                  />
                )}
              />
            </Grid>
          </Grid>

          {/* Advertencia para usuarios sin permisos */}
          {availableManagers.length === 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              No hay usuarios disponibles para asignar como encargados. 
              Necesitas crear usuarios con rol de manager, admin u owner.
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          startIcon={<CloseIcon />}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
        >
          {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Tienda'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TiendaDialog;