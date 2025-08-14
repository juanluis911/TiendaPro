// src/pages/Reportes.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  Alert,
  CircularProgress,
  Tab,
  Tabs,
  Stack,
  Autocomplete,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Download,
  Print,
  Refresh,
  Business,
  AttachMoney,
  ShoppingCart,
  Payment,
  Warning,
  CheckCircle,
  Schedule,
  DateRange,
  FilterList,
  CompareArrows
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

import { useAuth } from '../contexts/AuthContext';
import { compraService, pagoService, proveedorService, formatCurrency } from '../services/firebase';
import { Compra } from '../types/compras';
import { Pago, Proveedor } from '../types';

interface FilterOptions {
  tienda: string;
  fechaInicio: string;
  fechaFin: string;
  proveedor: string;
  estado: string;
  periodo: 'semana' | 'mes' | 'trimestre' | 'personalizado';
}

interface MetricaComparativa {
  valor: number;
  valorAnterior: number;
  diferencia: number;
  porcentajeCambio: number;
  tendencia: 'up' | 'down' | 'neutral';
}

interface ReportData {
  // Métricas actuales
  totalProveedores: MetricaComparativa;
  comprasDelPeriodo: MetricaComparativa;
  cuentasPorPagar: MetricaComparativa;
  pagosDelPeriodo: MetricaComparativa;
  
  // Datos detallados
  topProveedores: Array<{
    id: string;
    nombre: string;
    montoTotal: number;
    cantidadCompras: number;
    ultimaCompra: string;
    estado: 'al-dia' | 'pendiente' | 'vencido';
    cambioVsMesAnterior: number;
  }>;
  
  pagosPorMetodo: Array<{
    metodo: string;
    monto: number;
    porcentaje: number;
    color: string;
  }>;
  
  comprasPorDia: Array<{
    fecha: string;
    compras: number;
    pagos: number;
  }>;
  
  resumenEstados: {
    alDia: number;
    pendientes: number;
    vencidas: number;
  };
}

