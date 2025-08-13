// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { AuthContextType, UserProfile, Organization, Store } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [userStores, setUserStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔐 Auth state changed:', user?.email || 'No user');
      
      if (user) {
        setUser(user);
        setProfileLoading(true);
        await loadUserDataWithRetry(user.uid);
      } else {
        setUser(null);
        setUserProfile(null);
        setOrganization(null);
        setUserStores([]);
      }
      setLoading(false);
      setProfileLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadUserDataWithRetry = async (uid: string, maxRetries = 5, delay = 1000) => {
    console.log(`👤 Intentando cargar datos del usuario ${uid}...`);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📋 Intento ${attempt}/${maxRetries}`);
        
        // Cargar perfil del usuario
        const userDoc = await getDoc(doc(db, 'users', uid));
        
        if (userDoc.exists()) {
          const userData = { uid, ...userDoc.data() } as UserProfile;
          console.log('✅ Perfil de usuario cargado:', userData.displayName);
          setUserProfile(userData);

          // Cargar organización
          if (userData.organizationId) {
            await loadOrganizationData(userData.organizationId);
            
            // Cargar tiendas
            await loadUserStores(userData);
          }
          
          return; // Éxito, salir del bucle
        } else {
          console.log(`⏳ Intento ${attempt}: Perfil no encontrado, reintentando...`);
          
          if (attempt === maxRetries) {
            console.error('❌ No se pudo cargar el perfil después de varios intentos');
            throw new Error('No se encontró el perfil del usuario');
          }
          
          // Esperar antes del siguiente intento
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        console.error(`❌ Error en intento ${attempt}:`, error);
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Esperar antes del siguiente intento
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  const loadOrganizationData = async (organizationId: string) => {
    try {
      console.log('🏢 Cargando organización:', organizationId);
      const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
      
      if (orgDoc.exists()) {
        const orgData = { id: orgDoc.id, ...orgDoc.data() } as Organization;
        console.log('✅ Organización cargada:', orgData.name);
        setOrganization(orgData);
      } else {
        console.warn('⚠️ Organización no encontrada');
      }
    } catch (error) {
      console.error('❌ Error cargando organización:', error);
    }
  };

  const loadUserStores = async (userData: UserProfile) => {
    try {
      console.log('🏪 Cargando tiendas...');
      
      if (userData.storeAccess && userData.storeAccess.length > 0) {
        const storesQuery = query(
          collection(db, 'stores'),
          where('organizationId', '==', userData.organizationId)
        );
        const storesSnapshot = await getDocs(storesQuery);
        const allStores = storesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Store[];

        // Filtrar solo las tiendas a las que tiene acceso
        const accessibleStores = allStores.filter(store => 
          userData.storeAccess.includes(store.id) || 
          userData.permissions.multitienda
        );
        
        console.log(`✅ ${accessibleStores.length} tiendas cargadas`);
        setUserStores(accessibleStores);
      }
    } catch (error) {
      console.error('❌ Error cargando tiendas:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('🔑 Iniciando sesión:', email);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('❌ Error signing in:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log('👋 Cerrando sesión');
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('❌ Error signing out:', error);
      throw error;
    }
  };

  const hasPermission = (permission: keyof UserProfile['permissions']): boolean => {
    if (!userProfile) return false;
    return userProfile.permissions[permission] || false;
  };

  const canAccessStore = (storeId: string): boolean => {
    if (!userProfile) return false;
    return userProfile.permissions.multitienda || userProfile.storeAccess.includes(storeId);
  };

  const value: AuthContextType = {
    user,
    userProfile,
    organization,
    userStores,
    loading: loading || profileLoading,
    signIn,
    signOut,
    hasPermission,
    canAccessStore
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};