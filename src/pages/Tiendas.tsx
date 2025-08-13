// src/pages/Tiendas.tsx
import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const Tiendas: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Gestión de Tiendas
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1">
            Módulo en desarrollo. Aquí podrás gestionar las tiendas de la organización.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Tiendas;