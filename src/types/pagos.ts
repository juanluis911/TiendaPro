// src/types/pagos.ts
import { Timestamp } from 'firebase/firestore';

export interface Pago {
  id: string;
  organizationId: string;
  storeId: string;
  compraId: string;
  proveedorId: string;
  proveedorNombre?: string; // Campo calculado para mostrar
  compraNumeroFactura?: string; // Campo calculado para mostrar
  monto: number;
  fechaPago: Timestamp;
  metodoPago: 'efectivo' | 'transferencia' | 'cheque' | 'tarjeta';
  referencia?: string; // número de referencia, cheque, etc.
  notas?: string;
  registradoPor: string;
  registradoPorNombre?: string; // Campo calculado para mostrar
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface PagoFormData {
  compraId: string;
  monto: number;
  fechaPago: Date;
  metodoPago: 'efectivo' | 'transferencia' | 'cheque' | 'tarjeta';
  referencia?: string;
  notas?: string;
}

export interface PagoResumen {
  totalPagos: number;
  pagosPorMetodo: {
    efectivo: number;
    transferencia: number;
    cheque: number;
    tarjeta: number;
  };
  pagosDelMes: number;
  promedioMensual: number;
}

export interface PagoConDetalles extends Pago {
  compraInfo: {
    numeroFactura: string;
    total: number;
    fechaCompra: Timestamp;
    estado: 'pendiente' | 'pagado' | 'parcial' | 'vencido';
  };
  proveedorInfo: {
    nombre: string;
    telefono?: string;
    email?: string;
  };
  montoPendiente: number;
  totalPagado: number;
}

export const METODOS_PAGO = [
  { value: 'efectivo', label: 'Efectivo', icon: '💵' },
  { value: 'transferencia', label: 'Transferencia', icon: '🏦' },
  { value: 'cheque', label: 'Cheque', icon: '📝' },
  { value: 'tarjeta', label: 'Tarjeta', icon: '💳' }
] as const;