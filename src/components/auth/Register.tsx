// src/components/auth/Register.tsx
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
  Stepper,
  Step,
  StepLabel,
  Grid,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { Store as StoreIcon } from '@mui/icons-material';
import { auth } from '../../config/firebase';
import { registrationService } from '../../services/registration';

const steps = ['Información del Usuario', 'Datos de la Organización', 'Primera Tienda'];

const schema = yup.object({
  // Datos del usuario
  displayName: yup
    .string()
    .required('El nombre es requerido')
    .min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: yup
    .string()
    .email('Ingrese un email válido')
    .required('El email es requerido'),
  password: yup
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .required('La contraseña es requerida'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Las contraseñas deben coincidir')
    .required('Confirme la contraseña'),
  
  // Datos de la organización
  organizationName: yup
    .string()
    .required('El nombre de la organización es requerido')
    .min(2, 'Debe tener al menos 2 caracteres'),
  
  // Datos de la tienda
  storeName: yup
    .string()
    .required('El nombre de la tienda es requerido')
    .min(2, 'Debe tener al menos 2 caracteres'),
  storeAddress: yup
    .string()
    .required('La dirección es requerida'),
  storePhone: yup
    .string()
    .required('El teléfono es requerido')
    .matches(/^[0-9+\-\s()]+$/, 'Ingrese un teléfono válido'),
  storeEmail: yup
    .string()
    .email('Ingrese un email válido')
    .optional(),
});

interface RegisterFormData {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
  organizationName: string;
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeEmail?: string;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  const {
    control,
    handleSubmit,
    formState: { errors },
    trigger,
    getValues,
  } = useForm<RegisterFormData>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
      organizationName: '',
      storeName: '',
      storeAddress: '',
      storePhone: '',
      storeEmail: '',
    },
  });

  const handleNext = async () => {
    let fieldsToValidate: (keyof RegisterFormData)[] = [];
    
    switch (activeStep) {
      case 0:
        fieldsToValidate = ['displayName', 'email', 'password', 'confirmPassword'];
        break;
      case 1:
        fieldsToValidate = ['organizationName'];
        break;
      case 2:
        fieldsToValidate = ['storeName', 'storeAddress', 'storePhone'];
        break;
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      if (activeStep === steps.length - 1) {
        await onSubmit(getValues());
      } else {
        setActiveStep((prevStep) => prevStep + 1);
      }
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    setError(null);

    let userCredential: any = null;

    try {
      // 1. Crear usuario en Firebase Auth
      userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const user = userCredential.user;

      // 2. Esperar un momento para que Firebase Auth procese completamente
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3. Crear organización, usuario y tienda
      await registrationService.createCompleteSetup({
        user: {
          uid: user.uid,
          email: data.email,
          displayName: data.displayName,
        },
        organization: {
          name: data.organizationName,
        },
        store: {
          name: data.storeName,
          address: data.storeAddress,
          phone: data.storePhone,
          email: data.storeEmail || '',
        },
      });

      // 4. Redirigir al dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Si hay un error después de crear el usuario, intentar limpiar
      if (userCredential?.user) {
        try {
          await registrationService.cleanupFailedRegistration(userCredential.user.uid);
          await deleteUser(userCredential.user);
        } catch (cleanupError) {
          console.error('Error during cleanup:', cleanupError);
        }
      }
      
      // Manejar diferentes tipos de errores
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            setError('Este email ya está registrado. Intenta con otro email o inicia sesión.');
            setActiveStep(0); // Volver al primer paso
            break;
          case 'auth/weak-password':
            setError('La contraseña es muy débil. Debe tener al menos 6 caracteres.');
            setActiveStep(0);
            break;
          case 'auth/invalid-email':
            setError('El formato del email no es válido.');
            setActiveStep(0);
            break;
          case 'auth/operation-not-allowed':
            setError('El registro con email/contraseña no está habilitado. Contacta al soporte.');
            break;
          case 'permission-denied':
          case 'insufficient-permissions':
            setError('Error de permisos. Por favor, intenta nuevamente en unos minutos.');
            break;
          default:
            setError(`Error durante el registro: ${error.message || 'Error desconocido'}`);
        }
      } else {
        setError('Error al crear la cuenta. Por favor, intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Controller
                name="displayName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Nombre completo"
                    error={!!errors.displayName}
                    helperText={errors.displayName?.message}
                    disabled={loading}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Email"
                    type="email"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    disabled={loading}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Contraseña"
                    type="password"
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    disabled={loading}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="confirmPassword"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Confirmar contraseña"
                    type="password"
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword?.message}
                    disabled={loading}
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Controller
                name="organizationName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Nombre de la organización/empresa"
                    placeholder="Ej: Abarrotes Don Juan"
                    error={!!errors.organizationName}
                    helperText={errors.organizationName?.message || 'Este será el nombre principal de tu negocio'}
                    disabled={loading}
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Controller
                name="storeName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Nombre de la tienda"
                    placeholder="Ej: Sucursal Centro"
                    error={!!errors.storeName}
                    helperText={errors.storeName?.message}
                    disabled={loading}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="storeAddress"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Dirección de la tienda"
                    multiline
                    rows={2}
                    error={!!errors.storeAddress}
                    helperText={errors.storeAddress?.message}
                    disabled={loading}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="storePhone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Teléfono de la tienda"
                    placeholder="644-123-4567"
                    error={!!errors.storePhone}
                    helperText={errors.storePhone?.message}
                    disabled={loading}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="storeEmail"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Email de la tienda (opcional)"
                    type="email"
                    error={!!errors.storeEmail}
                    helperText={errors.storeEmail?.message}
                    disabled={loading}
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Container component="main" maxWidth="md">
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
              Crea tu cuenta y empieza a gestionar tu negocio
            </Typography>
          </Box>

          {/* Stepper */}
          <Box sx={{ p: 4 }}>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Form Content */}
            <Box sx={{ mb: 4 }}>
              {renderStepContent(activeStep)}
            </Box>

            {/* Navigation Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                disabled={activeStep === 0 || loading}
                onClick={handleBack}
                variant="outlined"
              >
                Anterior
              </Button>
              
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={loading}
                sx={{ minWidth: 120 }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : activeStep === steps.length - 1 ? (
                  'Crear Cuenta'
                ) : (
                  'Siguiente'
                )}
              </Button>
            </Box>

            {/* Login Link */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                ¿Ya tienes una cuenta?{' '}
                <Button
                  component={Link}
                  to="/login"
                  variant="text"
                  size="small"
                  disabled={loading}
                  sx={{ textTransform: 'none' }}
                >
                  Iniciar sesión
                </Button>
              </Typography>
            </Box>
          </Box>
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

export default Register;