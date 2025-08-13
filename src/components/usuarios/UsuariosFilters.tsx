// src/components/usuarios/UsuariosFilters.tsx
import React from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  InputAdornment,
  Box,
  Chip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { UsuarioFilters } from '../../pages/Usuarios';
import { Store } from '../../types';

interface UsuariosFiltrosProps {
  filters: UsuarioFilters;
  stores: Store[];
  onFiltersChange: (filters: UsuarioFilters) => void;
  onClearFilters: () => void;
}

const roleOptions = [
  { value: '', label: 'Todos los roles' },
  { value: 'owner', label: 'Propietario' },
  { value: 'admin', label: 'Administrador' },
  { value: 'manager', label: 'Gerente' },
  { value: 'empleado', label: 'Empleado' },
  { value: 'vendedor', label: 'Vendedor' },
];

const statusOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
];

const UsuariosFilters: React.FC<UsuariosFiltrosProps> = ({
  filters,
  stores,
  onFiltersChange,
  onClearFilters,
}) => {
  const handleFilterChange = (field: keyof UsuarioFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.busqueda) count++;
    if (filters.role) count++;
    if (filters.status) count++;
    if (filters.storeAccess) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Box>
      <Grid container spacing={2} alignItems="center">
        {/* Búsqueda */}
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Buscar usuarios"
            placeholder="Nombre, email..."
            value={filters.busqueda}
            onChange={(e) => handleFilterChange('busqueda', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Filtro por rol */}
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth>
            <InputLabel>Rol</InputLabel>
            <Select
              value={filters.role}
              label="Rol"
              onChange={(e) => handleFilterChange('role', e.target.value)}
            >
              {roleOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Filtro por estado */}
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth>
            <InputLabel>Estado</InputLabel>
            <Select
              value={filters.status}
              label="Estado"
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Filtro por tienda */}
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <InputLabel>Tienda</InputLabel>
            <Select
              value={filters.storeAccess}
              label="Tienda"
              onChange={(e) => handleFilterChange('storeAccess', e.target.value)}
            >
              <MenuItem value="">Todas las tiendas</MenuItem>
              {stores.filter(store => store.active).map((store) => (
                <MenuItem key={store.id} value={store.id}>
                  {store.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Botón limpiar filtros */}
        <Grid item xs={12} sm={6} md={2}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={onClearFilters}
            disabled={activeFiltersCount === 0}
          >
            Limpiar
          </Button>
        </Grid>
      </Grid>

      {/* Mostrar filtros activos */}
      {activeFiltersCount > 0 && (
        <Box mt={2} display="flex" flexWrap="wrap" gap={1}>
          <Box display="flex" alignItems="center" gap={1} mr={2}>
            <strong>Filtros activos:</strong>
          </Box>
          
          {filters.busqueda && (
            <Chip
              label={`Búsqueda: "${filters.busqueda}"`}
              onDelete={() => handleFilterChange('busqueda', '')}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
          
          {filters.role && (
            <Chip
              label={`Rol: ${roleOptions.find(r => r.value === filters.role)?.label}`}
              onDelete={() => handleFilterChange('role', '')}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
          
          {filters.status && (
            <Chip
              label={`Estado: ${statusOptions.find(s => s.value === filters.status)?.label}`}
              onDelete={() => handleFilterChange('status', '')}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
          
          {filters.storeAccess && (
            <Chip
              label={`Tienda: ${stores.find(s => s.id === filters.storeAccess)?.name}`}
              onDelete={() => handleFilterChange('storeAccess', '')}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
        </Box>
      )}
    </Box>
  );
};

export default UsuariosFilters;