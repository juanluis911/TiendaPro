// src/components/debug/UserProfileDebug.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { ExpandMore, Refresh, PersonSearch } from '@mui/icons-material';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { UserProfile, Organization, Store } from '../../types';

const UserProfileDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkUserProfile = async () => {
    if (!auth.currentUser) {
      setError('No hay usuario autenticado');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const uid = auth.currentUser.uid;
      console.log('🔍 Debugging user:', uid);

      // Verificar perfil de usuario
      const userDoc = await getDoc(doc(db, 'users', uid));
      const userExists = userDoc.exists();
      const userData = userExists ? userDoc.data() as UserProfile : null;

      // Verificar organización si existe
      let orgData = null;
      if (userData?.organizationId) {
        const orgDoc = await getDoc(doc(db, 'organizations', userData.organizationId));
        orgData = orgDoc.exists() ? orgDoc.data() as Organization : null;
      }

      // Verificar tiendas si existen
      let storeData = null;
      if (userData?.storeAccess && userData.storeAccess.length > 0) {
        const storeDoc = await getDoc(doc(db, 'stores', userData.storeAccess[0]));
        storeData = storeDoc.exists() ? storeDoc.data() as Store : null;
      }

      setDebugInfo({
        auth: {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          displayName: auth.currentUser.displayName,
          emailVerified: auth.currentUser.emailVerified,
        },
        userProfile: {
          exists: userExists,
          data: userData,
        },
        organization: {
          exists: !!orgData,
          data: orgData,
        },
        store: {
          exists: !!storeData,
          data: storeData,
        },
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.error('Error checking profile:', error);
      setError(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth.currentUser) {
      checkUserProfile();
    }
  }, []);

  const renderJson = (obj: any) => (
    <Paper sx={{ p: 2, bgcolor: 'grey.100', maxHeight: 300, overflow: 'auto' }}>
      <pre style={{ margin: 0, fontSize: '0.8rem' }}>
        {JSON.stringify(obj, null, 2)}
      </pre>
    </Paper>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        🔍 Debug: Perfil de Usuario
      </Typography>

      <Box display="flex" gap={2} mb={3}>
        <Button
          variant="contained"
          startIcon={<PersonSearch />}
          onClick={checkUserProfile}
          disabled={loading}
        >
          Verificar Perfil
        </Button>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={() => window.location.reload()}
        >
          Recargar Página
        </Button>
      </Box>

      {loading && (
        <Box display="flex" justifyContent="center" my={3}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {debugInfo && (
        <Box>
          {/* Resumen rápido */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 Resumen Rápido
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Verificado: {debugInfo.timestamp}
              </Typography>
              
              <Box display="flex" gap={2} flexWrap="wrap" mt={2}>
                <Alert 
                  severity={debugInfo.auth?.uid ? 'success' : 'error'} 
                  variant="outlined"
                  sx={{ minWidth: 200 }}
                >
                  Auth: {debugInfo.auth?.uid ? '✅ OK' : '❌ Error'}
                </Alert>
                
                <Alert 
                  severity={debugInfo.userProfile?.exists ? 'success' : 'error'} 
                  variant="outlined"
                  sx={{ minWidth: 200 }}
                >
                  Perfil: {debugInfo.userProfile?.exists ? '✅ Existe' : '❌ No existe'}
                </Alert>
                
                <Alert 
                  severity={debugInfo.organization?.exists ? 'success' : 'warning'} 
                  variant="outlined"
                  sx={{ minWidth: 200 }}
                >
                  Organización: {debugInfo.organization?.exists ? '✅ Existe' : '⚠️ No existe'}
                </Alert>
                
                <Alert 
                  severity={debugInfo.store?.exists ? 'success' : 'warning'} 
                  variant="outlined"
                  sx={{ minWidth: 200 }}
                >
                  Tienda: {debugInfo.store?.exists ? '✅ Existe' : '⚠️ No existe'}
                </Alert>
              </Box>
            </CardContent>
          </Card>

          {/* Detalles expandibles */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography>🔐 Firebase Auth</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {renderJson(debugInfo.auth)}
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography>👤 Perfil de Usuario (Firestore)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {renderJson(debugInfo.userProfile)}
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography>🏢 Organización</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {renderJson(debugInfo.organization)}
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography>🏪 Tienda</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {renderJson(debugInfo.store)}
            </AccordionDetails>
          </Accordion>
        </Box>
      )}

      {/* Instrucciones */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          💡 Si el perfil no existe:
        </Typography>
        <Typography variant="body2">
          1. Verifica que las reglas de Firestore estén desplegadas<br/>
          2. Revisa la consola del navegador para errores<br/>
          3. Intenta registrarte nuevamente<br/>
          4. Si persiste, verifica la configuración de Firebase
        </Typography>
      </Alert>
    </Box>
  );
};

export default UserProfileDebug;