// src/pages/Configuracion.tsx
import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const Configuracion: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Configuración del Sistema
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1">
            Módulo en desarrollo. Aquí podrás configurar los parámetros del sistema.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Configuracion;