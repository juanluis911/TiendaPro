// src/types/index.ts
import { Timestamp } from 'firebase/firestore';

export interface Organization {
  id: string;
  name: string;
  plan: 'free' | 'basic' | 'premium';
  maxStores: number;
  maxUsers: number;
  features: {
    proveedores: boolean;
    inventario: boolean;
    ventas: boolean;
    reportes: boolean;
    multitienda: boolean;
  };
  owner: string;
  active: boolean;
  createdAt: Timestamp;
  subscription: {
    status: 'active' | 'suspended' | 'cancelled';
    currentPeriodEnd: Timestamp;
    plan: string;
  };
}

export interface Store {
  id: string;
  organizationId: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  manager: string;
  active: boolean;
  config: {
    currency: string;
    timezone: string;
    businessHours: {
      open: string;
      close: string;
      days: string[];
    };
  };
  createdAt: Timestamp;
  createdBy: string;
}

export type UserRole = 'owner' | 'admin' | 'manager' | 'empleado' | 'vendedor';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  organizationId: string;
  role: UserRole;
  storeAccess: string[];
  permissions: {
    proveedores: boolean;
    inventario: boolean;
    ventas: boolean;
    reportes: boolean;
    configuracion: boolean;
    multitienda: boolean;
  };
  active: boolean;
  createdAt: Timestamp;
  createdBy: string;
}

export interface Proveedor {
  id: string;
  organizationId: string;
  storeIds: string[];
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
  contacto: string;
  tipoProductos: string[];
  activo: boolean;
  esGlobal: boolean;
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
}

export interface ProductoCompra {
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
  productos: ProductoCompra[];
  total: number;
  fechaCompra: Timestamp;
  fechaVencimiento: Timestamp;
  estado: 'pendiente' | 'pagado' | 'vencido';
  notas: string;
  createdBy: string;
  createdAt: Timestamp;
}

export interface Pago {
  id: string;
  organizationId: string;
  storeId: string;
  compraId: string;
  proveedorId: string;
  monto: number;
  fechaPago: Timestamp;
  metodoPago: 'efectivo' | 'transferencia' | 'cheque';
  referencia: string;
  notas: string;
  registradoPor: string;
  createdAt: Timestamp;
}

export interface AuthContextType {
  user: any;
  userProfile: UserProfile | null;
  organization: Organization | null;
  userStores: Store[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasPermission: (permission: keyof UserProfile['permissions']) => boolean;
  canAccessStore: (storeId: string) => boolean;
}

export interface DashboardStats {
  totalProveedores: number;
  comprasPendientes: number;
  montoTotalPendiente: number;
  vencimientosProximos: number;
  comprasEsteMes: number;
  pagosEsteMes: number;
}