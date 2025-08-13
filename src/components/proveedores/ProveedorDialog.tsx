// src/components/proveedores/ProveedorDialog.tsx
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
  Chip,
  Typography,
  Alert,
  CircularProgress,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  ListItemText,
  Checkbox,
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import { proveedorService } from '../../services/firebase';
import { Proveedor } from '../../types';
import { useSnackbar } from 'notistack';

const TIPOS_PRODUCTOS = [
  'Frutas y Verduras',
  'Lácteos',
  'Carnes y Embutidos',
  'Panadería',
  'Enlatados',
  'Bebidas',
  'Limpieza',
  'Higiene Personal',
  'Abarrotes',
  'Congelados',
  'Dulces y Snacks',
  'Cereales',
  'Condimentos',
  'Productos Orgánicos',
  'Productos de Temporada',
];

const schema = yup.object({
  nombre: yup
    .string()
    .required('El nombre del proveedor es requerido')
    .min(2, 'Debe tener al menos 2 caracteres'),
  contacto: yup
    .string()
    .required('El nombre del contacto es requerido')
    .min(2, 'Debe tener al menos 2 caracteres'),
  telefono: yup
    .string()
    .required('El teléfono es requerido')
    .matches(/^[0-9+\-\s()]+$/, 'Ingrese un teléfono válido'),
  email: yup
    .string()
    .email('Ingrese un email válido')
    .optional(),
  direccion: yup
    .string()
    .required('La dirección es requerida'),
  tipoProductos: yup
    .array()
    .of(yup.string())
    .min(1, 'Debe seleccionar al menos un tipo de producto')
    .required('Los tipos de productos son requeridos'),
  storeIds: yup
    .array()
    .of(yup.string())
    .when('esGlobal', {
      is: false,
      then: (schema) => schema.min(1, 'Debe seleccionar al menos una tienda'),
      otherwise: (schema) => schema.optional(),
    }),
  esGlobal: yup.boolean(),
});

interface ProveedorFormData {
  nombre: string;
  contacto: string;
  telefono: string;
  email: string;
  direccion: string;
  tipoProductos: string[];
  esGlobal: boolean;
  storeIds: string[];
}

interface ProveedorDialogProps {
  open: boolean;
  onClose: (reload?: boolean) => void;
  proveedor?: Proveedor | null;
}

