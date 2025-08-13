// src/pages/PagosPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Breadcrumbs,
  Link,
  Fade,
  Alert,
  CircularProgress,
  Backdrop,
  Chip
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Payment as PaymentIcon,
  List as ListIcon,
  Home as HomeIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
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

const PagosPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const location = useLocation();

  const [tabValue, setTabValue] = useState(0);
  const [pageLoading, setPageLoading] = useState(true);

  // Verificar permisos y cargar datos iniciales
  useEffect(() => {
    const checkPermissions = async () => {
      if (authLoading) return;

      if (!user) {
        navigate('/login');
        return;
      }

      // Verificar si el usuario tiene permisos para acceder a pagos
      if (!user.permissions?.pagos) {
        enqueueSnackbar('No tienes permisos para acceder al módulo de pagos', { 
          variant: 'error' 
        });
        navigate('/dashboard');
        return;
      }

      // Verificar si tiene acceso a alguna tienda
      if (!user.storeAccess || user.storeAccess.length === 0) {
        enqueueSnackbar('No tienes acceso a ninguna tienda', { 
          variant: 'warning' 
        });
      }

      setPageLoading(false);
    };

    checkPermissions();
  }, [user, authLoading, navigate, enqueueSnackbar]);

  // Obtener pestaña inicial de la URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    
    switch (tab) {
      case 'dashboard':
        setTabValue(0);
        break;
      case 'lista':
        setTabValue(1);
        break;
      case 'reportes':
        setTabValue(2);
        break;
      default:
        setTabValue(0);
    }
  }, [location.search]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // Actualizar URL
    const tabNames = ['dashboard', 'lista', 'reportes'];
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('tab', tabNames[newValue]);
    navigate({
      pathname: location.pathname,
      search: searchParams.toString()
    }, { replace: true });
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

  // Mostrar loading mientras se verifican permisos
  if (authLoading || pageLoading) {
    return (
      <Backdrop open={true} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress color="inherit" />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Cargando módulo de pagos...
          </Typography>
        </Box>
      </Backdrop>
    );
  }

  // Si no hay usuario o no tiene permisos, no renderizar nada (ya se redirigió)
  if (!user || !user.permissions?.pagos) {
    return null;
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
          <Link
            underline="hover"
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            color="inherit"
            onClick={() => navigate('/dashboard')}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Inicio
          </Link>
          <Typography
            sx={{ display: 'flex', alignItems: 'center' }}
            color="text.primary"
          >
            <PaymentIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Pagos
          </Typography>
        </Breadcrumbs>

        {/* Alerta si no hay acceso a tiendas */}
        {(!user.storeAccess || user.storeAccess.length === 0) && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              No tienes acceso a ninguna tienda. Contacta al administrador para obtener los permisos necesarios.
            </Typography>
          </Alert>
        )}

        {/* Header de la página */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Gestión de Pagos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Administra los pagos a proveedores, consulta el historial y mantén el control financiero de tu negocio.
          </Typography>
          
          {/* Información del usuario y tienda actual */}
          <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip
              label={`Usuario: ${user.displayName || user.email}`}
              variant="outlined"
              size="small"
            />
            <Chip
              label={`Rol: ${user.role?.toUpperCase()}`}
              variant="outlined"
              size="small"
              color="primary"
            />
            {user.storeAccess && user.storeAccess.length > 0 && (
              <Chip
                label={`Tiendas: ${user.storeAccess.length}`}
                variant="outlined"
                size="small"
                color="success"
              />
            )}
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
          {user.storeAccess && user.storeAccess.length > 0 ? (
            <PagosDashboard onVerTodosPagos={handleVerTodosPagos} />
          ) : (
            <Alert severity="info">
              <Typography variant="body1">
                Para acceder al dashboard de pagos, necesitas tener acceso a al menos una tienda.
              </Typography>
            </Alert>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {user.storeAccess && user.storeAccess.length > 0 ? (
            <PagosList />
          ) : (
            <Alert severity="info">
              <Typography variant="body1">
                Para ver la lista de pagos, necesitas tener acceso a al menos una tienda.
              </Typography>
            </Alert>
          )}
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
    </Container>
  );
};

export default PagosPage;