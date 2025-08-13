// src/services/pagoService.ts
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
  writeBatch,
  startAt,
  endAt,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Pago, PagoFormData, PagoConDetalles, PagoResumen } from '../types/pagos';
import { Compra } from '../types/compras';
import { Proveedor } from '../types/proveedores';

class PagoService {
  private collectionName = 'pagos';

  /**
   * Obtener todos los pagos de una organización y tienda específica
   */
  async getByOrganizationAndStore(organizationId: string, storeId?: string): Promise<Pago[]> {
    try {
      let q = query(
        collection(db, this.collectionName),
        where('organizationId', '==', organizationId),
        orderBy('fechaPago', 'desc'),
        limit(100)
      );

      if (storeId) {
        q = query(
          collection(db, this.collectionName),
          where('organizationId', '==', organizationId),
          where('storeId', '==', storeId),
          orderBy('fechaPago', 'desc'),
          limit(100)
        );
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Pago));
    } catch (error) {
      console.error('Error getting pagos:', error);
      throw error;
    }
  }

  /**
   * Obtener pagos con información detallada de compras y proveedores
   */
  async getWithDetails(organizationId: string, storeId?: string): Promise<PagoConDetalles[]> {
    try {
      const pagos = await this.getByOrganizationAndStore(organizationId, storeId);
      const pagosConDetalles: PagoConDetalles[] = [];

      for (const pago of pagos) {
        // Obtener información de la compra
        const compraDoc = await getDoc(doc(db, 'compras', pago.compraId));
        const compraData = compraDoc.data() as Compra;

        // Obtener información del proveedor
        const proveedorDoc = await getDoc(doc(db, 'proveedores', pago.proveedorId));
        const proveedorData = proveedorDoc.data() as Proveedor;

        // Calcular total pagado para esta compra
        const totalPagado = await this.getTotalPaidForCompra(pago.compraId);
        const montoPendiente = compraData.total - totalPagado;

        pagosConDetalles.push({
          ...pago,
          compraInfo: {
            numeroFactura: compraData.numeroFactura,
            total: compraData.total,
            fechaCompra: compraData.fechaCompra,
            estado: compraData.estado
          },
          proveedorInfo: {
            nombre: proveedorData.nombre,
            telefono: proveedorData.telefono,
            email: proveedorData.email
          },
          montoPendiente,
          totalPagado
        });
      }

      return pagosConDetalles;
    } catch (error) {
      console.error('Error getting pagos with details:', error);
      throw error;
    }
  }

  /**
   * Obtener pagos por compra específica
   */
  async getByCompra(compraId: string): Promise<Pago[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('compraId', '==', compraId),
        orderBy('fechaPago', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Pago));
    } catch (error) {
      console.error('Error getting pagos by compra:', error);
      throw error;
    }
  }

  /**
   * Obtener pagos por proveedor
   */
  async getByProveedor(proveedorId: string): Promise<Pago[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('proveedorId', '==', proveedorId),
        orderBy('fechaPago', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Pago));
    } catch (error) {
      console.error('Error getting pagos by proveedor:', error);
      throw error;
    }
  }

  /**
   * Obtener pagos por rango de fechas
   */
  async getByDateRange(
    organizationId: string, 
    startDate: Date, 
    endDate: Date,
    storeId?: string
  ): Promise<Pago[]> {
    try {
      const startTimestamp = Timestamp.fromDate(startDate);
      const endTimestamp = Timestamp.fromDate(endDate);

      let q = query(
        collection(db, this.collectionName),
        where('organizationId', '==', organizationId),
        where('fechaPago', '>=', startTimestamp),
        where('fechaPago', '<=', endTimestamp),
        orderBy('fechaPago', 'desc')
      );

      if (storeId) {
        q = query(
          collection(db, this.collectionName),
          where('organizationId', '==', organizationId),
          where('storeId', '==', storeId),
          where('fechaPago', '>=', startTimestamp),
          where('fechaPago', '<=', endTimestamp),
          orderBy('fechaPago', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Pago));
    } catch (error) {
      console.error('Error getting pagos by date range:', error);
      throw error;
    }
  }

  /**
   * Obtener un pago por ID
   */
  async getById(id: string): Promise<Pago | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Pago;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting pago:', error);
      throw error;
    }
  }

  /**
   * Crear un nuevo pago
   */
  async create(pagoData: Omit<Pago, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...pagoData,
        createdAt: Timestamp.now()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating pago:', error);
      throw error;
    }
  }

  /**
   * Crear pago y actualizar estado de compra automáticamente
   */
  async createPagoAndUpdateCompra(
    pagoData: Omit<Pago, 'id'>, 
    compraTotal: number
  ): Promise<string> {
    try {
      const batch = writeBatch(db);

      // Crear el pago
      const pagoRef = doc(collection(db, this.collectionName));
      batch.set(pagoRef, {
        ...pagoData,
        createdAt: Timestamp.now()
      });

      // Calcular total pagado después de este pago
      const totalPagadoAnterior = await this.getTotalPaidForCompra(pagoData.compraId);
      const totalPagadoNuevo = totalPagadoAnterior + pagoData.monto;

      // Determinar nuevo estado de la compra
      let nuevoEstado: 'pendiente' | 'pagado' | 'parcial';
      if (totalPagadoNuevo >= compraTotal) {
        nuevoEstado = 'pagado';
      } else if (totalPagadoNuevo > 0) {
        nuevoEstado = 'parcial';
      } else {
        nuevoEstado = 'pendiente';
      }

      // Actualizar estado de la compra
      const compraRef = doc(db, 'compras', pagoData.compraId);
      batch.update(compraRef, { 
        estado: nuevoEstado,
        updatedAt: Timestamp.now()
      });

      await batch.commit();
      return pagoRef.id;
    } catch (error) {
      console.error('Error creating pago and updating compra:', error);
      throw error;
    }
  }

  /**
   * Actualizar un pago
   */
  async update(id: string, pagoData: Partial<Pago>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        ...pagoData,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating pago:', error);
      throw error;
    }
  }

  /**
   * Eliminar un pago
   */
  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting pago:', error);
      throw error;
    }
  }

  /**
   * Calcular total pagado para una compra específica
   */
  async getTotalPaidForCompra(compraId: string): Promise<number> {
    try {
      const pagos = await this.getByCompra(compraId);
      return pagos.reduce((total, pago) => total + pago.monto, 0);
    } catch (error) {
      console.error('Error calculating total paid:', error);
      throw error;
    }
  }

  /**
   * Obtener resumen de pagos
   */
  async getResumen(organizationId: string, storeId?: string): Promise<PagoResumen> {
    try {
      // Obtener pagos del último año
      const fechaInicio = new Date();
      fechaInicio.setFullYear(fechaInicio.getFullYear() - 1);
      
      const pagos = await this.getByDateRange(organizationId, fechaInicio, new Date(), storeId);

      // Calcular total de pagos
      const totalPagos = pagos.reduce((sum, pago) => sum + pago.monto, 0);

      // Calcular pagos por método
      const pagosPorMetodo = pagos.reduce((acc, pago) => {
        acc[pago.metodoPago] = (acc[pago.metodoPago] || 0) + pago.monto;
        return acc;
      }, {} as Record<string, number>);

      // Pagos del mes actual
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);
      
      const pagosDelMes = pagos
        .filter(pago => pago.fechaPago.toDate() >= inicioMes)
        .reduce((sum, pago) => sum + pago.monto, 0);

      // Promedio mensual (últimos 12 meses)
      const promedioMensual = totalPagos / 12;

      return {
        totalPagos,
        pagosPorMetodo: {
          efectivo: pagosPorMetodo.efectivo || 0,
          transferencia: pagosPorMetodo.transferencia || 0,
          cheque: pagosPorMetodo.cheque || 0,
          tarjeta: pagosPorMetodo.tarjeta || 0
        },
        pagosDelMes,
        promedioMensual
      };
    } catch (error) {
      console.error('Error getting resumen pagos:', error);
      throw error;
    }
  }

  /**
   * Buscar pagos por referencia o notas
   */
  async searchByText(
    organizationId: string, 
    searchTerm: string, 
    storeId?: string
  ): Promise<Pago[]> {
    try {
      const pagos = await this.getByOrganizationAndStore(organizationId, storeId);
      
      return pagos.filter(pago => 
        (pago.referencia?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (pago.notas?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    } catch (error) {
      console.error('Error searching pagos:', error);
      throw error;
    }
  }
}

export default new PagoService();