const ProveedorDialog: React.FC<ProveedorDialogProps> = ({
  open,
  onClose,
  proveedor,
}) => {
  const { userProfile, userStores } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [nuevoTipoProducto, setNuevoTipoProducto] = useState('');

  const isEditing = !!proveedor;

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProveedorFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      nombre: '',
      contacto: '',
      telefono: '',
      email: '',
      direccion: '',
      tipoProductos: [],
      esGlobal: false,
      storeIds: [],
    },
  });

  const esGlobal = watch('esGlobal');
  const tipoProductos = watch('tipoProductos');

  useEffect(() => {
    if (open && proveedor) {
      reset({
        nombre: proveedor.nombre,
        contacto: proveedor.contacto,
        telefono: proveedor.telefono,
        email: proveedor.email,
        direccion: proveedor.direccion,
        tipoProductos: proveedor.tipoProductos,
        esGlobal: proveedor.esGlobal,
        storeIds: proveedor.storeIds,
      });
    } else if (open && !proveedor) {
      reset({
        nombre: '',
        contacto: '',
        telefono: '',
        email: '',
        direccion: '',
        tipoProductos: [],
        esGlobal: userStores.length === 1, // Si solo hay una tienda, marcar como global
        storeIds: userStores.length === 1 ? [userStores[0].id] : [],
      });
    }
  }, [open, proveedor, reset, userStores]);

  const onSubmit = async (data: ProveedorFormData) => {
    if (!userProfile?.organizationId) return;

    setLoading(true);

    try {
      const proveedorData = {
        ...data,
        organizationId: userProfile.organizationId,
        storeIds: data.esGlobal ? userStores.map(store => store.id) : data.storeIds,
        activo: true,
      };

      if (isEditing && proveedor) {
        await proveedorService.update(proveedor.id, proveedorData);
        enqueueSnackbar('Proveedor actualizado correctamente', { variant: 'success' });
      } else {
        await proveedorService.create({
          ...proveedorData,
          createdBy: userProfile.uid,
        });
        enqueueSnackbar('Proveedor creado correctamente', { variant: 'success' });
      }

      onClose(true);
    } catch (error) {
      console.error('Error saving proveedor:', error);
      enqueueSnackbar('Error al guardar el proveedor', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose(false);
    }
  };

  const agregarTipoProducto = () => {
    if (nuevoTipoProducto && !tipoProductos.includes(nuevoTipoProducto)) {
      setValue('tipoProductos', [...tipoProductos, nuevoTipoProducto]);
      setNuevoTipoProducto('');
    }
  };

  const removerTipoProducto = (tipoARemover: string) => {
    setValue('tipoProductos', tipoProductos.filter(tipo => tipo !== tipoARemover));
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' },
      }}
    >
      <DialogTitle>
        {isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers sx={{ height: 'calc(90vh - 160px)', overflow: 'auto' }}>
          <Grid container spacing={3}>
            {/* Información básica */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary">
                Información Básica
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="nombre"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Nombre del Proveedor"
                    error={!!errors.nombre}
                    helperText={errors.nombre?.message}
                    disabled={loading}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="contacto"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Nombre del Contacto"
                    error={!!errors.contacto}
                    helperText={errors.contacto?.message}
                    disabled={loading}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="telefono"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Teléfono"
                    placeholder="644-123-4567"
                    error={!!errors.telefono}
                    helperText={errors.telefono?.message}
                    disabled={loading}
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
                    label="Email (opcional)"
                    type="email"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    disabled={loading}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="direccion"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Dirección"
                    multiline
                    rows={2}
                    error={!!errors.direccion}
                    helperText={errors.direccion?.message}
                    disabled={loading}
                  />
                )}
              />
            </Grid>

            {/* Tipos de productos */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary">
                Tipos de Productos
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="tipoProductos"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    freeSolo
                    options={TIPOS_PRODUCTOS}
                    value={field.value}
                    onChange={(_, newValue) => {
                      field.onChange(newValue);
                    }}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          variant="outlined"
                          label={option}
                          {...getTagProps({ index })}
                          key={option}
                          onDelete={() => removerTipoProducto(option)}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Tipos de Productos"
                        placeholder="Selecciona o escribe tipos de productos"
                        error={!!errors.tipoProductos}
                        helperText={errors.tipoProductos?.message}
                        disabled={loading}
                      />
                    )}
                    disabled={loading}
                  />
                )}
              />
            </Grid>

            {/* Configuración de tiendas */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary">
                Configuración de Tiendas
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="esGlobal"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={field.onChange}
                        disabled={loading || userStores.length === 1}
                      />
                    }
                    label="Proveedor para todas las tiendas"
                  />
                )}
              />
              {userStores.length === 1 && (
                <Typography variant="body2" color="text.secondary">
                  Solo tienes una tienda, por lo que el proveedor será global automáticamente.
                </Typography>
              )}
            </Grid>

            {!esGlobal && userStores.length > 1 && (
              <Grid item xs={12}>
                <Controller
                  name="storeIds"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.storeIds}>
                      <InputLabel>Tiendas</InputLabel>
                      <Select
                        {...field}
                        multiple
                        input={<OutlinedInput label="Tiendas" />}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {(selected as string[]).map((storeId) => {
                              const store = userStores.find(s => s.id === storeId);
                              return (
                                <Chip
                                  key={storeId}
                                  label={store?.name || storeId}
                                  size="small"
                                />
                              );
                            })}
                          </Box>
                        )}
                        disabled={loading}
                      >
                        {userStores.map((store) => (
                          <MenuItem key={store.id} value={store.id}>
                            <Checkbox checked={field.value.includes(store.id)} />
                            <ListItemText primary={store.name} />
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.storeIds && (
                        <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                          {errors.storeIds.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={handleClose}
            disabled={loading}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Proveedor')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ProveedorDialog;