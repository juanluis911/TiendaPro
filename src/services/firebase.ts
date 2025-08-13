// src/services/firebase.ts
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  Organization, 
  Store, 
  UserProfile, 
  Proveedor, 
  Compra, 
  Pago 
} from '../types';

// Clase base para servicios de Firebase
class FirebaseService<T> {
  constructor(private collectionName: string) {}

  // Crear documento
  async create(data: Omit<T, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error(`Error creating ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Obtener documento por ID
  async getById(id: string): Promise<T | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
      }
      return null;
    } catch (error) {
      console.error(`Error getting ${this.collectionName} by ID:`, error);
      throw error;
    }
  }

  // Actualizar documento
  async update(id: string, data: Partial<T>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error(`Error updating ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Eliminar documento (soft delete)
  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        activo: false,
        deletedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error(`Error deleting ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Obtener todos los documentos con filtros
  async getAll(
    filters?: { field: string; operator: any; value: any }[],
    orderByField?: string,
    limitCount?: number
  ): Promise<T[]> {
    try {
      let q = collection(db, this.collectionName);
      let queryConstraints: any[] = [];

      // Aplicar filtros
      if (filters) {
        filters.forEach(filter => {
          queryConstraints.push(where(filter.field, filter.operator, filter.value));
        });
      }

      // Aplicar ordenamiento
      if (orderByField) {
        queryConstraints.push(orderBy(orderByField));
      }

      // Aplicar límite
      if (limitCount) {
        queryConstraints.push(limit(limitCount));
      }

      const queryRef = query(q, ...queryConstraints);
      const querySnapshot = await getDocs(queryRef);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
    } catch (error) {
      console.error(`Error getting all ${this.collectionName}:`, error);
      throw error;
    }
  }
}

// Servicio específico para Organizations
export class OrganizationService extends FirebaseService<Organization> {
  constructor() {
    super('organizations');
  }

  async getByOwnerId(ownerId: string): Promise<Organization | null> {
    const results = await this.getAll([
      { field: 'owner', operator: '==', value: ownerId }
    ]);
    return results.length > 0 ? results[0] : null;
  }
}

// Servicio específico para Stores
export class StoreService extends FirebaseService<Store> {
  constructor() {
    super('stores');
  }

  async getByOrganizationId(organizationId: string): Promise<Store[]> {
    return this.getAll([
      { field: 'organizationId', operator: '==', value: organizationId },
      { field: 'active', operator: '==', value: true }
    ], 'name');
  }

  async getByManagerId(managerId: string): Promise<Store[]> {
    return this.getAll([
      { field: 'manager', operator: '==', value: managerId },
      { field: 'active', operator: '==', value: true }
    ], 'name');
  }
}

// Servicio específico para Users
export class UserService extends FirebaseService<UserProfile> {
  constructor() {
    super('users');
  }

  async getByOrganizationId(organizationId: string): Promise<UserProfile[]> {
    return this.getAll([
      { field: 'organizationId', operator: '==', value: organizationId },
      { field: 'active', operator: '==', value: true }
    ], 'displayName');
  }

  async getByEmail(email: string): Promise<UserProfile | null> {
    const results = await this.getAll([
      { field: 'email', operator: '==', value: email }
    ]);
    return results.length > 0 ? results[0] : null;
  }

  // Método para crear usuario con ID específico (para cuando Firebase Auth crea el usuario)
  async createWithId(uid: string, data: Omit<UserProfile, 'uid'>): Promise<void> {
    try {
      await setDoc(doc(db, 'users', uid), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error creating user with ID:', error);
      throw error;
    }
  }

  // Método para obtener usuarios por organización con filtros avanzados
  async getByOrganizationWithFilters(
    organizationId: string,
    filters?: {
      role?: UserRole;
      active?: boolean;
      storeAccess?: string;
    }
  ): Promise<UserProfile[]> {
    try {
      let q = query(
        collection(db, 'users'),
        where('organizationId', '==', organizationId),
        orderBy('createdAt', 'desc')
      );

      // Aplicar filtros adicionales
      if (filters?.role) {
        q = query(q, where('role', '==', filters.role));
      }

      if (filters?.active !== undefined) {
        q = query(q, where('active', '==', filters.active));
      }

      const snapshot = await getDocs(q);
      let users = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      } as UserProfile));

      // Filtrar por acceso a tienda (no se puede hacer en Firestore directamente)
      if (filters?.storeAccess) {
        users = users.filter(user => 
          user.storeAccess.includes(filters.storeAccess!)
        );
      }

      return users;
    } catch (error) {
      console.error('Error getting users with filters:', error);
      throw error;
    }
  }

  // Método para obtener estadísticas de usuarios
  async getUserStats(organizationId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<UserRole, number>;
    createdThisMonth: number;
  }> {
    try {
      const users = await this.getByOrganizationId(organizationId);
      
      const stats = {
        total: users.length,
        active: users.filter(u => u.active).length,
        inactive: users.filter(u => !u.active).length,
        byRole: {
          owner: users.filter(u => u.role === 'owner').length,
          admin: users.filter(u => u.role === 'admin').length,
          manager: users.filter(u => u.role === 'manager').length,
          empleado: users.filter(u => u.role === 'empleado').length,
          vendedor: users.filter(u => u.role === 'vendedor').length,
        } as Record<UserRole, number>,
        createdThisMonth: 0
      };

      // Calcular usuarios creados este mes
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      stats.createdThisMonth = users.filter(user => {
        const createdDate = user.createdAt.toDate();
        return createdDate >= startOfMonth;
      }).length;

      return stats;
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  // Método para verificar si un email ya existe en la organización
  async emailExistsInOrganization(email: string, organizationId: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, 'users'),
        where('email', '==', email),
        where('organizationId', '==', organizationId)
      );
      
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking email existence:', error);
      throw error;
    }
  }

  // Método para obtener usuarios por tienda específica
  async getUsersByStore(storeId: string): Promise<UserProfile[]> {
    try {
      const q = query(
        collection(db, 'users'),
        where('storeAccess', 'array-contains', storeId),
        where('active', '==', true),
        orderBy('role'),
        orderBy('displayName')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      } as UserProfile));
    } catch (error) {
      console.error('Error getting users by store:', error);
      throw error;
    }
  }

  // Método para actualizar acceso a tiendas de múltiples usuarios
  async updateStoreAccessBatch(
    userIds: string[],
    storeId: string,
    action: 'add' | 'remove'
  ): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      for (const userId of userIds) {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserProfile;
          let newStoreAccess = [...userData.storeAccess];
          
          if (action === 'add' && !newStoreAccess.includes(storeId)) {
            newStoreAccess.push(storeId);
          } else if (action === 'remove') {
            newStoreAccess = newStoreAccess.filter(id => id !== storeId);
          }
          
          batch.update(userRef, {
            storeAccess: newStoreAccess,
            updatedAt: serverTimestamp()
          });
        }
      }
      
      await batch.commit();
    } catch (error) {
      console.error('Error updating store access batch:', error);
      throw error;
    }
  }

  // Método para obtener usuarios con permisos específicos
  async getUsersWithPermission(
    organizationId: string,
    permission: keyof UserProfile['permissions']
  ): Promise<UserProfile[]> {
    try {
      const users = await this.getByOrganizationId(organizationId);
      return users.filter(user => 
        user.active && user.permissions[permission]
      );
    } catch (error) {
      console.error('Error getting users with permission:', error);
      throw error;
    }
  }

  // Método para cambiar el rol de un usuario y ajustar permisos automáticamente
  async updateUserRole(userId: string, newRole: UserRole): Promise<void> {
    try {
      // Definir permisos por defecto según el rol
      const defaultPermissions = {
        owner: {
          proveedores: true,
          inventario: true,
          ventas: true,
          reportes: true,
          configuracion: true,
          multitienda: true,
        },
        admin: {
          proveedores: true,
          inventario: true,
          ventas: true,
          reportes: true,
          configuracion: true,
          multitienda: true,
        },
        manager: {
          proveedores: true,
          inventario: true,
          ventas: true,
          reportes: true,
          configuracion: false,
          multitienda: false,
        },
        empleado: {
          proveedores: true,
          inventario: true,
          ventas: false,
          reportes: false,
          configuracion: false,
          multitienda: false,
        },
        vendedor: {
          proveedores: false,
          inventario: true,
          ventas: true,
          reportes: false,
          configuracion: false,
          multitienda: false,
        },
      };

      await this.update(userId, {
        role: newRole,
        permissions: defaultPermissions[newRole]
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }
}

// Servicio específico para Proveedores
export class ProveedorService extends FirebaseService<Proveedor> {
  constructor() {
    super('proveedores');
  }

  async getByOrganizationAndStore(organizationId: string, storeId?: string): Promise<Proveedor[]> {
    const filters = [
      { field: 'organizationId', operator: '==', value: organizationId },
      { field: 'activo', operator: '==', value: true }
    ];

    if (storeId) {
      filters.push({ field: 'storeIds', operator: 'array-contains', value: storeId });
    }

    return this.getAll(filters, 'nombre');
  }

  async getGlobalProveedores(organizationId: string): Promise<Proveedor[]> {
    return this.getAll([
      { field: 'organizationId', operator: '==', value: organizationId },
      { field: 'esGlobal', operator: '==', value: true },
      { field: 'activo', operator: '==', value: true }
    ], 'nombre');
  }

  async searchByName(organizationId: string, searchTerm: string): Promise<Proveedor[]> {
    // Nota: Firestore no soporta búsqueda de texto completo nativamente
    // Esta es una implementación básica que se puede mejorar con Algolia o similar
    const allProveedores = await this.getByOrganizationAndStore(organizationId);
    return allProveedores.filter(proveedor => 
      proveedor.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
}

// Servicio específico para Compras
export class CompraService extends FirebaseService<Compra> {
  constructor() {
    super('compras');
  }

  async getByOrganizationAndStore(organizationId: string, storeId?: string): Promise<Compra[]> {
    const filters = [
      { field: 'organizationId', operator: '==', value: organizationId }
    ];

    if (storeId) {
      filters.push({ field: 'storeId', operator: '==', value: storeId });
    }

    return this.getAll(filters, 'fechaCompra', 50);
  }

  async getByProveedor(proveedorId: string): Promise<Compra[]> {
    return this.getAll([
      { field: 'proveedorId', operator: '==', value: proveedorId }
    ], 'fechaCompra');
  }

  async getPendingPayments(organizationId: string, storeId?: string): Promise<Compra[]> {
    const filters = [
      { field: 'organizationId', operator: '==', value: organizationId },
      { field: 'estado', operator: '==', value: 'pendiente' }
    ];

    if (storeId) {
      filters.push({ field: 'storeId', operator: '==', value: storeId });
    }

    return this.getAll(filters, 'fechaVencimiento');
  }

  async getOverduePayments(organizationId: string, storeId?: string): Promise<Compra[]> {
    const today = Timestamp.now();
    const filters = [
      { field: 'organizationId', operator: '==', value: organizationId },
      { field: 'estado', operator: '==', value: 'pendiente' },
      { field: 'fechaVencimiento', operator: '<=', value: today }
    ];

    if (storeId) {
      filters.push({ field: 'storeId', operator: '==', value: storeId });
    }

    return this.getAll(filters, 'fechaVencimiento');
  }

  async updateEstado(compraId: string, nuevoEstado: 'pendiente' | 'pagado' | 'vencido'): Promise<void> {
    await this.update(compraId, { estado: nuevoEstado });
  }
}

// Servicio específico para Pagos
export class PagoService extends FirebaseService<Pago> {
  constructor() {
    super('pagos');
  }

  async getByCompra(compraId: string): Promise<Pago[]> {
    return this.getAll([
      { field: 'compraId', operator: '==', value: compraId }
    ], 'fechaPago');
  }

  async getByOrganizationAndStore(organizationId: string, storeId?: string): Promise<Pago[]> {
    const filters = [
      { field: 'organizationId', operator: '==', value: organizationId }
    ];

    if (storeId) {
      filters.push({ field: 'storeId', operator: '==', value: storeId });
    }

    return this.getAll(filters, 'fechaPago', 100);
  }

  async getByProveedor(proveedorId: string): Promise<Pago[]> {
    return this.getAll([
      { field: 'proveedorId', operator: '==', value: proveedorId }
    ], 'fechaPago');
  }

  async getTotalPaidForCompra(compraId: string): Promise<number> {
    const pagos = await this.getByCompra(compraId);
    return pagos.reduce((total, pago) => total + pago.monto, 0);
  }

  // Crear pago y actualizar estado de compra automáticamente
  async createPagoAndUpdateCompra(pagoData: Omit<Pago, 'id'>, compraTotal: number): Promise<string> {
    try {
      // Crear el pago
      const pagoId = await this.create(pagoData);

      // Obtener todos los pagos de esta compra
      const totalPagado = await this.getTotalPaidForCompra(pagoData.compraId);

      // Actualizar estado de la compra
      const compraService = new CompraService();
      const nuevoEstado = totalPagado >= compraTotal ? 'pagado' : 'pendiente';
      await compraService.updateEstado(pagoData.compraId, nuevoEstado);

      return pagoId;
    } catch (error) {
      console.error('Error creating pago and updating compra:', error);
      throw error;
    }
  }
}

// Instancias de servicios para exportar
export const organizationService = new OrganizationService();
export const storeService = new StoreService();
export const userService = new UserService();
export const proveedorService = new ProveedorService();
export const compraService = new CompraService();
export const pagoService = new PagoService();

// Funciones utilitarias
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
};

export const formatDate = (date: Timestamp | Date): string => {
  const dateObj = date instanceof Timestamp ? date.toDate() : date;
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(dateObj);
};

export const formatDateTime = (date: Timestamp | Date): string => {
  const dateObj = date instanceof Timestamp ? date.toDate() : date;
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
};