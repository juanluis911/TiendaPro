import { Timestamp } from 'firebase/firestore';
import { Dayjs } from 'dayjs';

export interface Producto {
  nombre: string;
  cantidad: number;
  unidad: string;
  precioUnitario: number;
  subtotal: number;
}

export interface Compra {
  id: string;
  organizationId: string;
  storeId: string;
  proveedorId: string;
  numeroFactura: string;
  productos: Producto[];
  total: number;
  fechaCompra: Timestamp;
  fechaVencimiento: Timestamp;
  estado: 'pendiente' | 'pagado' | 'vencido';
  notas?: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface CompraFormData {
  proveedorId: string;
  numeroFactura: string;
  fechaCompra: Dayjs;
  fechaVencimiento: Dayjs;
  productos: Producto[];
  total: number;
  notas?: string;
}

export interface CompraFilters {
  proveedor: string;
  estado: string;
  fechaDesde: Dayjs | null;
  fechaHasta: Dayjs | null;
  busqueda: string;
}

export const UNIDADES = [
  { value: 'pz', label: 'Piezas (pz)' },
  { value: 'kg', label: 'Kilogramos (kg)' },
  { value: 'g', label: 'Gramos (g)' },
  { value: 'l', label: 'Litros (l)' },
  { value: 'ml', label: 'Mililitros (ml)' },
  { value: 'caja', label: 'Cajas' },
  { value: 'costal', label: 'Costales' },
  { value: 'docena', label: 'Docenas' },
  { value: 'pack', label: 'Paquetes' },
];

export const ESTADOS_COMPRA = [
  { value: 'pendiente', label: 'Pendiente', color: 'warning' },
  { value: 'pagado', label: 'Pagado', color: 'success' },
  { value: 'vencido', label: 'Vencido', color: 'error' },
] as const;