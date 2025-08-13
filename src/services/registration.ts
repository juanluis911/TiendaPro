// src/services/registration.ts - Con delay para permitir propagación
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db, auth } from '../config/firebase';
import { Organization, Store, UserProfile } from '../types';

interface RegistrationData {
  user: {
    uid: string;
    email: string;
    displayName: string;
  };
  organization: {
    name: string;
  };
  store: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}

class RegistrationService {
  async createCompleteSetup(data: RegistrationData): Promise<void> {
    const { user, organization, store } = data;
    
    try {
      console.log('🚀 Iniciando proceso de registro para:', user.email);

      // 1. Actualizar el perfil del usuario en Firebase Auth
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: user.displayName,
        });
        console.log('✅ Perfil de Auth actualizado');
      }

      // 2. Preparar IDs
      const organizationId = `org_${user.uid}`;
      const storeId = `store_${user.uid}_1`;

      // 3. Crear organización primero
      console.log('📋 Creando organización...');
      const organizationData: Omit<Organization, 'id'> = {
        name: organization.name,
        plan: 'free',
        maxStores: 3,
        maxUsers: 5,
        features: {
          proveedores: true,
          inventario: false,
          ventas: false,
          reportes: true,
          multitienda: true,
        },
        owner: user.uid,
        active: true,
        createdAt: serverTimestamp() as any,
        subscription: {
          status: 'active',
          currentPeriodEnd: this.getTimestampFromDays(30),
          plan: 'free',
        },
      };

      await setDoc(doc(db, 'organizations', organizationId), organizationData);
      console.log('✅ Organización creada');

      // Pequeño delay para asegurar consistencia
      await this.delay(500);

      // 4. Crear perfil de usuario
      console.log('👤 Creando perfil de usuario...');
      const userProfileData: Omit<UserProfile, 'uid'> = {
        email: user.email,
        displayName: user.displayName,
        organizationId,
        role: 'owner',
        storeAccess: [storeId],
        permissions: {
          proveedores: true,
          inventario: false,
          ventas: false,
          reportes: true,
          configuracion: true,
          multitienda: true,
        },
        active: true,
        createdAt: serverTimestamp() as any,
        createdBy: user.uid,
      };

      await setDoc(doc(db, 'users', user.uid), userProfileData);
      console.log('✅ Perfil de usuario creado');

      // Otro pequeño delay
      await this.delay(500);

      // 5. Crear primera tienda
      console.log('🏪 Creando primera tienda...');
      const storeData: Omit<Store, 'id'> = {
        organizationId,
        name: store.name,
        address: store.address,
        phone: store.phone,
        email: store.email,
        manager: user.uid,
        active: true,
        config: {
          currency: 'MXN',
          timezone: 'America/Hermosillo',
          businessHours: {
            open: '08:00',
            close: '20:00',
            days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
          },
        },
        createdAt: serverTimestamp() as any,
        createdBy: user.uid,
      };

      await setDoc(doc(db, 'stores', storeId), storeData);
      console.log('✅ Tienda creada');

      // Delay final para asegurar que todo esté propagado
      console.log('⏳ Esperando a que Firestore propague los cambios...');
      await this.delay(1500);

      console.log('🎉 Setup completo creado exitosamente');
    } catch (error) {
      console.error('💥 Error creating complete setup:', error);
      
      // Mejorar el manejo de errores
      if (error instanceof Error) {
        // Si el error es de permisos, dar un mensaje más claro
        if (error.message.includes('Missing or insufficient permissions')) {
          throw new Error('Error de configuración. Las reglas de Firestore necesitan ser actualizadas. Contacta al administrador.');
        }
        throw new Error(`Error al configurar la cuenta: ${error.message}`);
      }
      throw error;
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getTimestampFromDays(days: number): any {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }

  // Función simplificada para limpiar en caso de error
  async cleanupFailedRegistration(uid: string): Promise<void> {
    try {
      console.log('🧹 Intentando limpiar registro fallido...');
      console.log('🧹 Cleanup no implementado para evitar errores adicionales');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

export const registrationService = new RegistrationService();