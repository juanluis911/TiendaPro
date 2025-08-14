import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  ShoppingCart, 
  Package, 
  Calendar,
  Download,
  Printer,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

// Datos de ejemplo para los reportes
const ventasData = [
  { mes: 'Ene', ventas: 45000, meta: 40000 },
  { mes: 'Feb', ventas: 52000, meta: 45000 },
  { mes: 'Mar', ventas: 48000, meta: 50000 },
  { mes: 'Abr', ventas: 61000, meta: 55000 },
  { mes: 'May', ventas: 58000, meta: 60000 },
  { mes: 'Jun', ventas: 67000, meta: 65000 }
];

const comprasData = [
  { proveedor: 'Frutas del Valle', montoTotal: 125000, cantidadCompras: 15, ultimaCompra: '2024-08-10', estado: 'activo' },
  { proveedor: 'Mercado Central', montoTotal: 98000, cantidadCompras: 12, ultimaCompra: '2024-08-12', estado: 'activo' },
  { proveedor: 'Distribuidora Norte', montoTotal: 87500, cantidadCompras: 10, ultimaCompra: '2024-08-08', estado: 'pendiente' },
  { proveedor: 'Agroexport', montoTotal: 72000, cantidadCompras: 8, ultimaCompra: '2024-08-11', estado: 'activo' },
  { proveedor: 'Frutas Premium', montoTotal: 65000, cantidadCompras: 7, ultimaCompra: '2024-08-09', estado: 'vencido' }
];

const productosTopData = [
  { producto: 'Manzanas', cantidad: 450, ingresos: 22500 },
  { producto: 'Bananas', cantidad: 380, ingresos: 19000 },
  { producto: 'Naranjas', cantidad: 320, ingresos: 16000 },
  { producto: 'Peras', cantidad: 280, ingresos: 14000 },
  { producto: 'Uvas', cantidad: 220, ingresos: 17600 }
];

const flujoEfectivoData = [
  { dia: 'Lun', ingresos: 8500, gastos: 3200 },
  { dia: 'Mar', ingresos: 9200, gastos: 2800 },
  { dia: 'Mié', ingresos: 7800, gastos: 4100 },
  { dia: 'Jue', ingresos: 10500, gastos: 3500 },
  { dia: 'Vie', ingresos: 12000, gastos: 2900 },
  { dia: 'Sáb', ingresos: 15200, gastos: 4200 },
  { dia: 'Dom', ingresos: 11800, gastos: 2100 }
];