const Reportes: React.FC = () => {
  const { userProfile, userStores, hasPermission } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  
  // Filtros
  const [filtros, setFiltros] = useState<FilterOptions>({
    tienda: 'all',
    fechaInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    fechaFin: new Date().toISOString().split('T')[0],
    proveedor: '',
    estado: '',
    periodo: 'mes'
  });

  // Verificar permisos
  if (!hasPermission('reportes')) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          No tienes permisos para acceder a los reportes.
        </Alert>
      </Box>
    );
  }

  useEffect(() => {
    loadProveedores();
  }, [userProfile?.organizationId]);

  useEffect(() => {
    if (proveedores.length > 0) {
      loadReportData();
    }
  }, [filtros, proveedores]);

  const loadProveedores = async () => {
    if (!userProfile?.organizationId) return;
    
    try {
      const data = await proveedorService.getByOrganizationAndStore(userProfile.organizationId);
      setProveedores(data);
    } catch (error) {
      console.error('Error loading proveedores:', error);
    }
  };

  const handlePeriodoChange = (periodo: 'semana' | 'mes' | 'trimestre' | 'personalizado') => {
    const hoy = new Date();
    let fechaInicio: Date;
    
    // Para personalizado, solo cambiar el modo sin tocar las fechas
    if (periodo === 'personalizado') {
      setFiltros(prev => ({
        ...prev,
        periodo: 'personalizado'
      }));
      return;
    }
    
    // Para los otros períodos, calcular fechas automáticamente
    switch (periodo) {
      case 'semana':
        fechaInicio = new Date(hoy.getTime() - (7 * 24 * 60 * 60 * 1000));
        break;
      case 'mes':
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        break;
      case 'trimestre':
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 3, 1);
        break;
      default:
        return;
    }
    
    setFiltros(prev => ({
      ...prev,
      periodo,
      fechaInicio: fechaInicio.toISOString().split('T')[0],
      fechaFin: hoy.toISOString().split('T')[0]
    }));
  };

  const calcularMetricaComparativa = (
    actual: number, 
    anterior: number
  ): MetricaComparativa => {
    const diferencia = actual - anterior;
    const porcentajeCambio = anterior > 0 ? ((diferencia / anterior) * 100) : 0;
    
    return {
      valor: actual,
      valorAnterior: anterior,
      diferencia,
      porcentajeCambio,
      tendencia: diferencia > 0 ? 'up' : diferencia < 0 ? 'down' : 'neutral'
    };
  };

  const loadReportData = async () => {
    if (!userProfile?.organizationId) return;

    try {
      setLoading(true);
      setError(null);
      
      const storeId = filtros.tienda === 'all' ? undefined : filtros.tienda;
      const fechaInicio = new Date(filtros.fechaInicio);
      const fechaFin = new Date(filtros.fechaFin);
      
      // Calcular período anterior para comparación
      const diasPeriodo = Math.ceil((fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24));
      const fechaInicioAnterior = new Date(fechaInicio.getTime() - (diasPeriodo * 24 * 60 * 60 * 1000));
      const fechaFinAnterior = new Date(fechaInicio.getTime() - (24 * 60 * 60 * 1000));
      
      // Obtener datos actuales y anteriores
      const [comprasActuales, pagosActuales, comprasAnteriores, pagosAnteriores] = await Promise.all([
        compraService.getByOrganizationAndStore(userProfile.organizationId, storeId),
        pagoService.getByOrganizationAndStore(userProfile.organizationId, storeId),
        compraService.getByOrganizationAndStore(userProfile.organizationId, storeId),
        pagoService.getByOrganizationAndStore(userProfile.organizationId, storeId)
      ]);

      // Filtrar por fechas y proveedor
      const filtrarDatos = (datos: any[], fechaField: string, inicio: Date, fin: Date) => {
        return datos.filter(item => {
          const fecha = item[fechaField].toDate();
          const dentroRango = fecha >= inicio && fecha <= fin;
          const proveedorMatch = !filtros.proveedor || item.proveedorId === filtros.proveedor;
          const estadoMatch = !filtros.estado || item.estado === filtros.estado;
          return dentroRango && proveedorMatch && estadoMatch;
        });
      };

      const comprasPeriodoActual = filtrarDatos(comprasActuales, 'fechaCompra', fechaInicio, fechaFin);
      const pagosPeriodoActual = filtrarDatos(pagosActuales, 'fechaPago', fechaInicio, fechaFin);
      const comprasPeriodoAnterior = filtrarDatos(comprasAnteriores, 'fechaCompra', fechaInicioAnterior, fechaFinAnterior);
      const pagosPeriodoAnterior = filtrarDatos(pagosAnteriores, 'fechaPago', fechaInicioAnterior, fechaFinAnterior);

      // Calcular métricas comparativas
      const montoComprasActual = comprasPeriodoActual.reduce((sum, c) => sum + c.total, 0);
      const montoComprasAnterior = comprasPeriodoAnterior.reduce((sum, c) => sum + c.total, 0);
      
      const montoPagosActual = pagosPeriodoActual.reduce((sum, p) => sum + p.monto, 0);
      const montoPagosAnterior = pagosPeriodoAnterior.reduce((sum, p) => sum + p.monto, 0);

      // Cuentas por pagar actuales
      const pagosPorCompra = new Map<string, number>();
      pagosActuales.forEach(pago => {
        const total = pagosPorCompra.get(pago.compraId) || 0;
        pagosPorCompra.set(pago.compraId, total + pago.monto);
      });

      let cuentasPorPagarActual = 0;
      comprasActuales.forEach(compra => {
        const totalPagado = pagosPorCompra.get(compra.id) || 0;
        const pendiente = compra.total - totalPagado;
        if (pendiente > 0) {
          cuentasPorPagarActual += pendiente;
        }
      });

      // Simular cuentas por pagar anteriores (simplificado)
      const cuentasPorPagarAnterior = cuentasPorPagarActual * 1.1; // Estimación

      // Proveedores únicos
      const proveedoresActivos = new Set(comprasPeriodoActual.map(c => c.proveedorId));
      const proveedoresActivosAnterior = new Set(comprasPeriodoAnterior.map(c => c.proveedorId));

      // Top proveedores con comparación
      const proveedorStats = new Map<string, any>();
      
      proveedores.forEach(proveedor => {
        const comprasProveedor = comprasPeriodoActual.filter(c => c.proveedorId === proveedor.id);
        const comprasProveedorAnterior = comprasPeriodoAnterior.filter(c => c.proveedorId === proveedor.id);
        
        if (comprasProveedor.length > 0) {
          const montoTotal = comprasProveedor.reduce((sum, c) => sum + c.total, 0);
          const montoAnterior = comprasProveedorAnterior.reduce((sum, c) => sum + c.total, 0);
          const cambio = montoAnterior > 0 ? ((montoTotal - montoAnterior) / montoAnterior) * 100 : 0;
          
          // Determinar estado del proveedor
          const comprasVencidas = comprasProveedor.filter(c => 
            c.estado === 'vencido' || (c.estado === 'pendiente' && c.fechaVencimiento.toDate() < new Date())
          );
          
          let estado: 'al-dia' | 'pendiente' | 'vencido' = 'al-dia';
          if (comprasVencidas.length > 0) {
            estado = 'vencido';
          } else if (comprasProveedor.some(c => c.estado === 'pendiente')) {
            estado = 'pendiente';
          }
          
          proveedorStats.set(proveedor.id, {
            id: proveedor.id,
            nombre: proveedor.nombre,
            montoTotal,
            cantidadCompras: comprasProveedor.length,
            ultimaCompra: new Date(Math.max(...comprasProveedor.map(c => c.fechaCompra.toDate().getTime())))
              .toLocaleDateString('es-MX'),
            estado,
            cambioVsMesAnterior: cambio
          });
        }
      });

      const topProveedores = Array.from(proveedorStats.values())
        .sort((a, b) => b.montoTotal - a.montoTotal)
        .slice(0, 10);

      // Pagos por método
      const metodos = new Map<string, number>();
      pagosPeriodoActual.forEach(pago => {
        const total = metodos.get(pago.metodoPago) || 0;
        metodos.set(pago.metodoPago, total + pago.monto);
      });

      const totalPagos = Array.from(metodos.values()).reduce((sum, val) => sum + val, 0);
      const coloresMetodos = {
        transferencia: '#2196f3',
        efectivo: '#4caf50',
        cheque: '#ff9800',
        tarjeta: '#9c27b0'
      };

      const pagosPorMetodo = Array.from(metodos.entries()).map(([metodo, monto]) => ({
        metodo: metodo.charAt(0).toUpperCase() + metodo.slice(1),
        monto,
        porcentaje: Math.round((monto / totalPagos) * 100) || 0,
        color: coloresMetodos[metodo as keyof typeof coloresMetodos] || '#666666'
      }));

      // Compras por día (últimos 7 días)
      const comprasPorDia = [];
      for (let i = 6; i >= 0; i--) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i);
        const fechaStr = fecha.toISOString().split('T')[0];
        
        const comprasDia = comprasPeriodoActual
          .filter(c => c.fechaCompra.toDate().toISOString().split('T')[0] === fechaStr)
          .reduce((sum, c) => sum + c.total, 0);
          
        const pagosDia = pagosPeriodoActual
          .filter(p => p.fechaPago.toDate().toISOString().split('T')[0] === fechaStr)
          .reduce((sum, p) => sum + p.monto, 0);
        
        comprasPorDia.push({
          fecha: fecha.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }),
          compras: comprasDia,
          pagos: pagosDia
        });
      }

      // Resumen de estados
      const alDia = comprasPeriodoActual.filter(c => c.estado === 'pagado').length;
      const pendientes = comprasPeriodoActual.filter(c => c.estado === 'pendiente').length;
      const vencidas = comprasPeriodoActual.filter(c => c.estado === 'vencido').length;

      setReportData({
        totalProveedores: calcularMetricaComparativa(proveedoresActivos.size, proveedoresActivosAnterior.size),
        comprasDelPeriodo: calcularMetricaComparativa(montoComprasActual, montoComprasAnterior),
        cuentasPorPagar: calcularMetricaComparativa(cuentasPorPagarActual, cuentasPorPagarAnterior),
        pagosDelPeriodo: calcularMetricaComparativa(montoPagosActual, montoPagosAnterior),
        topProveedores,
        pagosPorMetodo,
        comprasPorDia,
        resumenEstados: { alDia, pendientes, vencidas }
      });

    } catch (error) {
      console.error('Error loading report data:', error);
      setError('Error al cargar los datos del reporte.');
      enqueueSnackbar('Error al cargar los reportes', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const MetricCardComparativa = ({ 
    title, 
    metrica, 
    icon: Icon, 
    color = 'primary',
    format = 'currency'
  }: {
    title: string;
    metrica: MetricaComparativa;
    icon: any;
    color?: string;
    format?: 'currency' | 'number';
  }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar sx={{ bgcolor: `${color}.main`, mr: 2 }}>
            <Icon />
          </Avatar>
          <Box flex={1}>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h5" component="h2">
              {format === 'currency' ? formatCurrency(metrica.valor) : metrica.valor.toLocaleString()}
            </Typography>
            <Box display="flex" alignItems="center" mt={1}>
              {metrica.tendencia === 'up' ? (
                <TrendingUp fontSize="small" color="success" />
              ) : metrica.tendencia === 'down' ? (
                <TrendingDown fontSize="small" color="error" />
              ) : null}
              <Typography 
                variant="body2" 
                color={metrica.tendencia === 'up' ? 'success.main' : 
                       metrica.tendencia === 'down' ? 'error.main' : 'text.secondary'}
                sx={{ ml: 0.5 }}
              >
                {metrica.porcentajeCambio >= 0 ? '+' : ''}{metrica.porcentajeCambio.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                vs período anterior
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const ReportesProveedores = () => {
    if (!reportData) return <CircularProgress />;

    return (
      <Grid container spacing={3}>
        {/* Métricas principales con comparación */}
        <Grid item xs={12} md={3}>
          <MetricCardComparativa
            title="Proveedores Activos"
            metrica={reportData.totalProveedores}
            icon={Business}
            color="primary"
            format="number"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCardComparativa
            title="Compras del Período"
            metrica={reportData.comprasDelPeriodo}
            icon={ShoppingCart}
            color="success"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCardComparativa
            title="Cuentas por Pagar"
            metrica={reportData.cuentasPorPagar}
            icon={AttachMoney}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Estados de Compras
              </Typography>
              <Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Al día</Typography>
                  <Chip label={reportData.resumenEstados.alDia} color="success" size="small" />
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Pendientes</Typography>
                  <Chip label={reportData.resumenEstados.pendientes} color="warning" size="small" />
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Vencidas</Typography>
                  <Chip label={reportData.resumenEstados.vencidas} color="error" size="small" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Top proveedores con comparación */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Proveedores por Volumen
              </Typography>
              {reportData.topProveedores.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Proveedor</TableCell>
                        <TableCell align="right">Monto Total</TableCell>
                        <TableCell align="right">Compras</TableCell>
                        <TableCell align="right">Última Compra</TableCell>
                        <TableCell align="center">Estado</TableCell>
                        <TableCell align="right">Cambio %</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportData.topProveedores.map((proveedor, index) => (
                        <TableRow key={proveedor.id}>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                                {proveedor.nombre.charAt(0)}
                              </Avatar>
                              {proveedor.nombre}
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold">
                              {formatCurrency(proveedor.montoTotal)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{proveedor.cantidadCompras}</TableCell>
                          <TableCell align="right">{proveedor.ultimaCompra}</TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={proveedor.estado === 'al-dia' ? 'Al día' : 
                                     proveedor.estado === 'pendiente' ? 'Pendiente' : 'Vencido'}
                              color={proveedor.estado === 'al-dia' ? 'success' : 
                                     proveedor.estado === 'pendiente' ? 'warning' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Box display="flex" alignItems="center" justifyContent="flex-end">
                              {proveedor.cambioVsMesAnterior > 0 ? (
                                <TrendingUp fontSize="small" color="success" />
                              ) : proveedor.cambioVsMesAnterior < 0 ? (
                                <TrendingDown fontSize="small" color="error" />
                              ) : null}
                              <Typography 
                                variant="body2"
                                color={proveedor.cambioVsMesAnterior > 0 ? 'success.main' : 
                                       proveedor.cambioVsMesAnterior < 0 ? 'error.main' : 'text.secondary'}
                                sx={{ ml: 0.5 }}
                              >
                                {proveedor.cambioVsMesAnterior >= 0 ? '+' : ''}{proveedor.cambioVsMesAnterior.toFixed(1)}%
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">
                  No hay datos de proveedores para el período seleccionado.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const ReportePagos = () => {
    if (!reportData) return <CircularProgress />;

    return (
      <Grid container spacing={3}>
        {/* Métricas de pagos */}
        <Grid item xs={12} md={6}>
          <MetricCardComparativa
            title="Pagos del Período"
            metrica={reportData.pagosDelPeriodo}
            icon={Payment}
            color="success"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <MetricCardComparativa
            title="Saldo Pendiente"
            metrica={reportData.cuentasPorPagar}
            icon={Warning}
            color="warning"
          />
        </Grid>

        {/* Flujo diario */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Flujo Diario (Últimos 7 días)
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell align="right">Compras</TableCell>
                      <TableCell align="right">Pagos</TableCell>
                      <TableCell align="right">Balance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.comprasPorDia.map((dia, index) => {
                      const balance = dia.pagos - dia.compras;
                      return (
                        <TableRow key={index}>
                          <TableCell>{dia.fecha}</TableCell>
                          <TableCell align="right">{formatCurrency(dia.compras)}</TableCell>
                          <TableCell align="right">{formatCurrency(dia.pagos)}</TableCell>
                          <TableCell align="right">
                            <Typography 
                              color={balance >= 0 ? 'success.main' : 'error.main'}
                              fontWeight="bold"
                            >
                              {formatCurrency(balance)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Métodos de pago */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Métodos de Pago
              </Typography>
              {reportData.pagosPorMetodo.length > 0 ? (
                <Grid container spacing={1}>
                  {reportData.pagosPorMetodo.map((metodo, index) => (
                    <Grid item xs={12} key={index}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Box display="flex" alignItems="center">
                          <Box 
                            width={12} 
                            height={12} 
                            bgcolor={metodo.color} 
                            borderRadius="50%" 
                            mr={1}
                          />
                          <Typography variant="body2">{metodo.metodo}</Typography>
                        </Box>
                        <Box textAlign="right">
                          <Typography variant="body2" fontWeight="bold">
                            {formatCurrency(metodo.monto)}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {metodo.porcentaje}%
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Alert severity="info">
                  No hay datos de pagos disponibles.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Reportes del Negocio
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Análisis comparativo de proveedores, compras y pagos
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <IconButton onClick={loadReportData} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : <Refresh />}
          </IconButton>
          <Button
            variant="outlined"
            startIcon={<Download />}
            disabled={!reportData}
          >
            Exportar
          </Button>
        </Stack>
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filtros Avanzados */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom startIcon={<FilterList />}>
            Filtros de Análisis
          </Typography>
          
          {/* Períodos rápidos */}
          <Box mb={3}>
            <Typography variant="subtitle2" gutterBottom>
              Período de análisis:
            </Typography>
            <ToggleButtonGroup
              value={filtros.periodo}
              exclusive
              onChange={(e, value) => value && handlePeriodoChange(value)}
              size="small"
            >
              <ToggleButton value="semana">Última Semana</ToggleButton>
              <ToggleButton value="mes">Este Mes</ToggleButton>
              <ToggleButton value="trimestre">Último Trimestre</ToggleButton>
              <ToggleButton value="personalizado">Personalizado</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Grid container spacing={2} alignItems="center">
            {/* Selector de tienda */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Tienda</InputLabel>
                <Select
                  value={filtros.tienda}
                  onChange={(e) => setFiltros(prev => ({ ...prev, tienda: e.target.value }))}
                  label="Tienda"
                  disabled={loading}
                >
                  <MenuItem value="all">Todas las tiendas</MenuItem>
                  {userStores.map((store) => (
                    <MenuItem key={store.id} value={store.id}>
                      {store.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Fechas personalizadas */}
            <Grid item xs={12} md={2}>
              <TextField
                label="Fecha Inicio"
                type="date"
                size="small"
                fullWidth
                value={filtros.fechaInicio}
                onChange={(e) => setFiltros(prev => ({ ...prev, fechaInicio: e.target.value, periodo: 'personalizado' }))}
                InputLabelProps={{ shrink: true }}
                disabled={loading}
                helperText={filtros.periodo !== 'personalizado' ? 'Automático' : ''}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                label="Fecha Fin"
                type="date"
                size="small"
                fullWidth
                value={filtros.fechaFin}
                onChange={(e) => setFiltros(prev => ({ ...prev, fechaFin: e.target.value, periodo: 'personalizado' }))}
                InputLabelProps={{ shrink: true }}
                disabled={loading}
                helperText={filtros.periodo !== 'personalizado' ? 'Automático' : ''}
              />
            </Grid>

            {/* Filtro por proveedor */}
            <Grid item xs={12} md={3}>
              <Autocomplete
                size="small"
                options={proveedores}
                getOptionLabel={(option) => option.nombre}
                value={proveedores.find(p => p.id === filtros.proveedor) || null}
                onChange={(e, value) => setFiltros(prev => ({ ...prev, proveedor: value?.id || '' }))}
                renderInput={(params) => (
                  <TextField {...params} label="Proveedor" placeholder="Todos los proveedores" />
                )}
                disabled={loading}
              />
            </Grid>

            {/* Filtro por estado */}
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filtros.estado}
                  onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
                  label="Estado"
                  disabled={loading}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="pendiente">Pendiente</MenuItem>
                  <MenuItem value="pagado">Pagado</MenuItem>
                  <MenuItem value="vencido">Vencido</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Botón de aplicar */}
          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button 
              variant="contained" 
              onClick={loadReportData}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : <CompareArrows />}
            >
              {loading ? 'Analizando...' : 'Aplicar Filtros y Comparar'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Contenido */}
      {loading && !reportData ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <CircularProgress size={60} />
          <Typography sx={{ ml: 2 }}>Cargando análisis comparativo...</Typography>
        </Box>
      ) : reportData ? (
        <Card>
          <Tabs
            value={selectedTab}
            onChange={(e, newValue) => setSelectedTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab 
              label="Proveedores y Compras" 
              icon={<Business />} 
              iconPosition="start"
            />
            <Tab 
              label="Pagos y Finanzas" 
              icon={<Payment />} 
              iconPosition="start"
            />
          </Tabs>
          
          <CardContent sx={{ mt: 2 }}>
            {selectedTab === 0 && <ReportesProveedores />}
            {selectedTab === 1 && <ReportePagos />}
          </CardContent>

          {/* Información del período */}
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary">
              Período analizado: {new Date(filtros.fechaInicio).toLocaleDateString('es-MX')} - {new Date(filtros.fechaFin).toLocaleDateString('es-MX')}
              {filtros.tienda !== 'all' && ` • Tienda: ${userStores.find(s => s.id === filtros.tienda)?.name}`}
              {filtros.proveedor && ` • Proveedor: ${proveedores.find(p => p.id === filtros.proveedor)?.nombre}`}
              {filtros.estado && ` • Estado: ${filtros.estado}`}
            </Typography>
          </Box>
        </Card>
      ) : (
        <Alert severity="info">
          <Typography variant="body1" gutterBottom>
            Configura los filtros y haz clic en "Aplicar Filtros y Comparar" para generar el análisis comparativo.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Los reportes incluyen comparaciones automáticas con el período anterior para identificar tendencias.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default Reportes;