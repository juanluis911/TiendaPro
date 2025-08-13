import React, { useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  MenuItem,
  Typography,
  Box,
  IconButton,
  Divider,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Controller, useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import dayjs from 'dayjs';

import { CompraFormData, Compra, UNIDADES } from '../../types/compras';
import { Proveedor } from '../../types';
import { compraSchema } from '../../validation/compraSchema';
import { formatCurrency } from '../../utils/formatters';

interface CompraFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CompraFormData) => Promise<void>;
  editingCompra?: Compra | null;
  proveedores: Proveedor[];
  isSubmitting: boolean;
}

const CompraForm: React.FC<CompraFormProps> = ({
  open,
  onClose,
  onSubmit,
  editingCompra,
  proveedores,
  isSubmitting,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CompraFormData>({
    resolver: yupResolver(compraSchema),
    defaultValues: {
      proveedorId: '',
      numeroFactura: '',
      fechaCompra: dayjs(),
      fechaVencimiento: dayjs().add(30, 'days'),
      productos: [{ nombre: '', cantidad: 1, unidad: 'kg', precioUnitario: 0, subtotal: 0 }],
      total: 0,
      notas: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'productos',
  });

  const productos = watch('productos');

  // Calcular subtotal automáticamente para cada producto
  useEffect(() => {
    productos.forEach((producto, index) => {
      const cantidad = Number(producto.cantidad) || 0;
      const precioUnitario = Number(producto.precioUnitario) || 0;
      const subtotal = cantidad * precioUnitario;
      
      // Solo actualizar si el subtotal ha cambiado para evitar loops infinitos
      if (producto.subtotal !== subtotal) {
        setValue(`productos.${index}.subtotal`, subtotal);
      }
    });
  }, [productos.map(p => `${p.cantidad}-${p.precioUnitario}`).join(','), setValue]);

  // Calcular el total general
  const total = useMemo(() => {
    return productos.reduce((sum, producto) => {
      const subtotal = Number(producto.subtotal) || 0;
      return sum + subtotal;
    }, 0);
  }, [productos]);

  // Actualizar el total en el formulario cuando cambie
  useEffect(() => {
    setValue('total', total);
  }, [total, setValue]);

  // Cargar datos cuando se edita una compra
  useEffect(() => {
    if (editingCompra && open) {
      reset({
        proveedorId: editingCompra.proveedorId,
        numeroFactura: editingCompra.numeroFactura,
        fechaCompra: dayjs(editingCompra.fechaCompra.toDate()),
        fechaVencimiento: dayjs(editingCompra.fechaVencimiento.toDate()),
        productos: editingCompra.productos,
        total: editingCompra.total,
        notas: editingCompra.notas || '',
      });
    } else if (!editingCompra && open) {
      reset({
        proveedorId: '',
        numeroFactura: '',
        fechaCompra: dayjs(),
        fechaVencimiento: dayjs().add(30, 'days'),
        productos: [{ nombre: '', cantidad: 1, unidad: 'kg', precioUnitario: 0, subtotal: 0 }],
        total: 0,
        notas: '',
      });
    }
  }, [editingCompra, open, reset]);

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handleFormSubmit = async (data: CompraFormData) => {
    await onSubmit(data);
  };

  const addProduct = () => {
    append({ nombre: '', cantidad: 1, unidad: 'kg', precioUnitario: 0, subtotal: 0 });
  };

  const removeProduct = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Typography variant="h5" fontWeight="bold">
          {editingCompra ? 'Editar Compra' : 'Nueva Compra'}
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent>
          <Grid container spacing={3}>
            {/* Información básica */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary">
                Información General
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="proveedorId"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Proveedor *"
                    error={!!errors.proveedorId}
                    helperText={errors.proveedorId?.message}
                    disabled={isSubmitting}
                  >
                    <MenuItem value="">
                      <em>Seleccionar proveedor</em>
                    </MenuItem>
                    {proveedores.map((proveedor) => (
                      <MenuItem key={proveedor.id} value={proveedor.id}>
                        {proveedor.nombre}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="numeroFactura"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Número de Factura *"
                    error={!!errors.numeroFactura}
                    helperText={errors.numeroFactura?.message}
                    disabled={isSubmitting}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="fechaCompra"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    label="Fecha de Compra *"
                    format="DD/MM/YYYY"
                    maxDate={dayjs()}
                    disabled={isSubmitting}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.fechaCompra,
                        helperText: errors.fechaCompra?.message,
                      },
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="fechaVencimiento"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    label="Fecha de Vencimiento *"
                    format="DD/MM/YYYY"
                    disabled={isSubmitting}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.fechaVencimiento,
                        helperText: errors.fechaVencimiento?.message,
                      },
                    }}
                  />
                )}
              />
            </Grid>

            {/* Productos */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                Productos
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            {fields.map((field, index) => (
              <Grid item xs={12} key={field.id}>
                <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={3}>
                      <Controller
                        name={`productos.${index}.nombre`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Producto *"
                            size="small"
                            error={!!errors.productos?.[index]?.nombre}
                            helperText={errors.productos?.[index]?.nombre?.message}
                            disabled={isSubmitting}
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
                            label="Cantidad *"
                            type="number"
                            size="small"
                            error={!!errors.productos?.[index]?.cantidad}
                            helperText={errors.productos?.[index]?.cantidad?.message}
                            disabled={isSubmitting}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            inputProps={{ step: "0.01", min: "0" }}
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
                            label="Unidad *"
                            size="small"
                            error={!!errors.productos?.[index]?.unidad}
                            helperText={errors.productos?.[index]?.unidad?.message}
                            disabled={isSubmitting}
                          >
                            {UNIDADES.map((unidad) => (
                              <MenuItem key={unidad.value} value={unidad.value}>
                                {unidad.label}
                              </MenuItem>
                            ))}
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
                            label="Precio Unit. *"
                            type="number"
                            size="small"
                            error={!!errors.productos?.[index]?.precioUnitario}
                            helperText={errors.productos?.[index]?.precioUnitario?.message}
                            disabled={isSubmitting}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            inputProps={{ step: "0.01", min: "0" }}
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={6} sm={2}>
                      <TextField
                        fullWidth
                        label="Subtotal"
                        value={formatCurrency(productos[index]?.subtotal || 0)}
                        size="small"
                        InputProps={{
                          readOnly: true,
                        }}
                        sx={{ 
                          '& .MuiInputBase-input': { 
                            backgroundColor: 'grey.50',
                            fontWeight: 'bold',
                            textAlign: 'right'
                          } 
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={1}>
                      {fields.length > 1 && (
                        <IconButton
                          color="error"
                          onClick={() => removeProduct(index)}
                          size="small"
                          disabled={isSubmitting}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            ))}

            {/* Botón agregar producto */}
            <Grid item xs={12}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addProduct}
                disabled={isSubmitting || fields.length >= 50}
                sx={{ mb: 2 }}
              >
                Agregar Producto
              </Button>
              {fields.length >= 50 && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  Has alcanzado el límite máximo de 50 productos por compra.
                </Alert>
              )}
            </Grid>

            {/* Total */}
            <Grid item xs={12}>
              <Box sx={{ 
                mt: 2, 
                p: 3, 
                bgcolor: 'primary.light', 
                borderRadius: 2,
                border: '2px solid',
                borderColor: 'primary.main'
              }}>
                <Grid container justifyContent="space-between" alignItems="center">
                  <Grid item>
                    <Typography variant="h5" fontWeight="bold" color="primary.main">
                      Total General:
                    </Typography>
                  </Grid>
                  <Grid item>
                    <Typography variant="h4" fontWeight="bold" color="primary.main">
                      {formatCurrency(total)}
                    </Typography>
                  </Grid>
                </Grid>
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
                    error={!!errors.notas}
                    helperText={errors.notas?.message}
                    disabled={isSubmitting}
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handleClose}
            disabled={isSubmitting}
            startIcon={<CancelIcon />}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            startIcon={<SaveIcon />}
          >
            {isSubmitting ? 'Guardando...' : editingCompra ? 'Actualizar' : 'Guardar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CompraForm;