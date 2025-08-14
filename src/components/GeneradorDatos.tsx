// src/components/GeneradorDatos.tsx
import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Paper
} from '@mui/material';
import { DataUsage, Warning } from '@mui/icons-material';
import { useSnackbar } from 'notistack';

import { useAuth } from '../contexts/AuthContext';
import { generarDatosPrueba } from '../utils/generarDatosPrueba';

const GeneradorDatos: React.FC = () => {
  const { userProfile, userStores } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [resultado, setResultado] = useState<any>(null);

  const handleGenerar = async () => {
    if (!userProfile?.organizationId || userStores.length === 0) {
      enqueueSnackbar('No se encontró información de organización o tiendas', { variant: 'error' });
      return;
    }

    setLoading(true);
    setProgress(0);
    setLogs([]);
    setResultado(null);

    // Simulación de progreso
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 10;
      });
    }, 500);

    try {
      const storeId = userStores[0].id; // Usar la primera tienda
      
      const result = await generarDatosPrueba(
        userProfile.organizationId,
        storeId,
        userProfile.uid || 'admin',
        (mensaje: string) => {
          setLogs(prev => [...prev, mensaje]);
        }
      );

      setProgress(100);
      setResultado(result);
      
      if (result.success) {
        enqueueSnackbar('¡Datos de prueba generados exitosamente!', { variant: 'success' });
      } else {
        enqueueSnackbar('Error al generar datos de prueba', { variant: 'error' });
      }
      
    } catch (error) {
      console.error('Error generando datos:', error);
      enqueueSnackbar('Error inesperado al generar datos', { variant: 'error' });
      setLogs(prev => [...prev, `❌ Error: ${error}`]);
    } finally {
      setLoading(false);
      clearInterval(progressInterval);
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<DataUsage />}
        onClick={() => setOpen(true)}
        color="secondary"
      >
        Generar Datos de Prueba
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <DataUsage sx={{ mr: 1 }} />
            Generador de Datos de Prueba
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Box display="flex" alignItems="center">
              <Warning sx={{ mr: 1 }} />
              <Typography variant="body2">
                Esta acción creará datos ficticios en tu base de datos. Se recomienda usar solo en entornos de desarrollo o testing.
              </Typography>
            </Box>
          </Alert>

          <Typography variant="body1" gutterBottom>
            Se generarán los siguientes datos de prueba:
          </Typography>
          
          <Box sx={{ pl: 2, mb: 3 }}>
            <Typography variant="body2">• 20 proveedores con información completa</Typography>
            <Typography variant="body2">• 50 compras distribuidas en los últimos 3 meses</Typography>
            <Typography variant="body2">• 40 pagos asociados a las compras</Typography>
            <Typography variant="body2">• Datos realistas con diferentes estados y métodos de pago</Typography>
          </Box>

          {userStores.length > 0 && (
            <Alert severity="info" sx={{ mb: 3 }}>
              Los datos se crearán para la tienda: <strong>{userStores[0].name}</strong>
            </Alert>
          )}

          {loading && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" gutterBottom>
                Progreso: {Math.round(progress)}%
              </Typography>
              <LinearProgress variant="determinate" value={progress} />
            </Box>
          )}

          {logs.length > 0 && (
            <Paper sx={{ p: 2, maxHeight: 300, overflow: 'auto', bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" gutterBottom>
                Log de generación:
              </Typography>
              <List dense>
                {logs.map((log, index) => (
                  <ListItem key={index} sx={{ py: 0 }}>
                    <ListItemText 
                      primary={log}
                      primaryTypographyProps={{ 
                        variant: 'body2',
                        fontFamily: 'monospace',
                        fontSize: '0.8rem'
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

          {resultado && (
            <Box sx={{ mt: 2 }}>
              {resultado.success ? (
                <Alert severity="success">
                  <Typography variant="body2">
                    ¡Datos generados exitosamente!
                  </Typography>
                  <Typography variant="body2">
                    • Proveedores: {resultado.proveedores}
                  </Typography>
                  <Typography variant="body2">
                    • Compras: {resultado.compras}
                  </Typography>
                  <Typography variant="body2">
                    • Pagos: {resultado.pagos}
                  </Typography>
                </Alert>
              ) : (
                <Alert severity="error">
                  <Typography variant="body2">
                    Error: {resultado.error}
                  </Typography>
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={loading}>
            {resultado ? 'Cerrar' : 'Cancelar'}
          </Button>
          <Button 
            onClick={handleGenerar} 
            variant="contained" 
            disabled={loading || !userProfile?.organizationId || userStores.length === 0}
            color="secondary"
          >
            {loading ? 'Generando...' : 'Generar Datos'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GeneradorDatos;