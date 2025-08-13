// src/components/pagos/PagoForm.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Alert,
  Chip,
  Divider,
  InputAdornment
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useSnackbar } from 'notistack';
import { Timestamp } from 'firebase/firestore';

import { PagoFormData, METODOS_PAGO } from '../../types/pagos';
import { Compra } from '../../types/compras';
import { useAuth } from '../../contexts/AuthContext';
import pagoService from '../../services/pagoService';
import compraService from '../../services/compraService';

// Esquema de validación
const schema = yup.object().shape({
  compraId: yup.string().required('Debe seleccionar una compra'),
  monto: yup.number()
    .positive('El monto debe ser mayor a 0')
    .required('El monto es requerido'),
  fechaPago: yup.date()
    .max(new Date(), 'La fecha no puede ser futura')
    .required('La fecha de pago es requerida'),
  metodoPago: yup.string()
    .oneOf(['efectivo', 'transferencia', 'cheque', 'tarjeta'])
    .required('Debe seleccionar un método de pago'),
  referencia: yup.string().when('metodoPago', {
    is: (val: string) => ['transferencia', 'cheque'].includes(val),
    then: (schema) => schema.required('La referencia es requerida para este método de pago'),
    otherwise: (schema) => schema.notRequired()
  }),
  notas: yup.string().max(500, 'Las notas no pueden exceder 500 caracteres')
});

interface PagoFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  compraSeleccionada?: Compra | null;
}

