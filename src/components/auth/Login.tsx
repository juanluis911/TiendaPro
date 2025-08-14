// src/components/auth/Login.tsx
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Paper,
  Divider,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import { Store as StoreIcon } from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // ← AGREGAR useNavigate y useLocation

const schema = yup.object({
  email: yup
    .string()
    .email('Ingrese un email válido')
    .required('El email es requerido'),
  password: yup
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .required('La contraseña es requerida'),
});

interface LoginFormData {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate(); // ← AGREGAR
  const location = useLocation(); // ← AGREGAR
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError(null);

    try {
      await signIn(data.email, data.password);
      
      // ← AGREGAR REDIRECCIÓN DESPUÉS DEL LOGIN EXITOSO
      // Obtener la página desde donde vino (si existe) o ir al dashboard por defecto
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
      
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Manejar diferentes tipos de errores de Firebase
      switch (error.code) {
        case 'auth/user-not-found':
          setError('No se encontró una cuenta con este email');
          break;
        case 'auth/wrong-password':
          setError('Contraseña incorrecta');
          break;
        case 'auth/invalid-email':
          setError('Email inválido');
          break;
        case 'auth/user-disabled':
          setError('Esta cuenta ha sido deshabilitada');
          break;
        case 'auth/too-many-requests':
          setError('Demasiados intentos fallidos. Intente más tarde');
          break;
        default:
          setError('Error al iniciar sesión. Verifique sus credenciales');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={8}
          sx={{
            width: '100%',
            maxWidth: 450,
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              p: 4,
              textAlign: 'center',
            }}
          >
            <StoreIcon sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h4" component="h1" fontWeight="bold">
              TiendaPro
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              Sistema de Gestión Multi-Tienda
            </Typography>
          </Box>

          {/* Form */}
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom textAlign="center">
              Iniciar Sesión
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box
              component="form"
              onSubmit={handleSubmit(onSubmit)}
              sx={{ mt: 2 }}
            >
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Email"
                    type="email"
                    autoComplete="email"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    sx={{ mb: 2 }}
                    disabled={loading}
                  />
                )}
              />

              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Contraseña"
                    type="password"
                    autoComplete="current-password"
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    sx={{ mb: 3 }}
                    disabled={loading}
                  />
                )}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  mb: 2,
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </Box>

            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                o
              </Typography>
            </Divider>

            {/* Registro */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                ¿No tienes una cuenta?
              </Typography>
              <Button
                component={Link}
                to="/register"
                variant="outlined"
                fullWidth
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  fontSize: '1.1rem',
                  textTransform: 'none',
                }}
              >
                Crear cuenta gratuita
              </Button>
            </Box>
          </CardContent>
        </Paper>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 4, textAlign: 'center' }}
        >
          © 2024 TiendaPro. Todos los derechos reservados.
        </Typography>
      </Box>
    </Container>
  );
};

export default Login;