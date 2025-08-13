// src/components/layout/MainLayout.tsx
import React, { useState } from 'react';
import { PointOfSale } from '@mui/icons-material'; // Agregar esta importación

import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Store as StoreIcon,
  People,
  ShoppingCart,
  Payment,
  Assessment,
  Settings,
  AccountCircle,
  Logout,
  Business,
  PointOfSaleRounded,    // ← NUEVO
  Launch as LaunchIcon  // ← NUEVO
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserProfile } from '../../types';

const drawerWidth = 280;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, organization, userStores, signOut, hasPermission } = useAuth();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedStore, setSelectedStore] = useState<string>('all');

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
    handleClose();
  };

  const handleStoreChange = (event: SelectChangeEvent) => {
    setSelectedStore(event.target.value);
  };

  const navigationItems = [
    {
      text: 'Dashboard',
      icon: <Dashboard />,
      path: '/dashboard',
      permission: null,
    },
    {
      text: 'Punto de Venta',  // ← NUEVO ITEM
      icon: <PointOfSaleRounded />,
      path: '/pos',
      permission: null, // Sin permisos especiales
      openInNewTab: true, // ← NUEVA PROPIEDAD
    },
    {
      text: 'Proveedores',
      icon: <Business />,
      path: '/proveedores',
      permission: 'proveedores' as keyof UserProfile['permissions'],
    },
    {
      text: 'Compras',
      icon: <ShoppingCart />,
      path: '/compras',
      permission: 'proveedores' as keyof UserProfile['permissions'],
    },
    {
      text: 'Pagos',
      icon: <Payment />,
      path: '/pagos',
      permission: 'proveedores' as keyof UserProfile['permissions'],
    },
    {
      text: 'Tiendas',
      icon: <StoreIcon />,
      path: '/tiendas',
      permission: 'multitienda' as keyof UserProfile['permissions'],
    },
    {
      text: 'Usuarios',
      icon: <People />,
      path: '/usuarios',
      permission: 'configuracion' as keyof UserProfile['permissions'],
    },
    {
      text: 'Reportes',
      icon: <Assessment />,
      path: '/reportes',
      permission: 'reportes' as keyof UserProfile['permissions'],
    },
    {
      text: 'Configuración',
      icon: <Settings />,
      path: '/configuracion',
      permission: 'configuracion' as keyof UserProfile['permissions'],
    },
  ];

  const filteredNavigationItems = navigationItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  const drawer = (
    <Box>
      {/* Logo y nombre */}
      <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
        <StoreIcon sx={{ fontSize: 40, mb: 1 }} />
        <Typography variant="h5" component="h1" fontWeight="bold">
          TiendaPro
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.9 }}>
          {organization?.name}
        </Typography>
      </Box>

      <Divider />

      {/* Selector de tienda */}
      {userStores.length > 1 && (
        <Box sx={{ p: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Tienda</InputLabel>
            <Select
              value={selectedStore}
              label="Tienda"
              onChange={handleStoreChange}
            >
              <MenuItem value="all">Todas las tiendas</MenuItem>
              {userStores.map((store) => (
                <MenuItem key={store.id} value={store.id}>
                  {store.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      <Divider />

      {/* Navegación */}
      <List>
        {filteredNavigationItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: 'primary.main',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? 'inherit' : 'text.secondary',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      {/* Información del usuario */}
      <Box sx={{ p: 2, mt: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Avatar sx={{ width: 32, height: 32 }}>
            {userProfile?.displayName?.[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" noWrap>
              {userProfile?.displayName}
            </Typography>
            <Chip
              label={userProfile?.role}
              size="small"
              variant="outlined"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {navigationItems.find(item => item.path === location.pathname)?.text || 'TiendaPro'}
          </Typography>

          {/* Selector de tienda en mobile */}
          {userStores.length > 1 && (
            <Box sx={{ display: { xs: 'block', sm: 'none' }, mr: 2 }}>
              <FormControl size="small">
                <Select
                  value={selectedStore}
                  onChange={handleStoreChange}
                  sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'white' } }}
                >
                  <MenuItem value="all">Todas</MenuItem>
                  {userStores.map((store) => (
                    <MenuItem key={store.id} value={store.id}>
                      {store.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          {/* Menú de usuario */}
          <div>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={() => navigate('/perfil')}>
                <AccountCircle sx={{ mr: 1 }} />
                Mi Perfil
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1 }} />
                Cerrar Sesión
              </MenuItem>
            </Menu>
          </div>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;