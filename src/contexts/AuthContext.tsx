// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        await loadUserData(user.uid);
      } else {
        setUser(null);
        setUserProfile(null);
        setOrganization(null);
        setUserStores([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadUserData = async (uid: string) => {
    try {
      // Cargar perfil del usuario
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = { uid, ...userDoc.data() } as UserProfile;
        setUserProfile(userData);

        // Cargar organización
        if (userData.organizationId) {
          const orgDoc = await getDoc(doc(db, 'organizations', userData.organizationId));
          if (orgDoc.exists()) {
            const orgData = { id: orgDoc.id, ...orgDoc.data() } as Organization;
            setOrganization(orgData);
          }

          // Cargar tiendas a las que tiene acceso
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
            setUserStores(accessibleStores);
          }
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
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
    loading,
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