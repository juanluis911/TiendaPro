// src/pages/Pagos.tsx
import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const Pagos: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Control de Pagos
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1">
            Módulo en desarrollo. Aquí podrás registrar y controlar todos los pagos.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Pagos;