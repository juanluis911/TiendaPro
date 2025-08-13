// src/pages/Pagos.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Fade,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  List as ListIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

import { useAuth } from '../contexts/AuthContext';
import PagosDashboard from '../components/pagos/PagosDashboard';
import PagosList from '../components/pagos/PagosList';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`pagos-tabpanel-${index}`}
      aria-labelledby={`pagos-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Fade in={value === index} timeout={300}>
          <Box>
            {children}
          </Box>
        </Fade>
      )}
    </div>
  );
};

const Pagos: React.FC = () => {
  const { userProfile, hasPermission } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);

  // Verificar permisos al cargar
  useEffect(() => {
    const checkPermissions = () => {
      if (!userProfile) return;

      // Verificar si tiene permisos para pagos
      if (!hasPermission('proveedores')) {
        enqueueSnackbar('No tienes permisos para acceder al módulo de pagos', { 
          variant: 'error' 
        });
      }

      setLoading(false);
    };

    checkPermissions();
  }, [userProfile, hasPermission, enqueueSnackbar]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleVerTodosPagos = () => {
    setTabValue(1); // Cambiar a la pestaña de lista
  };

  const a11yProps = (index: number) => {
    return {
      id: `pagos-tab-${index}`,
      'aria-controls': `pagos-tabpanel-${index}`,
    };
  };

  // Mostrar loading
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Si no tiene permisos, mostrar mensaje
  if (!hasPermission('proveedores')) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <Typography variant="body1">
            No tienes permisos para acceder al módulo de pagos. 
            Contacta al administrador para obtener los permisos necesarios.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header de la página */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Gestión de Pagos
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Administra los pagos a proveedores, consulta el historial y mantén el control financiero de tu negocio.
        </Typography>
        
        {/* Información del usuario actual */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={`Usuario: ${userProfile?.displayName || userProfile?.email || 'N/A'}`}
            variant="outlined"
            size="small"
          />
          <Chip
            label={`Rol: ${userProfile?.role?.toUpperCase() || 'N/A'}`}
            variant="outlined"
            size="small"
            color="primary"
          />
        </Box>
      </Box>

      {/* Navegación por pestañas */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 64,
              fontWeight: 500
            }
          }}
        >
          <Tab
            icon={<DashboardIcon />}
            label="Dashboard"
            iconPosition="start"
            {...a11yProps(0)}
            sx={{
              '& .MuiTab-iconWrapper': {
                marginBottom: '0 !important',
                marginRight: 1
              }
            }}
          />
          <Tab
            icon={<ListIcon />}
            label="Lista de Pagos"
            iconPosition="start"
            {...a11yProps(1)}
            sx={{
              '& .MuiTab-iconWrapper': {
                marginBottom: '0 !important',
                marginRight: 1
              }
            }}
          />
          <Tab
            icon={<AnalyticsIcon />}
            label="Reportes"
            iconPosition="start"
            {...a11yProps(2)}
            sx={{
              '& .MuiTab-iconWrapper': {
                marginBottom: '0 !important',
                marginRight: 1
              }
            }}
          />
        </Tabs>
      </Paper>

      {/* Contenido de las pestañas */}
      <TabPanel value={tabValue} index={0}>
        <PagosDashboard onVerTodosPagos={handleVerTodosPagos} />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <PagosList />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: 400,
          textAlign: 'center'
        }}>
          <AnalyticsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom color="text.secondary">
            Reportes de Pagos
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Esta funcionalidad estará disponible próximamente.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Los reportes avanzados incluirán:
          </Typography>
          <Box component="ul" sx={{ textAlign: 'left', color: 'text.secondary', mt: 1 }}>
            <li>Análisis de tendencias de pago</li>
            <li>Reportes por proveedor y período</li>
            <li>Exportación a PDF y Excel</li>
            <li>Gráficos de flujo de efectivo</li>
            <li>Comparativas entre tiendas</li>
          </Box>
        </Box>
      </TabPanel>
    </Box>
  );
};

export default Pagos;