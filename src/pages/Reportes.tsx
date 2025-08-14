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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  Divider,
  Stack
} from '@mui/material';
import {
  TrendingUp,
  Assessment,
  Download,
  Print,
  Refresh,
  DateRange,
  Business,
  AttachMoney,
  ShoppingCart,
  Payment,
  Receipt,
  Warning,
  CheckCircle,
  Schedule
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

// Datos de ejemplo basados en tu sistema real
const comprasPorMesData = [
  { mes: 'Ene', compras: 85000, cantidadCompras: 45 },
  { mes: 'Feb', compras: 92000, cantidadCompras: 52 },
  { mes: 'Mar', compras: 78000, cantidadCompras: 41 },
  { mes: 'Abr', compras: 105000, cantidadCompras: 58 },
  { mes: 'May', compras: 98000, cantidadCompras: 55 },
  { mes: 'Jun', compras: 112000, cantidadCompras: 62 }
];

const topProveedoresData = [
  { proveedor: 'Frutas del Valle S.A.', montoTotal: 245000, cantidadCompras: 28, ultimaCompra: '2024-08-10', estado: 'al-dia' },
  { proveedor: 'Mercado Central Ltda.', montoTotal: 198000, cantidadCompras: 22, ultimaCompra: '2024-08-12', estado: 'al-dia' },
  { proveedor: 'Distribuidora Norte', montoTotal: 175000, cantidadCompras: 19, ultimaCompra: '2024-08-08', estado: 'pendiente' },
  { proveedor: 'Agroexport Internacional', montoTotal: 162000, cantidadCompras: 16, ultimaCompra: '2024-08-11', estado: 'al-dia' },
  { proveedor: 'Frutas Premium', montoTotal: 145000, cantidadCompras: 14, ultimaCompra: '2024-08-09', estado: 'vencido' }
];

const pagosPorMetodoData = [
  { metodo: 'Transferencia', monto: 450000, porcentaje: 65, color: '#2196f3' },
  { metodo: 'Efectivo', monto: 180000, porcentaje: 26, color: '#4caf50' },
  { metodo: 'Cheque', monto: 62000, porcentaje: 9, color: '#ff9800' }
];

const flujoComprasPagosData = [
  { fecha: '2024-08-01', compras: 15000, pagos: 12000 },
  { fecha: '2024-08-02', compras: 18000, pagos: 15000 },
  { fecha: '2024-08-03', compras: 12000, pagos: 18000 },
  { fecha: '2024-08-04', compras: 22000, pagos: 14000 },
  { fecha: '2024-08-05', compras: 16000, pagos: 20000 },
  { fecha: '2024-08-06', compras: 25000, pagos: 16000 },
  { fecha: '2024-08-07', compras: 19000, pagos: 22000 }
];

const estadoCuentasPorPagarData = [
  { categoria: 'Al día (0-30 días)', valor: 340000, porcentaje: 58, color: '#4caf50' },
  { categoria: 'Por vencer (31-60 días)', valor: 150000, porcentaje: 26, color: '#ff9800' },
  { categoria: 'Vencidas (+60 días)', valor: 95000, porcentaje: 16, color: '#f44336' }
];

const COLORS = ['#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0'];

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
};

