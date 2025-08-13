// src/pages/Compras.tsx
import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

export const Compras: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Gestión de Compras
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1">
            Módulo en desarrollo. Aquí podrás registrar y gestionar todas las compras.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Compras;