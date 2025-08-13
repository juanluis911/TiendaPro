// src/utils/pagosUtils.ts
import { Timestamp } from 'firebase/firestore';
import { PagoConDetalles, Pago } from '../types/pagos';
import { Compra } from '../types/compras';

/**
 * Calcula el estado de una compra basado en los pagos realizados
 */
export const calcularEstadoCompra = (
  totalCompra: number,
  totalPagado: number
): 'pendiente' | 'parcial' | 'pagado' => {
  if (totalPagado === 0) return 'pendiente';
  if (totalPagado >= totalCompra) return 'pagado';
  return 'parcial';
};

/**
 * Calcula el porcentaje de pago de una compra
 */
export const calcularPorcentajePago = (
  totalCompra: number,
  totalPagado: number
): number => {
  if (totalCompra === 0) return 0;
  return Math.min((totalPagado / totalCompra) * 100, 100);
};

/**
 * Formatea una cantidad monetaria en pesos mexicanos
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Formatea un número como porcentaje
 */
export const formatPercent = (value: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100);
};

/**
 * Valida si un monto de pago es válido
 */
export const validarMontoPago = (
  monto: number,
  totalCompra: number,
  totalPagado: number
): { esValido: boolean; mensaje?: string } => {
  if (monto <= 0) {
    return { esValido: false, mensaje: 'El monto debe ser mayor a 0' };
  }

  const saldoPendiente = totalCompra - totalPagado;
  if (monto > saldoPendiente) {
    return { 
      esValido: false, 
      mensaje: `El monto no puede exceder el saldo pendiente de ${formatCurrency(saldoPendiente)}` 
    };
  }

  return { esValido: true };
};

/**
 * Genera un resumen de pagos por período
 */