const MetricCard = ({ title, value, subtitle, icon: Icon, trend, color = 'primary' }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" alignItems="center" mb={2}>
        <Avatar sx={{ bgcolor: `${color}.main`, mr: 2 }}>
          <Icon />
        </Avatar>
        <Box>
          <Typography color="textSecondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography variant="h5" component="h2">
            {value}
          </Typography>
          {trend && (
            <Typography variant="body2" color={trend > 0 ? 'success.main' : 'error.main'}>
              {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}% vs mes anterior
            </Typography>
          )}
          {subtitle && (
            <Typography variant="body2" color="textSecondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const ReportCard = ({ title, children, actions }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" component="h2">
          {title}
        </Typography>
        {actions && <Box>{actions}</Box>}
      </Box>
      {children}
    </CardContent>
  </Card>
);

const ReportesProveedores = () => (
  <Grid container spacing={3}>
    {/* Métricas principales */}
    <Grid item xs={12} md={3}>
      <MetricCard
        title="Total Proveedores Activos"
        value="28"
        icon={Business}
        trend={7.1}
        subtitle="3 nuevos este mes"
        color="primary"
      />
    </Grid>
    <Grid item xs={12} md={3}>
      <MetricCard
        title="Compras del Mes"
        value={formatCurrency(112000)}
        icon={ShoppingCart}
        trend={14.3}
        color="success"
      />
    </Grid>
    <Grid item xs={12} md={3}>
      <MetricCard
        title="Cuentas por Pagar"
        value={formatCurrency(585000)}
        icon={AttachMoney}
        trend={-8.2}
        subtitle="35 facturas pendientes"
        color="warning"
      />
    </Grid>
    <Grid item xs={12} md={3}>
      <MetricCard
        title="Promedio de Pago"
        value="22 días"
        icon={Schedule}
        trend={-12.5}
        subtitle="Mejorando tiempos"
        color="info"
      />
    </Grid>

    {/* Gráfico de compras mensuales */}
    <Grid item xs={12} md={8}>
      <ReportCard title="Evolución de Compras Mensuales">
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={comprasPorMesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => [
                name === 'compras' ? formatCurrency(value) : value,
                name === 'compras' ? 'Monto' : 'Cantidad'
              ]}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="compras" 
              stroke="#2196f3" 
              fill="#2196f3" 
              fillOpacity={0.3}
              name="Monto de Compras"
            />
            <Area 
              type="monotone" 
              dataKey="cantidadCompras" 
              stroke="#4caf50" 
              fill="#4caf50" 
              fillOpacity={0.3}
              name="Cantidad de Compras"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ReportCard>
    </Grid>

    {/* Estado de cuentas por pagar */}
    <Grid item xs={12} md={4}>
      <ReportCard title="Estado de Cuentas por Pagar">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={estadoCuentasPorPagarData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="valor"
              label={({ porcentaje }) => `${porcentaje}%`}
            >
              {estadoCuentasPorPagarData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [formatCurrency(value), '']} />
          </PieChart>
        </ResponsiveContainer>
        
        <Box mt={2}>
          {estadoCuentasPorPagarData.map((item, index) => (
            <Box key={index} display="flex" justifyContent="space-between" mb={1}>
              <Box display="flex" alignItems="center">
                <Box 
                  width={12} 
                  height={12} 
                  bgcolor={item.color} 
                  borderRadius="50%" 
                  mr={1}
                />
                <Typography variant="body2">{item.categoria}</Typography>
              </Box>
              <Typography variant="body2" fontWeight="bold">
                {formatCurrency(item.valor)}
              </Typography>
            </Box>
          ))}
        </Box>
      </ReportCard>
    </Grid>

    {/* Top proveedores */}
    <Grid item xs={12}>
      <ReportCard title="Top Proveedores por Volumen de Compras">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Proveedor</TableCell>
                <TableCell align="right">Monto Total</TableCell>
                <TableCell align="right">Compras</TableCell>
                <TableCell align="right">Última Compra</TableCell>
                <TableCell align="center">Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {topProveedoresData.map((proveedor, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar 
                        sx={{ 
                          mr: 2, 
                          bgcolor: COLORS[index % COLORS.length],
                          width: 32,
                          height: 32
                        }}
                      >
                        {proveedor.proveedor.charAt(0)}
                      </Avatar>
                      <Typography variant="body2">
                        {proveedor.proveedor}
                      </Typography>
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
                      icon={proveedor.estado === 'al-dia' ? <CheckCircle /> : 
                            proveedor.estado === 'pendiente' ? <Schedule /> : <Warning />}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </ReportCard>
    </Grid>
  </Grid>
);

const ReportePagos = () => (
  <Grid container spacing={3}>
    {/* Métricas de pagos */}
    <Grid item xs={12} md={3}>
      <MetricCard
        title="Pagos del Mes"
        value={formatCurrency(692000)}
        icon={Payment}
        trend={5.8}
        color="success"
      />
    </Grid>
    <Grid item xs={12} md={3}>
      <MetricCard
        title="Cantidad de Pagos"
        value="147"
        icon={Receipt}
        trend={12.3}
        color="primary"
      />
    </Grid>
    <Grid item xs={12} md={3}>
      <MetricCard
        title="Pago Promedio"
        value={formatCurrency(4707)}
        icon={AttachMoney}
        trend={-6.1}
        color="info"
      />
    </Grid>
    <Grid item xs={12} md={3}>
      <MetricCard
        title="Pagos Pendientes"
        value={formatCurrency(95000)}
        icon={Warning}
        trend={-18.7}
        subtitle="Reduciendo deuda"
        color="warning"
      />
    </Grid>

    {/* Flujo de compras vs pagos */}
    <Grid item xs={12} md={8}>
      <ReportCard title="Flujo de Compras vs Pagos (Últimos 7 días)">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={flujoComprasPagosData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fecha" />
            <YAxis />
            <Tooltip formatter={(value) => [formatCurrency(value), '']} />
            <Legend />
            <Bar dataKey="compras" fill="#f44336" name="Compras Registradas" />
            <Bar dataKey="pagos" fill="#4caf50" name="Pagos Realizados" />
          </BarChart>
        </ResponsiveContainer>
      </ReportCard>
    </Grid>

    {/* Distribución por método de pago */}
    <Grid item xs={12} md={4}>
      <ReportCard title="Métodos de Pago Utilizados">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={pagosPorMetodoData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="monto"
              label={({ porcentaje }) => `${porcentaje}%`}
            >
              {pagosPorMetodoData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [formatCurrency(value), '']} />
          </PieChart>
        </ResponsiveContainer>
        
        <Box mt={2}>
          {pagosPorMetodoData.map((metodo, index) => (
            <Box key={index} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
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
          ))}
        </Box>
      </ReportCard>
    </Grid>

    {/* Resumen de pagos pendientes */}
    <Grid item xs={12}>
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>Resumen:</strong> Tienes {formatCurrency(95000)} en pagos pendientes distribuidos en 8 proveedores. 
          El próximo vencimiento importante es el 15 de agosto por {formatCurrency(25000)}.
        </Typography>
      </Alert>
    </Grid>
  </Grid>
);

const ReportesSystem = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [dateRange, setDateRange] = useState({
    from: '2024-06-01',
    to: '2024-08-13'
  });
  const [selectedStore, setSelectedStore] = useState('all');
  const [loading, setLoading] = useState(false);
  const [exportDialog, setExportDialog] = useState(false);

  const stores = [
    { id: 'all', name: 'Todas las tiendas' },
    { id: 'store1', name: 'Tienda Centro' },
    { id: 'store2', name: 'Tienda Norte' },
    { id: 'store3', name: 'Tienda Sur' }
  ];

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  const handleExport = (format) => {
    console.log(`Exportando en formato: ${format}`);
    setExportDialog(false);
    // Aquí integrarías con tu sistema de exportación
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
            Análisis de proveedores, compras y pagos
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <IconButton onClick={handleRefresh} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : <Refresh />}
          </IconButton>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => setExportDialog(true)}
          >
            Exportar
          </Button>
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={() => window.print()}
          >
            Imprimir
          </Button>
        </Stack>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Tienda</InputLabel>
                <Select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  label="Tienda"
                >
                  {stores.map((store) => (
                    <MenuItem key={store.id} value={store.id}>
                      {store.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Fecha Desde"
                type="date"
                size="small"
                fullWidth
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Fecha Hasta"
                type="date"
                size="small"
                fullWidth
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button variant="contained" fullWidth onClick={handleRefresh}>
                Aplicar Filtros
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs de reportes */}
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
      </Card>

      {/* Dialog de exportación */}
      <Dialog open={exportDialog} onClose={() => setExportDialog(false)}>
        <DialogTitle>Exportar Reporte</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Selecciona el formato de exportación:
          </Typography>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              onClick={() => handleExport('pdf')}
              startIcon={<Download />}
              fullWidth
            >
              Exportar como PDF
            </Button>
            <Button
              variant="outlined"
              onClick={() => handleExport('excel')}
              startIcon={<Download />}
              fullWidth
            >
              Exportar como Excel
            </Button>
            <Button
              variant="outlined"
              onClick={() => handleExport('csv')}
              startIcon={<Download />}
              fullWidth
            >
              Exportar como CSV
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialog(false)}>Cancelar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReportesSystem;