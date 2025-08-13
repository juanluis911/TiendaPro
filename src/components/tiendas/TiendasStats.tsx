// src/components/tiendas/TiendasStats.tsx
import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Store as StoreIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { Store, UserProfile } from '../../types';

interface TiendasStatsProps {
  tiendas: Store[];
  usuarios: UserProfile[];
}

const TiendasStats: React.FC<TiendasStatsProps> = ({ tiendas, usuarios }) => {
  // Calcular estadísticas
  const totalTiendas = tiendas.length;
  const tiendasActivas = tiendas.filter(t => t.active).length;
  const tiendasInactivas = tiendas.filter(t => !t.active).length;
  
  // Contar managers únicos
  const managersUnicos = new Set(tiendas.map(t => t.manager)).size;
  
  // Encontrar tiendas sin manager asignado
  const tiendasSinManager = tiendas.filter(tienda => {
    const manager = usuarios.find(u => u.uid === tienda.manager);
    return !manager || !manager.active;
  }).length;

  const stats = [
    {
      title: 'Total de Tiendas',
      value: totalTiendas,
      icon: <StoreIcon />,
      color: 'primary',
      description: 'Tiendas registradas',
    },
    {
      title: 'Tiendas Activas',
      value: tiendasActivas,
      icon: <ActiveIcon />,
      color: 'success',
      description: 'En operación',
    },
    {
      title: 'Tiendas Inactivas',
      value: tiendasInactivas,
      icon: <InactiveIcon />,
      color: 'error',
      description: 'Suspendidas o cerradas',
    },
    {
      title: 'Encargados',
      value: managersUnicos,
      icon: <PeopleIcon />,
      color: 'info',
      description: 'Managers asignados',
    },
  ];

  return (
    <Box sx={{ mb: 4 }}>
      <Grid container spacing={3}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar
                    sx={{
                      bgcolor: `${stat.color}.main`,
                      width: 48,
                      height: 48,
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="h4" fontWeight="bold">
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {stat.description}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Alertas adicionales */}
      {tiendasSinManager > 0 && (
        <Box sx={{ mt: 2 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <BusinessIcon color="warning" />
                <Box>
                  <Typography variant="body2" fontWeight="medium" color="warning.main">
                    Atención: {tiendasSinManager} tienda(s) sin encargado válido
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Revisa que todas las tiendas tengan un encargado activo asignado
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default TiendasStats;