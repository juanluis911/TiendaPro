import React from 'react';
import {
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  Button,
  Box,
  Typography,
  Collapse,
  IconButton,
  Chip,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandLess,
  ExpandMore,
  Search as SearchIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { CompraFilters, ESTADOS_COMPRA } from '../../types/compras';
import { Proveedor } from '../../types';

interface ComprasFiltersProps {
  filters: CompraFilters;
  onFiltersChange: (filters: CompraFilters) => void;
  proveedores: Proveedor[];
  showFilters: boolean;
  onToggleFilters: () => void;
}

const ComprasFilters: React.FC<ComprasFiltersProps> = ({
  filters,
  onFiltersChange,
  proveedores,
  showFilters,
  onToggleFilters,
}) => {
  const handleFilterChange = (field: keyof CompraFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      proveedor: '',
      estado: '',
      fechaDesde: null,
      fechaHasta: null,
      busqueda: '',
    });
  };

  const hasActiveFilters = () => {
    return filters.proveedor || 
           filters.estado || 
           filters.fechaDesde || 
           filters.fechaHasta || 
           filters.busqueda;
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.proveedor) count++;
    if (filters.estado) count++;
    if (filters.fechaDesde) count++;
    if (filters.fechaHasta) count++;
    if (filters.busqueda) count++;
    return count;
  };

  const getProveedorNombre = (proveedorId: string) => {
    const proveedor = proveedores.find(p => p.id === proveedorId);
    return proveedor?.nombre || '';
  };

  const getEstadoLabel = (estadoValue: string) => {
    const estado = ESTADOS_COMPRA.find(e => e.value === estadoValue);
    return estado?.label || '';
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <FilterIcon color="primary" />
            <Typography variant="h6" color="primary">
              Filtros y Búsqueda
            </Typography>
            {hasActiveFilters() && (
              <Chip
                label={`${getActiveFiltersCount()} filtro${getActiveFiltersCount() !== 1 ? 's' : ''} activo${getActiveFiltersCount() !== 1 ? 's' : ''}`}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            {hasActiveFilters() && (
              <Button
                size="small"
                startIcon={<ClearIcon />}
                onClick={clearFilters}
                variant="outlined"
                color="error"
              >
                Limpiar
              </Button>
            )}
            <IconButton onClick={onToggleFilters}>
              {showFilters ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        </Box>

        {/* Búsqueda rápida - siempre visible */}
        <TextField
          fullWidth
          label="Buscar por factura o producto..."
          variant="outlined"
          value={filters.busqueda}
          onChange={(e) => handleFilterChange('busqueda', e.target.value)}
          placeholder="Ej: FAC-001, manzanas, naranjas..."
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
          }}
          sx={{ mb: 2 }}
        />

        {/* Filtros activos - chips informativos */}
        {hasActiveFilters() && (
          <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
            {filters.proveedor && (
              <Chip
                label={`Proveedor: ${getProveedorNombre(filters.proveedor)}`}
                onDelete={() => handleFilterChange('proveedor', '')}
                color="primary"
                variant="outlined"
                size="small"
              />
            )}
            {filters.estado && (
              <Chip
                label={`Estado: ${getEstadoLabel(filters.estado)}`}
                onDelete={() => handleFilterChange('estado', '')}
                color="primary"
                variant="outlined"
                size="small"
              />
            )}
            {filters.fechaDesde && (
              <Chip
                label={`Desde: ${filters.fechaDesde.format('DD/MM/YYYY')}`}
                onDelete={() => handleFilterChange('fechaDesde', null)}
                color="primary"
                variant="outlined"
                size="small"
              />
            )}
            {filters.fechaHasta && (
              <Chip
                label={`Hasta: ${filters.fechaHasta.format('DD/MM/YYYY')}`}
                onDelete={() => handleFilterChange('fechaHasta', null)}
                color="primary"
                variant="outlined"
                size="small"
              />
            )}
          </Box>
        )}

        {/* Filtros expandibles */}
        <Collapse in={showFilters}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="Proveedor"
                value={filters.proveedor}
                onChange={(e) => handleFilterChange('proveedor', e.target.value)}
                helperText="Filtrar por proveedor específico"
              >
                <MenuItem value="">
                  <em>Todos los proveedores</em>
                </MenuItem>
                {proveedores.map((proveedor) => (
                  <MenuItem key={proveedor.id} value={proveedor.id}>
                    {proveedor.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="Estado"
                value={filters.estado}
                onChange={(e) => handleFilterChange('estado', e.target.value)}
                helperText="Filtrar por estado de pago"
              >
                <MenuItem value="">
                  <em>Todos los estados</em>
                </MenuItem>
                {ESTADOS_COMPRA.map((estado) => (
                  <MenuItem key={estado.value} value={estado.value}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: `${estado.color}.main`,
                        }}
                      />
                      {estado.label}
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Fecha desde"
                value={filters.fechaDesde}
                onChange={(value) => handleFilterChange('fechaDesde', value)}
                format="DD/MM/YYYY"
                maxDate={filters.fechaHasta || undefined}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    helperText: 'Fecha de compra desde',
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Fecha hasta"
                value={filters.fechaHasta}
                onChange={(value) => handleFilterChange('fechaHasta', value)}
                format="DD/MM/YYYY"
                minDate={filters.fechaDesde || undefined}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    helperText: 'Fecha de compra hasta',
                  },
                }}
              />
            </Grid>

            {/* Filtros rápidos */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Filtros rápidos:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                <Button
                  size="small"
                  variant={filters.estado === 'pendiente' ? 'contained' : 'outlined'}
                  color="warning"
                  onClick={() => handleFilterChange('estado', filters.estado === 'pendiente' ? '' : 'pendiente')}
                >
                  Pendientes
                </Button>
                <Button
                  size="small"
                  variant={filters.estado === 'vencido' ? 'contained' : 'outlined'}
                  color="error"
                  onClick={() => handleFilterChange('estado', filters.estado === 'vencido' ? '' : 'vencido')}
                >
                  Vencidas
                </Button>
                <Button
                  size="small"
                  variant={filters.estado === 'pagado' ? 'contained' : 'outlined'}
                  color="success"
                  onClick={() => handleFilterChange('estado', filters.estado === 'pagado' ? '' : 'pagado')}
                >
                  Pagadas
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default ComprasFilters;