export const generarResumenPeriodo = (
  pagos: Pago[],
  fechaInicio: Date,
  fechaFin: Date
) => {
  const pagosFiltrados = pagos.filter(pago => {
    const fechaPago = pago.fechaPago.toDate();
    return fechaPago >= fechaInicio && fechaPago <= fechaFin;
  });

  const totalPagos = pagosFiltrados.reduce((sum, pago) => sum + pago.monto, 0);
  const cantidadPagos = pagosFiltrados.length;
  const promedioMonto = cantidadPagos > 0 ? totalPagos / cantidadPagos : 0;

  const pagosPorMetodo = pagosFiltrados.reduce((acc, pago) => {
    acc[pago.metodoPago] = (acc[pago.metodoPago] || 0) + pago.monto;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalPagos,
    cantidadPagos,
    promedioMonto,
    pagosPorMetodo,
    fechaInicio,
    fechaFin
  };
};

/**
 * Agrupa pagos por proveedor
 */
export const agruparPagosPorProveedor = (pagos: PagoConDetalles[]) => {
  const grupos = pagos.reduce((acc, pago) => {
    const proveedorId = pago.proveedorId;
    if (!acc[proveedorId]) {
      acc[proveedorId] = {
        proveedor: pago.proveedorInfo,
        pagos: [],
        totalPagado: 0,
        cantidadPagos: 0
      };
    }
    
    acc[proveedorId].pagos.push(pago);
    acc[proveedorId].totalPagado += pago.monto;
    acc[proveedorId].cantidadPagos += 1;
    
    return acc;
  }, {} as Record<string, any>);

  return Object.values(grupos).sort((a: any, b: any) => b.totalPagado - a.totalPagado);
};

/**
 * Calcula métricas de tendencia de pagos
 */
export const calcularTendenciaPagos = (
  pagosActuales: Pago[],
  pagosAnteriores: Pago[]
) => {
  const totalActual = pagosActuales.reduce((sum, pago) => sum + pago.monto, 0);
  const totalAnterior = pagosAnteriores.reduce((sum, pago) => sum + pago.monto, 0);
  
  const variacion = totalAnterior > 0 ? ((totalActual - totalAnterior) / totalAnterior) * 100 : 0;
  const tendencia = variacion > 0 ? 'subida' : variacion < 0 ? 'bajada' : 'estable';

  return {
    totalActual,
    totalAnterior,
    variacion,
    tendencia,
    cantidadActual: pagosActuales.length,
    cantidadAnterior: pagosAnteriores.length
  };
};

/**
 * Convierte un timestamp de Firebase a fecha local
 */
export const timestampToDate = (timestamp: Timestamp): Date => {
  return timestamp.toDate();
};

/**
 * Convierte una fecha a timestamp de Firebase
 */
export const dateToTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

/**
 * Genera opciones de filtrado por fecha predefinidas
 */
export const obtenerOpcionesFecha = () => {
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
  const inicioMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
  const finMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
  const inicioAño = new Date(hoy.getFullYear(), 0, 1);
  const hace30Dias = new Date(hoy.getTime() - (30 * 24 * 60 * 60 * 1000));
  const hace7Dias = new Date(hoy.getTime() - (7 * 24 * 60 * 60 * 1000));

  return [
    { label: 'Últimos 7 días', inicio: hace7Dias, fin: hoy },
    { label: 'Últimos 30 días', inicio: hace30Dias, fin: hoy },
    { label: 'Este mes', inicio: inicioMes, fin: finMes },
    { label: 'Mes anterior', inicio: inicioMesAnterior, fin: finMesAnterior },
    { label: 'Este año', inicio: inicioAño, fin: hoy }
  ];
};

/**
 * Valida la referencia según el método de pago
 */
export const validarReferencia = (
  metodoPago: string,
  referencia?: string
): { esValida: boolean; mensaje?: string } => {
  const metodosQueRequierenReferencia = ['transferencia', 'cheque'];
  
  if (metodosQueRequierenReferencia.includes(metodoPago)) {
    if (!referencia || referencia.trim() === '') {
      return { 
        esValida: false, 
        mensaje: `La referencia es requerida para pagos por ${metodoPago}` 
      };
    }
    
    if (referencia.length < 3) {
      return { 
        esValida: false, 
        mensaje: 'La referencia debe tener al menos 3 caracteres' 
      };
    }
  }

  return { esValida: true };
};

/**
 * Genera un ID de referencia automático
 */
export const generarReferenciaAutomatica = (metodoPago: string): string => {
  const timestamp = Date.now().toString().slice(-8);
  const prefijos = {
    transferencia: 'TRANS',
    cheque: 'CHE',
    tarjeta: 'CARD',
    efectivo: 'EFE'
  };
  
  const prefijo = prefijos[metodoPago as keyof typeof prefijos] || 'PAG';
  return `${prefijo}-${timestamp}`;
};

/**
 * Exporta datos de pagos a CSV
 */
export const exportarPagosCSV = (pagos: PagoConDetalles[], nombreArchivo: string = 'pagos') => {
  const headers = [
    'Fecha',
    'Proveedor',
    'Factura',
    'Monto',
    'Método de Pago',
    'Referencia',
    'Estado Compra',
    'Notas',
    'Registrado Por'
  ];

  const filas = pagos.map(pago => [
    pago.fechaPago.toDate().toLocaleDateString('es-MX'),
    pago.proveedorInfo.nombre,
    pago.compraInfo.numeroFactura,
    pago.monto.toFixed(2),
    pago.metodoPago,
    pago.referencia || '',
    pago.compraInfo.estado,
    pago.notas || '',
    pago.registradoPorNombre || ''
  ]);

  const csvContent = [headers, ...filas]
    .map(fila => fila.map(campo => `"${campo}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${nombreArchivo}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Calcula alertas de pagos vencidos o próximos a vencer
 */
export const calcularAlertas = (compras: Compra[]) => {
  const hoy = new Date();
  const en7Dias = new Date(hoy.getTime() + (7 * 24 * 60 * 60 * 1000));

  const comprasVencidas = compras.filter(compra => 
    compra.estado !== 'pagado' && compra.fechaVencimiento.toDate() < hoy
  );

  const comprasProximasAVencer = compras.filter(compra => 
    compra.estado !== 'pagado' && 
    compra.fechaVencimiento.toDate() >= hoy &&
    compra.fechaVencimiento.toDate() <= en7Dias
  );

  return {
    vencidas: comprasVencidas,
    proximasAVencer: comprasProximasAVencer,
    totalVencidas: comprasVencidas.reduce((sum, c) => sum + c.total, 0),
    totalProximasAVencer: comprasProximasAVencer.reduce((sum, c) => sum + c.total, 0)
  };
};