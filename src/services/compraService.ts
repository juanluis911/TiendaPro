import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Compra } from '../types/compras';

class CompraService {
  private collectionName = 'compras';

  /**
   * Obtener todas las compras de una organización y tienda específica
   */
  async getByOrganizationAndStore(organizationId: string, storeId?: string): Promise<Compra[]> {
    try {
      let q = query(
        collection(db, this.collectionName),
        where('organizationId', '==', organizationId),
        orderBy('createdAt', 'desc')
      );

      if (storeId) {
        q = query(
          collection(db, this.collectionName),
          where('organizationId', '==', organizationId),
          where('storeId', '==', storeId),
          orderBy('createdAt', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Compra));
    } catch (error) {
      console.error('Error getting compras:', error);
      throw error;
    }
  }

  /**
   * Obtener una compra por ID
   */
  async getById(id: string): Promise<Compra | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Compra;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting compra:', error);
      throw error;
    }
  }

  /**
   * Crear una nueva compra
   */
  async create(compraData: Omit<Compra, 'id'>): Promise<string> {
    try {
      // Calcular el total automáticamente en el servidor
      const total = compraData.productos.reduce((sum, producto) => {
        return sum + (producto.cantidad * producto.precioUnitario);
      }, 0);

      // Asegurar que los subtotales están calculados correctamente
      const productos = compraData.productos.map(producto => ({
        ...producto,
        subtotal: producto.cantidad * producto.precioUnitario
      }));

      const docData = {
        ...compraData,
        productos,
        total,
        createdAt: Timestamp.fromDate(compraData.createdAt),
        fechaCompra: Timestamp.fromDate(compraData.fechaCompra),
        fechaVencimiento: Timestamp.fromDate(compraData.fechaVencimiento),
      };

      const docRef = await addDoc(collection(db, this.collectionName), docData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating compra:', error);
      throw error;
    }
  }

  /**
   * Actualizar una compra existente
   */
  async update(id: string, compraData: Partial<Omit<Compra, 'id'>>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      
      // Si se están actualizando los productos, recalcular el total
      if (compraData.productos) {
        const total = compraData.productos.reduce((sum, producto) => {
          return sum + (producto.cantidad * producto.precioUnitario);
        }, 0);

        // Asegurar que los subtotales están calculados correctamente
        const productos = compraData.productos.map(producto => ({
          ...producto,
          subtotal: producto.cantidad * producto.precioUnitario
        }));

        compraData.productos = productos;
        compraData.total = total;
      }

      const updateData: any = { ...compraData };

      // Convertir fechas a Timestamp si están presentes
      if (compraData.fechaCompra) {
        updateData.fechaCompra = Timestamp.fromDate(compraData.fechaCompra);
      }
      if (compraData.fechaVencimiento) {
        updateData.fechaVencimiento = Timestamp.fromDate(compraData.fechaVencimiento);
      }
      if (compraData.updatedAt) {
        updateData.updatedAt = Timestamp.fromDate(compraData.updatedAt);
      }

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating compra:', error);
      throw error;
    }
  }

  /**
   * Eliminar una compra
   */
  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting compra:', error);
      throw error;
    }
  }

  /**
   * Obtener compras pendientes de pago
   */
  async getPendingPayments(organizationId: string, storeId?: string): Promise<Compra[]> {
    try {
      let q = query(
        collection(db, this.collectionName),
        where('organizationId', '==', organizationId),
        where('estado', '==', 'pendiente'),
        orderBy('fechaVencimiento', 'asc')
      );

      if (storeId) {
        q = query(
          collection(db, this.collectionName),
          where('organizationId', '==', organizationId),
          where('storeId', '==', storeId),
          where('estado', '==', 'pendiente'),
          orderBy('fechaVencimiento', 'asc')
        );
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Compra));
    } catch (error) {
      console.error('Error getting pending payments:', error);
      throw error;
    }
  }

  /**
   * Obtener compras vencidas
   */
  async getOverduePayments(organizationId: string, storeId?: string): Promise<Compra[]> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let q = query(
        collection(db, this.collectionName),
        where('organizationId', '==', organizationId),
        where('estado', '==', 'pendiente'),
        where('fechaVencimiento', '<', Timestamp.fromDate(today)),
        orderBy('fechaVencimiento', 'asc')
      );

      if (storeId) {
        q = query(
          collection(db, this.collectionName),
          where('organizationId', '==', organizationId),
          where('storeId', '==', storeId),
          where('estado', '==', 'pendiente'),
          where('fechaVencimiento', '<', Timestamp.fromDate(today)),
          orderBy('fechaVencimiento', 'asc')
        );
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Compra));
    } catch (error) {
      console.error('Error getting overdue payments:', error);
      throw error;
    }
  }

  /**
   * Obtener compras por proveedor
   */
  async getByProveedor(organizationId: string, proveedorId: string): Promise<Compra[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('organizationId', '==', organizationId),
        where('proveedorId', '==', proveedorId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Compra));
    } catch (error) {
      console.error('Error getting compras by proveedor:', error);
      throw error;
    }
  }

  /**
   * Actualizar estado de una compra
   */
  async updateStatus(id: string, estado: 'pendiente' | 'pagado' | 'vencido'): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        estado,
        updatedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error updating compra status:', error);
      throw error;
    }
  }

  /**
   * Obtener compras por rango de fechas
   */
  async getByDateRange(
    organizationId: string, 
    startDate: Date, 
    endDate: Date, 
    storeId?: string
  ): Promise<Compra[]> {
    try {
      let q = query(
        collection(db, this.collectionName),
        where('organizationId', '==', organizationId),
        where('fechaCompra', '>=', Timestamp.fromDate(startDate)),
        where('fechaCompra', '<=', Timestamp.fromDate(endDate)),
        orderBy('fechaCompra', 'desc')
      );

      if (storeId) {
        q = query(
          collection(db, this.collectionName),
          where('organizationId', '==', organizationId),
          where('storeId', '==', storeId),
          where('fechaCompra', '>=', Timestamp.fromDate(startDate)),
          where('fechaCompra', '<=', Timestamp.fromDate(endDate)),
          orderBy('fechaCompra', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Compra));
    } catch (error) {
      console.error('Error getting compras by date range:', error);
      throw error;
    }
  }

  /**
   * Eliminar múltiples compras en lote
   */
  async deleteBatch(ids: string[]): Promise<void> {
    try {
      const batch = writeBatch(db);

      ids.forEach(id => {
        const docRef = doc(db, this.collectionName, id);
        batch.delete(docRef);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error deleting compras batch:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de compras
   */
  async getStats(organizationId: string, storeId?: string) {
    try {
      const compras = await this.getByOrganizationAndStore(organizationId, storeId);
      
      const totalCompras = compras.length;
      const pendientes = compras.filter(c => c.estado === 'pendiente').length;
      const pagadas = compras.filter(c => c.estado === 'pagado').length;
      
      const today = new Date();
      const vencidas = compras.filter(c => 
        c.estado === 'pendiente' && c.fechaVencimiento.toDate() < today
      ).length;

      const montoTotal = compras.reduce((sum, c) => sum + c.total, 0);
      const montoPendiente = compras
        .filter(c => c.estado === 'pendiente')
        .reduce((sum, c) => sum + c.total, 0);

      return {
        totalCompras,
        pendientes,
        pagadas,
        vencidas,
        montoTotal,
        montoPendiente,
      };
    } catch (error) {
      console.error('Error getting compras stats:', error);
      throw error;
    }
  }
}

export const compraService = new CompraService();