const PagoForm: React.FC<PagoFormProps> = ({ 
  open, 
  onClose, 
  onSuccess,
  compraSeleccionada 
}) => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [compraInfo, setCompraInfo] = useState<Compra | null>(null);
  const [totalPagado, setTotalPagado] = useState(0);
  const [saldoPendiente, setSaldoPendiente] = useState(0);

  const { control, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<PagoFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      compraId: '',
      monto: 0,
      fechaPago: new Date(),
      metodoPago: 'efectivo',
      referencia: '',
      notas: ''
    }
  });

  const watchCompraId = watch('compraId');
  const watchMonto = watch('monto');
  const watchMetodoPago = watch('metodoPago');

  // Cargar compras con saldo pendiente
  useEffect(() => {
    const loadCompras = async () => {
      if (!user?.organizationId || !open) return;

      try {
        const comprasData = await compraService.getByOrganizationAndStore(
          user.organizationId,
          user.storeAccess?.[0]
        );

        // Filtrar solo compras con saldo pendiente
        const comprasConSaldo = [];
        for (const compra of comprasData) {
          const totalPagadoCompra = await pagoService.getTotalPaidForCompra(compra.id);
          if (totalPagadoCompra < compra.total) {
            comprasConSaldo.push(compra);
          }
        }

        setCompras(comprasConSaldo);

        // Si hay una compra preseleccionada
        if (compraSeleccionada) {
          setValue('compraId', compraSeleccionada.id);
        }
      } catch (error) {
        console.error('Error loading compras:', error);
        enqueueSnackbar('Error al cargar las compras', { variant: 'error' });
      }
    };

    loadCompras();
  }, [user, open, compraSeleccionada, setValue, enqueueSnackbar]);

  // Cargar información de la compra seleccionada
  useEffect(() => {
    const loadCompraInfo = async () => {
      if (!watchCompraId) {
        setCompraInfo(null);
        setTotalPagado(0);
        setSaldoPendiente(0);
        return;
      }

      try {
        const compra = compras.find(c => c.id === watchCompraId);
        if (compra) {
          setCompraInfo(compra);
          
          const totalPagadoCompra = await pagoService.getTotalPaidForCompra(compra.id);
          setTotalPagado(totalPagadoCompra);
          setSaldoPendiente(compra.total - totalPagadoCompra);

          // Establecer el monto por defecto al saldo pendiente
          if (saldoPendiente > 0) {
            setValue('monto', compra.total - totalPagadoCompra);
          }
        }
      } catch (error) {
        console.error('Error loading compra info:', error);
      }
    };

    loadCompraInfo();
  }, [watchCompraId, compras, setValue]);

  const onSubmit = async (data: PagoFormData) => {
    if (!user || !compraInfo) return;

    setLoading(true);
    try {
      // Validar que el monto no exceda el saldo pendiente
      if (data.monto > saldoPendiente) {
        enqueueSnackbar(`El monto no puede exceder el saldo pendiente de $${saldoPendiente.toFixed(2)}`, { 
          variant: 'error' 
        });
        return;
      }

      const pagoData = {
        organizationId: user.organizationId!,
        storeId: user.storeAccess?.[0] || '',
        compraId: data.compraId,
        proveedorId: compraInfo.proveedorId,
        proveedorNombre: compraInfo.proveedorNombre,
        compraNumeroFactura: compraInfo.numeroFactura,
        monto: data.monto,
        fechaPago: Timestamp.fromDate(data.fechaPago),
        metodoPago: data.metodoPago,
        referencia: data.referencia || '',
        notas: data.notas || '',
        registradoPor: user.uid,
        registradoPorNombre: user.displayName || user.email || '',
        createdAt: Timestamp.now()
      };

      await pagoService.createPagoAndUpdateCompra(pagoData, compraInfo.total);

      enqueueSnackbar('Pago registrado exitosamente', { variant: 'success' });
      reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating pago:', error);
      enqueueSnackbar('Error al registrar el pago', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="div">
          Registrar Pago
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box component="form" sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            {/* Selección de Compra */}
            <Grid item xs={12}>
              <Controller
                name="compraId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.compraId} disabled={loading}>
                    <InputLabel>Compra *</InputLabel>
                    <Select {...field} label="Compra *">
                      {compras.map((compra) => (
                        <MenuItem key={compra.id} value={compra.id}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <span>
                              {compra.proveedorNombre} - {compra.numeroFactura}
                            </span>
                            <span>{formatCurrency(compra.total)}</span>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.compraId && (
                      <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                        {errors.compraId.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            {/* Información de la Compra Seleccionada */}
            {compraInfo && (
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom color="primary">
                    Información de la Compra
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Proveedor
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {compraInfo.proveedorNombre}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Total Compra
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(compraInfo.total)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Total Pagado
                      </Typography>
                      <Typography variant="body2" fontWeight="medium" color="success.main">
                        {formatCurrency(totalPagado)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Saldo Pendiente
                      </Typography>
                      <Typography variant="body2" fontWeight="medium" color="error.main">
                        {formatCurrency(saldoPendiente)}
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 2 }}>
                    <Chip 
                      label={compraInfo.estado.toUpperCase()} 
                      size="small"
                      color={
                        compraInfo.estado === 'pagado' ? 'success' :
                        compraInfo.estado === 'parcial' ? 'warning' : 'error'
                      }
                    />
                  </Box>
                </Box>
              </Grid>
            )}

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* Datos del Pago */}
            <Grid item xs={12} md={6}>
              <Controller
                name="monto"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Monto del Pago *"
                    type="number"
                    inputProps={{ 
                      min: 0.01, 
                      max: saldoPendiente,
                      step: 0.01 
                    }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    error={!!errors.monto}
                    helperText={errors.monto?.message || `Máximo: ${formatCurrency(saldoPendiente)}`}
                    disabled={loading || !compraInfo}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="fechaPago"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    label="Fecha de Pago *"
                    format="DD/MM/YYYY"
                    disabled={loading}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.fechaPago,
                        helperText: errors.fechaPago?.message,
                      },
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="metodoPago"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.metodoPago} disabled={loading}>
                    <InputLabel>Método de Pago *</InputLabel>
                    <Select {...field} label="Método de Pago *">
                      {METODOS_PAGO.map((metodo) => (
                        <MenuItem key={metodo.value} value={metodo.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{metodo.icon}</span>
                            <span>{metodo.label}</span>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.metodoPago && (
                      <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                        {errors.metodoPago.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="referencia"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label={
                      ['transferencia', 'cheque'].includes(watchMetodoPago) 
                        ? 'Referencia *' 
                        : 'Referencia'
                    }
                    placeholder={
                      watchMetodoPago === 'transferencia' ? 'Número de transferencia' :
                      watchMetodoPago === 'cheque' ? 'Número de cheque' :
                      'Referencia opcional'
                    }
                    error={!!errors.referencia}
                    helperText={errors.referencia?.message}
                    disabled={loading}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="notas"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Notas"
                    multiline
                    rows={3}
                    placeholder="Observaciones adicionales sobre el pago..."
                    error={!!errors.notas}
                    helperText={errors.notas?.message}
                    disabled={loading}
                  />
                )}
              />
            </Grid>

            {/* Validación de monto */}
            {watchMonto > saldoPendiente && saldoPendiente > 0 && (
              <Grid item xs={12}>
                <Alert severity="error">
                  El monto ingresado ({formatCurrency(watchMonto)}) excede el saldo pendiente ({formatCurrency(saldoPendiente)})
                </Alert>
              </Grid>
            )}

            {/* Información de pago completo */}
            {watchMonto === saldoPendiente && saldoPendiente > 0 && (
              <Grid item xs={12}>
                <Alert severity="success">
                  Este pago completará la compra. El estado cambiará a "PAGADO"
                </Alert>
              </Grid>
            )}
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          disabled={loading || !compraInfo || watchMonto > saldoPendiente}
        >
          {loading ? 'Registrando...' : 'Registrar Pago'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PagoForm;