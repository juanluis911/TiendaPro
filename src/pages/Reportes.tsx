// src/pages/Reportes.tsx
import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const Reportes: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Reportes y Analytics
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1">
            Módulo en desarrollo. Aquí podrás generar reportes y ver analytics del negocio.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Reportes;