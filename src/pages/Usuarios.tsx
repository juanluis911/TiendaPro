// src/pages/Usuarios.tsx
import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const Usuarios: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Gestión de Usuarios
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1">
            Módulo en desarrollo. Aquí podrás gestionar los usuarios del sistema.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Usuarios;