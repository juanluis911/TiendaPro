// src/pages/Landing.tsx (Opcional - para mostrar antes del login/registro)
import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Paper,
  Chip,
} from '@mui/material';
import {
  Store as StoreIcon,
  People,
  Assessment,
  ShoppingCart,
  CheckCircle,
  Business,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    icon: <Business />,
    title: 'Gestión de Proveedores',
    description: 'Controla todos tus proveedores, compras y pagos en un solo lugar.',
  },
  {
    icon: <ShoppingCart />,
    title: 'Control de Inventario',
    description: 'Mantén tu inventario actualizado y controla entradas y salidas.',
  },
  {
    icon: <Assessment />,
    title: 'Reportes Inteligentes',
    description: 'Genera reportes detallados para tomar mejores decisiones.',
  },
  {
    icon: <People />,
    title: 'Multi-Usuario',
    description: 'Colabora con tu equipo con roles y permisos personalizados.',
  },
];

const benefits = [
  'Registro gratuito sin tarjeta de crédito',
  'Hasta 3 tiendas en el plan gratuito',
  'Soporte técnico incluido',
  'Datos seguros en la nube',
  'Acceso desde cualquier dispositivo',
  'Actualizaciones automáticas',
];

const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box>
      {/* Header */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 2 }}>
        <Container>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={2}>
              <StoreIcon sx={{ fontSize: 32 }} />
              <Typography variant="h5" fontWeight="bold">
                TiendaPro
              </Typography>
            </Box>
            <Box gap={2} display="flex">
              <Button 
                color="inherit" 
                variant="outlined"
                onClick={() => navigate('/login')}
              >
                Iniciar Sesión
              </Button>
              <Button 
                color="inherit" 
                variant="contained"
                sx={{ bgcolor: 'white', color: 'primary.main' }}
                onClick={() => navigate('/register')}
              >
                Empezar Gratis
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box sx={{ bgcolor: 'background.default', py: 8 }}>
        <Container>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Chip 
                label="✨ Nuevo" 
                color="primary" 
                sx={{ mb: 2 }}
              />
              <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
                El sistema perfecto para tu{' '}
                <Box component="span" color="primary.main">
                  abarrote o frutería
                </Box>
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                Gestiona proveedores, inventario, ventas y reportes desde una sola plataforma. 
                Diseñado especialmente para negocios familiares que quieren crecer.
              </Typography>
              
              <Box display="flex" gap={2} flexWrap="wrap">
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/register')}
                  sx={{ px: 4, py: 1.5 }}
                >
                  Empezar Gratis Ahora
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/login')}
                  sx={{ px: 4, py: 1.5 }}
                >
                  Ver Demo
                </Button>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                🚀 Sin compromisos • ⚡ Configuración en 5 minutos • 💯 Gratis para siempre
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper 
                elevation={8} 
                sx={{ 
                  p: 4, 
                  bgcolor: 'primary.main', 
                  color: 'white',
                  textAlign: 'center',
                  borderRadius: 4
                }}
              >
                <StoreIcon sx={{ fontSize: 80, mb: 2 }} />
                <Typography variant="h4" gutterBottom>
                  Dashboard Intuitivo
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Ve todas tus métricas importantes en tiempo real
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container sx={{ py: 8 }}>
        <Typography variant="h3" textAlign="center" gutterBottom fontWeight="bold">
          Todo lo que necesitas para tu negocio
        </Typography>
        <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
          Funcionalidades diseñadas para abarrotes, fruterías y negocios similares
        </Typography>
        
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                <CardContent>
                  <Box
                    sx={{
                      backgroundColor: 'primary.light',
                      borderRadius: '50%',
                      width: 60,
                      height: 60,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                      color: 'white',
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Benefits Section */}
      <Box sx={{ bgcolor: 'background.default', py: 8 }}>
        <Container>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h3" gutterBottom fontWeight="bold">
                ¿Por qué elegir TiendaPro?
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                Nos enfocamos en hacer tu vida más fácil con herramientas simples pero poderosas.
              </Typography>
              
              <Grid container spacing={2}>
                {benefits.map((benefit, index) => (
                  <Grid item xs={12} key={index}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <CheckCircle color="success" />
                      <Typography variant="body1">{benefit}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h4" color="primary" gutterBottom fontWeight="bold">
                  Plan Gratuito
                </Typography>
                <Typography variant="h2" gutterBottom>
                  $0
                  <Typography component="span" variant="h6" color="text.secondary">
                    /mes
                  </Typography>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Para siempre • Sin tarjeta de crédito
                </Typography>
                
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={() => navigate('/register')}
                  sx={{ py: 1.5, mb: 2 }}
                >
                  Crear Cuenta Gratis
                </Button>
                
                <Typography variant="body2" color="text.secondary">
                  ¿Ya tienes cuenta?{' '}
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => navigate('/login')}
                  >
                    Iniciar sesión
                  </Button>
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: 'primary.dark', color: 'white', py: 4 }}>
        <Container>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <StoreIcon />
                <Typography variant="h6" fontWeight="bold">
                  TiendaPro
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                El sistema de gestión diseñado especialmente para abarrotes, 
                fruterías y negocios familiares.
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="body2" textAlign={{ xs: 'left', md: 'right' }}>
                © 2024 TiendaPro. Todos los derechos reservados.
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default Landing;