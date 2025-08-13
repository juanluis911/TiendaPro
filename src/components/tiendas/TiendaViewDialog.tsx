// src/components/tiendas/TiendaViewDialog.tsx
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Close as CloseIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  CalendarToday as CalendarIcon,
  Check as CheckIcon,
  Close as InactiveIcon,
} from '@mui/icons-material';
import { Store, UserProfile } from '../../types';
import { formatDate } from '../../services/firebase';

const DIAS_SEMANA_LABELS: Record<string, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

interface TiendaViewDialogProps {
  open: boolean;
  onClose: () => void;
  tienda: Store | null;
  manager?: UserProfile;
}

const TiendaViewDialog: React.FC<TiendaViewDialogProps> = ({
  open,
  onClose,
  tienda,
  manager,
}) => {
  if (!tienda) return null;

  const formatBusinessDays = (days: string[]) => {
    return days.map(day => DIAS_SEMANA_LABELS[day] || day).join(', ');
  };

  const getStatusColor = (active: boolean) => {
    return active ? 'success' : 'error';
  };

  const getStatusIcon = (active: boolean) => {
    return active ? <CheckIcon /> : <InactiveIcon />;
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <BusinessIcon color="primary" />
          <Box>
            <Typography variant="h6" component="div">
              {tienda.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Información detallada de la tienda
            </Typography>
          </Box>
          <Box sx={{ ml: 'auto' }}>
            <Chip
              icon={getStatusIcon(tienda.active)}
              label={tienda.active ? 'Activa' : 'Inactiva'}
              color={getStatusColor(tienda.active)}
              variant="outlined"
            />
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Información básica */}
          <Grid item xs={12}>
            <Paper elevation={1} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Información Básica
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <BusinessIcon color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Nombre"
                    secondary={tienda.name}
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <LocationIcon color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Dirección"
                    secondary={tienda.address}
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <PhoneIcon color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Teléfono"
                    secondary={tienda.phone}
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <EmailIcon color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email"
                    secondary={tienda.email}
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>

          {/* Encargado */}
          <Grid item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Encargado
              </Typography>
              
              {manager ? (
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <PersonIcon color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary={manager.displayName}
                      secondary={`${manager.email} • ${manager.role}`}
                    />
                  </ListItem>
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No se encontró información del encargado
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Configuración */}
          <Grid item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Configuración
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <MoneyIcon color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Moneda"
                    secondary={tienda.config.currency}
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <ScheduleIcon color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Zona Horaria"
                    secondary={tienda.config.timezone}
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>

          {/* Horarios de operación */}
          <Grid item xs={12}>
            <Paper elevation={1} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Horarios de Operación
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <ScheduleIcon color="action" fontSize="small" />
                    <Typography variant="body2" fontWeight="medium">
                      Horario:
                    </Typography>
                    <Typography variant="body2">
                      {tienda.config.businessHours.open} - {tienda.config.businessHours.close}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="flex-start" gap={1}>
                    <CalendarIcon color="action" fontSize="small" sx={{ mt: 0.5 }} />
                    <Box>
                      <Typography variant="body2" fontWeight="medium" gutterBottom>
                        Días de operación:
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatBusinessDays(tienda.config.businessHours.days)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Información de auditoría */}
          <Grid item xs={12}>
            <Paper elevation={1} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Información del Sistema
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Fecha de creación:
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(tienda.createdAt)}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    ID de la tienda:
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {tienda.id}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onClose}
          startIcon={<CloseIcon />}
          variant="outlined"
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TiendaViewDialog;