const estadoPagosData = [
  { name: 'Al día', value: 60, color: '#10b981' },
  { name: 'Pendiente', value: 25, color: '#f59e0b' },
  { name: 'Vencido', value: 15, color: '#ef4444' }
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// Componente para métricas principales
const MetricCard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500'
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <p className={`text-sm mt-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}% vs mes anterior
            </p>
          )}
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
};

// Componente para tarjetas de reporte
const ReportCard = ({ title, children, actions }) => (
  <div className="bg-white rounded-lg shadow-sm border">
    <div className="p-6 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {actions && <div className="flex space-x-2">{actions}</div>}
      </div>
    </div>
    <div className="p-6">
      {children}
    </div>
  </div>
);

const ReportesSystem = () => {
  const [activeTab, setActiveTab] = useState('ventas');
  const [dateRange, setDateRange] = useState({
    from: '2024-06-01',
    to: '2024-08-13'
  });
  const [selectedStore, setSelectedStore] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

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
    setShowExportModal(false);
    alert(`Exportando reporte en formato ${format.toUpperCase()}...`);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const ReporteVentas = () => (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Ventas del Mes"
          value={formatCurrency(67000)}
          icon={DollarSign}
          trend={12.5}
          color="green"
        />
        <MetricCard
          title="Transacciones"
          value="1,247"
          icon={ShoppingCart}
          trend={8.3}
          color="blue"
        />
        <MetricCard
          title="Ticket Promedio"
          value={formatCurrency(53.75)}
          icon={TrendingUp}
          trend={-2.1}
          color="yellow"
        />
        <MetricCard
          title="Productos Vendidos"
          value="2,890"
          icon={Package}
          trend={15.2}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de ventas vs meta */}
        <div className="lg:col-span-2">
          <ReportCard title="Ventas vs Meta Mensual">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={ventasData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value) => [formatCurrency(value), '']} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="ventas" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  name="Ventas Reales"
                />
                <Line 
                  type="monotone" 
                  dataKey="meta" 
                  stroke="#10b981" 
                  strokeDasharray="5 5"
                  name="Meta"
                />
              </LineChart>
            </ResponsiveContainer>
          </ReportCard>
        </div>

        {/* Top productos */}
        <div>
          <ReportCard title="Productos Más Vendidos">
            <div className="space-y-4">
              {productosTopData.map((producto, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{producto.producto}</p>
                    <p className="text-sm text-gray-500">{producto.cantidad} unidades</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(producto.ingresos)}</p>
                  </div>
                </div>
              ))}
            </div>
          </ReportCard>
        </div>
      </div>

      {/* Flujo de efectivo semanal */}
      <ReportCard title="Flujo de Efectivo Semanal">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={flujoEfectivoData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dia" />
            <YAxis />
            <Tooltip formatter={(value) => [formatCurrency(value), '']} />
            <Legend />
            <Bar dataKey="ingresos" fill="#10b981" name="Ingresos" />
            <Bar dataKey="gastos" fill="#ef4444" name="Gastos" />
          </BarChart>
        </ResponsiveContainer>
      </ReportCard>
    </div>
  );

  const ReporteProveedores = () => (
    <div className="space-y-6">
      {/* Métricas de proveedores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Proveedores"
          value="25"
          icon={Users}
          trend={4.2}
          subtitle="3 nuevos este mes"
          color="blue"
        />
        <MetricCard
          title="Compras del Mes"
          value={formatCurrency(447500)}
          icon={ShoppingCart}
          trend={-3.8}
          color="green"
        />
        <MetricCard
          title="Cuentas por Pagar"
          value={formatCurrency(89200)}
          icon={AlertTriangle}
          trend={-12.5}
          subtitle="15 facturas pendientes"
          color="yellow"
        />
        <MetricCard
          title="Promedio de Pago"
          value="18 días"
          icon={Calendar}
          trend={-8.7}
          subtitle="Mejora en tiempo"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top proveedores */}
        <div className="lg:col-span-2">
          <ReportCard title="Top Proveedores por Volumen de Compras">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Proveedor</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Monto Total</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Compras</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Última Compra</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {comprasData.map((proveedor, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          >
                            {proveedor.proveedor.charAt(0)}
                          </div>
                          {proveedor.proveedor}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-bold">
                        {formatCurrency(proveedor.montoTotal)}
                      </td>
                      <td className="py-3 px-4 text-right">{proveedor.cantidadCompras}</td>
                      <td className="py-3 px-4 text-right">{proveedor.ultimaCompra}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          proveedor.estado === 'activo' ? 'bg-green-100 text-green-800' :
                          proveedor.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {proveedor.estado === 'activo' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {proveedor.estado === 'pendiente' && <Clock className="w-3 h-3 mr-1" />}
                          {proveedor.estado === 'vencido' && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {proveedor.estado.charAt(0).toUpperCase() + proveedor.estado.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ReportCard>
        </div>

        {/* Estado de pagos */}
        <div>
          <ReportCard title="Estado de Pagos">
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={estadoPagosData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {estadoPagosData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, '']} />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Proveedores al día</span>
                  </div>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">15</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Pagos pendientes</span>
                  </div>
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">6</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Pagos vencidos</span>
                  </div>
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">4</span>
                </div>
              </div>
            </div>
          </ReportCard>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reportes y Estadísticas</h1>
            <p className="mt-1 text-sm text-gray-600">
              Análisis detallado del rendimiento del negocio
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tienda
            </label>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Desde
            </label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Hasta
            </label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleRefresh}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tabs de reportes */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('ventas')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'ventas'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Reporte de Ventas
              </div>
            </button>
            <button
              onClick={() => setActiveTab('proveedores')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'proveedores'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Reporte de Proveedores
              </div>
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'ventas' && <ReporteVentas />}
          {activeTab === 'proveedores' && <ReporteProveedores />}
        </div>
      </div>

      {/* Modal de exportación */}
      {showExportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Exportar Reporte</h3>
              <p className="text-sm text-gray-500 mb-4">
                Selecciona el formato de exportación:
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar como PDF
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar como Excel
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar como CSV
                </button>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportesSystem;