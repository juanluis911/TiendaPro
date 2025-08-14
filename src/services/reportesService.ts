// src/services/reportesService.ts
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Compra } from '../types/compras';
import { Pago } from '../types';
import { Proveedor } from '../types';

export interface ReporteData {
  comprasPorMes: ComprasPorMes[];
  topProveedores: TopProveedor[];
  estadoCuentasPorPagar: EstadoCuentas[];
  pagosPorMetodo: PagosPorMetodo[];
  flujoComprasPagos: FlujoData[];
  metricas: MetricasGenerales;
}

export interface ComprasPorMes {
  mes: string;
  compras: number;
  cantidadCompras: number;
}

export interface TopProveedor {
  proveedor: string;
  proveedorId: string;
  montoTotal: number;
  cantidadCompras: number;
  ultimaCompra: string;
  estado: 'al-dia' | 'pendiente' | 'vencido';
}

export interface EstadoCuentas {
  categoria: string;
  valor: number;
  porcentaje: number;
  color: string;
}

export interface PagosPorMetodo {
  metodo: string;
  monto: number;
  porcentaje: number;
  color: string;
}

export interface FlujoData {
  fecha: string;
  compras: number;
  pagos: number;
}

export interface MetricasGenerales {
  totalProveedores: number;
  comprasDelMes: number;
  cuentasPorPagar: number;
  promedioPago: number;
  pagosDelMes: number;
  cantidadPagos: number;
  pagoPromedio: number;
  pagosPendientes: number;
}

class ReportesService {
  
  /**
   * Obtener todos los datos necesarios para los reportes
   */
  async getReportData(
    organizationId: string, 
    storeId?: string, 
    fechaInicio?: Date, 
    fechaFin?: Date
  ): Promise<ReporteData> {
    try {
      // Definir rango de fechas (últimos 6 meses por defecto)
      const fechaFinal = fechaFin || new Date();
      const fechaInicial = fechaInicio || new Date(fechaFinal.getFullYear(), fechaFinal.getMonth() - 6, 1);
      
      // Obtener datos en paralelo
      const [compras, pagos, proveedores] = await Promise.all([
        this.getCompras(organizationId, storeId, fechaInicial, fechaFinal),
        this.getPagos(organizationId, storeId, fechaInicial, fechaFinal),
        this.getProveedores(organizationId, storeId)
      ]);

      // Procesar datos para reportes
      const comprasPorMes = this.processComprasPorMes(compras);
      const topProveedores = await this.processTopProveedores(compras, proveedores, pagos);
      const estadoCuentasPorPagar = this.processEstadoCuentas(compras, pagos);
      const pagosPorMetodo = this.processPagosPorMetodo(pagos);
      const flujoComprasPagos = this.processFlujoComprasPagos(compras, pagos);
      const metricas = this.processMetricas(compras, pagos, proveedores);

      return {
        comprasPorMes,
        topProveedores,
        estadoCuentasPorPagar,
        pagosPorMetodo,
        flujoComprasPagos,
        metricas
      };
    } catch (error) {
      console.error('Error getting report data:', error);
      throw error;
    }
  }

  /**
   * Obtener compras del período
   */
  private async getCompras(
    organizationId: string, 
    storeId?: string, 
    fechaInicio?: Date, 
    fechaFin?: Date
  ): Promise<Compra[]> {
    let q = query(
      collection(db, 'compras'),
      where('organizationId', '==', organizationId),
      orderBy('fechaCompra', 'desc')
    );

    if (storeId && storeId !== 'all') {
      q = query(
        collection(db, 'compras'),
        where('organizationId', '==', organizationId),
        where('storeId', '==', storeId),
        orderBy('fechaCompra', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    let compras = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Compra));

    // Filtrar por fechas si se proporcionan
    if (fechaInicio || fechaFin) {
      compras = compras.filter(compra => {
        const fechaCompra = compra.fechaCompra.toDate();
        if (fechaInicio && fechaCompra < fechaInicio) return false;
        if (fechaFin && fechaCompra > fechaFin) return false;
        return true;
      });
    }

    return compras;
  }

  /**
   * Obtener pagos del período
   */
  private async getPagos(
    organizationId: string, 
    storeId?: string, 
    fechaInicio?: Date, 
    fechaFin?: Date
  ): Promise<Pago[]> {
    let q = query(
      collection(db, 'pagos'),
      where('organizationId', '==', organizationId),
      orderBy('fechaPago', 'desc')
    );

    if (storeId && storeId !== 'all') {
      q = query(
        collection(db, 'pagos'),
        where('organizationId', '==', organizationId),
        where('storeId', '==', storeId),
        orderBy('fechaPago', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    let pagos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Pago));

    // Filtrar por fechas si se proporcionan
    if (fechaInicio || fechaFin) {
      pagos = pagos.filter(pago => {
        const fechaPago = pago.fechaPago.toDate();
        if (fechaInicio && fechaPago < fechaInicio) return false;
        if (fechaFin && fechaPago > fechaFin) return false;
        return true;
      });
    }

    return pagos;
  }

  /**
   * Obtener proveedores
   */
  private async getProveedores(organizationId: string, storeId?: string): Promise<Proveedor[]> {
    let q = query(
      collection(db, 'proveedores'),
      where('organizationId', '==', organizationId),
      where('activo', '==', true)
    );

    if (storeId && storeId !== 'all') {
      q = query(
        collection(db, 'proveedores'),
        where('organizationId', '==', organizationId),
        where('storeIds', 'array-contains', storeId),
        where('activo', '==', true)
      );
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Proveedor));
  }

  /**
   * Procesar compras por mes
   */
  private processComprasPorMes(compras: Compra[]): ComprasPorMes[] {
    const mesesData = new Map<string, { total: number; cantidad: number }>();
    
    compras.forEach(compra => {
      const fecha = compra.fechaCompra.toDate();
      const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      const mesLabel = fecha.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' });
      
      if (!mesesData.has(mesKey)) {
        mesesData.set(mesKey, { total: 0, cantidad: 0 });
      }
      
      const data = mesesData.get(mesKey)!;
      data.total += compra.total;
      data.cantidad += 1;
      mesesData.set(mesKey, data);
    });

    // Convertir a array y ordenar por fecha
    return Array.from(mesesData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6) // Últimos 6 meses
      .map(([key, data]) => {
        const [year, month] = key.split('-');
        const fecha = new Date(parseInt(year), parseInt(month) - 1);
        return {
          mes: fecha.toLocaleDateString('es-MX', { month: 'short' }),
          compras: data.total,
          cantidadCompras: data.cantidad
        };
      });
  }

  /**
   * Procesar top proveedores
   */
  private async processTopProveedores(
    compras: Compra[], 
    proveedores: Proveedor[], 
    pagos: Pago[]
  ): Promise<TopProveedor[]> {
    const proveedoresMap = new Map<string, TopProveedor>();
    
    // Inicializar proveedores
    proveedores.forEach(proveedor => {
      proveedoresMap.set(proveedor.id, {
        proveedor: proveedor.nombre,
        proveedorId: proveedor.id,
        montoTotal: 0,
        cantidadCompras: 0,
        ultimaCompra: '',
        estado: 'al-dia'
      });
    });

    // Procesar compras
    compras.forEach(compra => {
      const proveedor = proveedoresMap.get(compra.proveedorId);
      if (proveedor) {
        proveedor.montoTotal += compra.total;
        proveedor.cantidadCompras += 1;
        
        const fechaCompra = compra.fechaCompra.toDate().toLocaleDateString('es-MX');
        if (!proveedor.ultimaCompra || fechaCompra > proveedor.ultimaCompra) {
          proveedor.ultimaCompra = fechaCompra;
        }
      }
    });

    // Determinar estados basado en pagos y vencimientos
    compras.forEach(compra => {
      const proveedor = proveedoresMap.get(compra.proveedorId);
      if (proveedor && compra.estado === 'vencido') {
        proveedor.estado = 'vencido';
      } else if (proveedor && compra.estado === 'pendiente' && proveedor.estado !== 'vencido') {
        proveedor.estado = 'pendiente';
      }
    });

    return Array.from(proveedoresMap.values())
      .filter(p => p.cantidadCompras > 0)
      .sort((a, b) => b.montoTotal - a.montoTotal)
      .slice(0, 5);
  }

  /**
   * Procesar estado de cuentas por pagar
   */
  private processEstadoCuentas(compras: Compra[], pagos: Pago[]): EstadoCuentas[] {
    let alDia = 0;
    let porVencer = 0;
    let vencidas = 0;

    // Crear mapa de pagos por compra
    const pagosPorCompra = new Map<string, number>();
    pagos.forEach(pago => {
      const total = pagosPorCompra.get(pago.compraId) || 0;
      pagosPorCompra.set(pago.compraId, total + pago.monto);
    });

    const hoy = new Date();
    const en30Dias = new Date(hoy.getTime() + (30 * 24 * 60 * 60 * 1000));

    compras.forEach(compra => {
      const totalPagado = pagosPorCompra.get(compra.id) || 0;
      const montoPendiente = compra.total - totalPagado;
      
      if (montoPendiente <= 0) {
        alDia += 0; // Ya está pagado
      } else {
        const fechaVencimiento = compra.fechaVencimiento.toDate();
        
        if (fechaVencimiento < hoy) {
          vencidas += montoPendiente;
        } else if (fechaVencimiento <= en30Dias) {
          porVencer += montoPendiente;
        } else {
          alDia += montoPendiente;
        }
      }
    });

    const total = alDia + porVencer + vencidas;
    
    if (total === 0) {
      return [
        { categoria: 'Sin deudas pendientes', valor: 0, porcentaje: 100, color: '#4caf50' }
      ];
    }

    return [
      {
        categoria: 'Al día (más de 30 días)',
        valor: alDia,
        porcentaje: Math.round((alDia / total) * 100),
        color: '#4caf50'
      },
      {
        categoria: 'Por vencer (próximos 30 días)',
        valor: porVencer,
        porcentaje: Math.round((porVencer / total) * 100),
        color: '#ff9800'
      },
      {
        categoria: 'Vencidas',
        valor: vencidas,
        porcentaje: Math.round((vencidas / total) * 100),
        color: '#f44336'
      }
    ].filter(item => item.valor > 0);
  }

  /**
   * Procesar pagos por método
   */
  private processPagosPorMetodo(pagos: Pago[]): PagosPorMetodo[] {
    const metodos = new Map<string, number>();
    
    pagos.forEach(pago => {
      const total = metodos.get(pago.metodoPago) || 0;
      metodos.set(pago.metodoPago, total + pago.monto);
    });

    const totalGeneral = Array.from(metodos.values()).reduce((sum, val) => sum + val, 0);
    
    const colores = {
      transferencia: '#2196f3',
      efectivo: '#4caf50',
      cheque: '#ff9800',
      tarjeta: '#9c27b0'
    };

    const etiquetas = {
      transferencia: 'Transferencia',
      efectivo: 'Efectivo',
      cheque: 'Cheque',
      tarjeta: 'Tarjeta'
    };

    return Array.from(metodos.entries()).map(([metodo, monto]) => ({
      metodo: etiquetas[metodo as keyof typeof etiquetas] || metodo,
      monto,
      porcentaje: Math.round((monto / totalGeneral) * 100),
      color: colores[metodo as keyof typeof colores] || '#666666'
    }));
  }

  /**
   * Procesar flujo de compras vs pagos (últimos 7 días)
   */
  private processFlujoComprasPagos(compras: Compra[], pagos: Pago[]): FlujoData[] {
    const flujoData = new Map<string, { compras: number; pagos: number }>();
    
    // Últimos 7 días
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - i);
      const fechaKey = fecha.toISOString().split('T')[0];
      flujoData.set(fechaKey, { compras: 0, pagos: 0 });
    }

    // Procesar compras
    compras.forEach(compra => {
      const fechaKey = compra.fechaCompra.toDate().toISOString().split('T')[0];
      const data = flujoData.get(fechaKey);
      if (data) {
        data.compras += compra.total;
      }
    });

    // Procesar pagos
    pagos.forEach(pago => {
      const fechaKey = pago.fechaPago.toDate().toISOString().split('T')[0];
      const data = flujoData.get(fechaKey);
      if (data) {
        data.pagos += pago.monto;
      }
    });

    return Array.from(flujoData.entries()).map(([fecha, data]) => ({
      fecha: new Date(fecha).toLocaleDateString('es-MX', { 
        month: 'short', 
        day: 'numeric' 
      }),
      compras: data.compras,
      pagos: data.pagos
    }));
  }

  /**
   * Procesar métricas generales
   */
  private processMetricas(compras: Compra[], pagos: Pago[], proveedores: Proveedor[]): MetricasGenerales {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    // Compras del mes
    const comprasDelMes = compras
      .filter(c => c.fechaCompra.toDate() >= inicioMes)
      .reduce((sum, c) => sum + c.total, 0);

    // Pagos del mes
    const pagosDelMesArray = pagos.filter(p => p.fechaPago.toDate() >= inicioMes);
    const pagosDelMes = pagosDelMesArray.reduce((sum, p) => sum + p.monto, 0);

    // Cuentas por pagar
    const pagosPorCompra = new Map<string, number>();
    pagos.forEach(pago => {
      const total = pagosPorCompra.get(pago.compraId) || 0;
      pagosPorCompra.set(pago.compraId, total + pago.monto);
    });

    let cuentasPorPagar = 0;
    let pagosPendientes = 0;
    compras.forEach(compra => {
      const totalPagado = pagosPorCompra.get(compra.id) || 0;
      const pendiente = compra.total - totalPagado;
      if (pendiente > 0) {
        cuentasPorPagar += pendiente;
        if (compra.fechaVencimiento.toDate() < hoy) {
          pagosPendientes += pendiente;
        }
      }
    });

    // Promedio de días de pago
    let totalDias = 0;
    let contadorPagos = 0;
    
    pagos.forEach(pago => {
      const compra = compras.find(c => c.id === pago.compraId);
      if (compra) {
        const diasDiferencia = Math.floor(
          (pago.fechaPago.toDate().getTime() - compra.fechaCompra.toDate().getTime()) 
          / (1000 * 60 * 60 * 24)
        );
        totalDias += diasDiferencia;
        contadorPagos++;
      }
    });

    const promedioPago = contadorPagos > 0 ? Math.round(totalDias / contadorPagos) : 0;
    const pagoPromedio = pagosDelMesArray.length > 0 ? 
      Math.round(pagosDelMes / pagosDelMesArray.length) : 0;

    return {
      totalProveedores: proveedores.length,
      comprasDelMes,
      cuentasPorPagar,
      promedioPago,
      pagosDelMes,
      cantidadPagos: pagosDelMesArray.length,
      pagoPromedio,
      pagosPendientes
    };
  }
}

// Instancia del servicio
export const reportesService = new ReportesService();