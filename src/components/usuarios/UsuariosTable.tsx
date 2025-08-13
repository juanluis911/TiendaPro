
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Avatar,
  Box,
  Typography,
  Skeleton,
  Tooltip,
  TablePagination,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as ManagerIcon,
  Work as EmpleadoIcon,
  PointOfSale as VendedorIcon,
  Store as StoreIcon,
} from '@mui/icons-material';
import { UserProfile, Store } from '../../types';
import { formatDate } from '../../services/firebase';

interface UsuariosTableProps {
  usuarios: UserProfile[];
  stores: Store[];
  loading: boolean;
  onEdit: (usuario: UserProfile) => void;
  onView: (usuario: UserProfile) => void;
  onToggleStatus: (usuario: UserProfile) => void;
  onDelete: (usuario: UserProfile) => void;
  onMenuClick: (event: React.MouseEvent<HTMLElement>, usuario: UserProfile) => void;
  getStoreNames: (storeIds: string[]) => string[];
}

const roleIcons = {
  owner: <AdminIcon />,
  admin: <AdminIcon />,
  manager: <ManagerIcon />,
  empleado: <EmpleadoIcon />,
  vendedor: <VendedorIcon />,
};

const roleColors = {
  owner: 'error' as const,
  admin: 'warning' as const,
  manager: 'info' as const,
  empleado: 'primary' as const,
  vendedor: 'success' as const,
};

const roleLabels = {
  owner: 'Propietario',
  admin: 'Administrador',
  manager: 'Gerente',
  empleado: 'Empleado',
  vendedor: 'Vendedor',
};

const UsuariosTable: React.FC<UsuariosTableProps> = ({
  usuarios = [], // 🔥 VALOR POR DEFECTO
  stores = [], // 🔥 VALOR POR DEFECTO
  loading,
  onEdit,
  onView,
  onToggleStatus,
  onDelete,
  onMenuClick,
  getStoreNames,
}) => {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 🔥 PROTECCIÓN CONTRA UNDEFINED
  const safeUsuarios = Array.isArray(usuarios) ? usuarios : [];
  const paginatedUsuarios = safeUsuarios.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading) {
    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Usuario</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Tiendas</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Creado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Skeleton variant="circular" width={40} height={40} />
                    <Skeleton variant="text" width={120} />
                  </Box>
                </TableCell>
                <TableCell><Skeleton variant="text" width={180} /></TableCell>
                <TableCell><Skeleton variant="rectangular" width={80} height={24} /></TableCell>
                <TableCell><Skeleton variant="text" width={100} /></TableCell>
                <TableCell><Skeleton variant="rectangular" width={70} height={24} /></TableCell>
                <TableCell><Skeleton variant="text" width={80} /></TableCell>
                <TableCell><Skeleton variant="circular" width={40} height={40} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  if (safeUsuarios.length === 0) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        py={8}
        gap={2}
      >
        <PersonIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
        <Typography variant="h6" color="text.secondary">
          No hay usuarios registrados
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Comienza creando tu primer usuario del sistema
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Usuario</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Tiendas de Acceso</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Fecha de Creación</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedUsuarios.map((usuario) => {
              // 🔥 PROTECCIÓN TOTAL CONTRA UNDEFINED
              const storeIds = usuario?.storeAccess || [];
              const storeNames = getStoreNames ? getStoreNames(storeIds) : [];
              const safeStoreNames = Array.isArray(storeNames) ? storeNames : [];
              
              return (
                <TableRow 
                  key={usuario?.uid || `user-${Math.random()}`} 
                  hover
                  sx={{ 
                    cursor: 'pointer',
                    opacity: usuario?.active ? 1 : 0.6 
                  }}
                  onClick={() => usuario && onView(usuario)}
                >
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar 
                        sx={{ 
                          width: 40, 
                          height: 40,
                          bgcolor: usuario?.role ? roleColors[usuario.role] || 'primary.main' : 'grey.400'
                        }}
                      >
                        {usuario?.displayName ? usuario.displayName.charAt(0).toUpperCase() : 'U'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {usuario?.displayName || 'Sin nombre'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {usuario?.uid ? usuario.uid.slice(-8) : 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {usuario?.email || 'Sin email'}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      icon={usuario?.role ? roleIcons[usuario.role] || <PersonIcon /> : <PersonIcon />}
                      label={usuario?.role ? roleLabels[usuario.role] || usuario.role : 'Sin rol'}
                      color={usuario?.role ? roleColors[usuario.role] || 'default' : 'default'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {safeStoreNames && safeStoreNames.length > 0 ? (
                        // 🔥 PROTECCIÓN CONTRA EL SLICE ERROR
                        <>
                          {safeStoreNames.slice(0, 2).map((storeName, index) => (
                            <Chip
                              key={index}
                              icon={<StoreIcon />}
                              label={storeName || 'Tienda sin nombre'}
                              size="small"
                              variant="outlined"
                              color="default"
                            />
                          ))}
                          {safeStoreNames.length > 2 && (
                            <Tooltip 
                              title={safeStoreNames.slice(2).join(', ') || 'Tiendas adicionales'}
                              arrow
                            >
                              <Chip
                                label={`+${safeStoreNames.length - 2}`}
                                size="small"
                                variant="outlined"
                                color="primary"
                              />
                            </Tooltip>
                          )}
                        </>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Sin acceso
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      label={usuario?.active ? 'Activo' : 'Inactivo'}
                      color={usuario?.active ? 'success' : 'default'}
                      size="small"
                      variant={usuario?.active ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {usuario?.createdAt ? formatDate(usuario.createdAt) : 'Sin fecha'}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="right">
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        if (usuario) onMenuClick(e, usuario);
                      }}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={safeUsuarios.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
        }
      />
    </>
  );
};

export default UsuariosTable;