// src/components/common/Layout.tsx - Stile Odoo con Responsive Mobile
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  IconButton,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Container,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  DirectionsCar as CarIcon,
  Receipt as ReceiptIcon,
  DocumentScanner as DocumentIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  Build as BuildIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  AccountCircle as AccountCircleIcon,
  Settings as SettingsIcon,
  Home as HomeIcon,
  MiscellaneousServices as ServicesIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const drawerWidth = 250;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  // Hook per responsive design
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State - drawer chiuso per default su mobile
  const [open, setOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  // Effect per gestire il cambio di breakpoint
  useEffect(() => {
    setOpen(!isMobile);
  }, [isMobile]);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  // Chiudi automaticamente il drawer su mobile dopo la navigazione
  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) {
      setOpen(false);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    handleMenuClose();
  };

  const menuItems = [
    { 
      text: 'Dashboard', 
      icon: <DashboardIcon />, 
      path: '/',
      description: 'Panoramica generale'
    },
    { 
      text: 'Autoveicoli', 
      icon: <CarIcon />, 
      path: '/autoveicoli',
      description: 'Gestione veicoli aziendali'
    },
    {
      text: 'Autisti',
      icon: <CarIcon />,
      path: '/autisti',
      description: 'Gestione Autisti'
    },
    { 
      text: 'Servizi', 
      icon: <ServicesIcon />, 
      path: '/servizi',
      description: 'Gestione servizi'
    },
    { 
      text: 'Albo Gestori', 
      icon: <ReceiptIcon />, 
      path: '/albo-gestori',
      description: 'Autorizzazioni ambientali'
    },
    { 
      text: 'REN', 
      icon: <DocumentIcon />, 
      path: '/ren',
      description: 'Registro Elettronico Nazionale'
    },
    { 
      text: 'Manutenzioni', 
      icon: <BuildIcon />, 
      path: '/manutenzioni',
      description: 'Gestione manutenzioni'
    },
    { 
      text: 'Dashboard Manutenzioni', 
      icon: <AssessmentIcon />, 
      path: '/manutenzioni/dashboard',
      description: 'Statistiche manutenzioni'
    },
    ...(user?.ruolo === 'admin' ? [
      { 
        text: 'Gestione Utenti', 
        icon: <PeopleIcon />, 
        path: '/users',
        description: 'Amministrazione utenti'
      }
    ] : [])
  ];

  const isSelected = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname === path;
  };

  const getInitials = (nome: string, cognome: string) => {
    return `${nome?.charAt(0) || ''}${cognome?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* AppBar in stile Odoo - Responsive */}
      <AppBar
        position="fixed"
        sx={{
          width: (open && !isMobile) ? `calc(100% - ${drawerWidth}px)` : '100%',
          ml: (open && !isMobile) ? `${drawerWidth}px` : 0,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: '#714B67',
        }}
      >
        <Toolbar 
          sx={{ 
            minHeight: { xs: '56px', md: '48px' }, // Standard mobile height
            paddingX: { xs: 1, md: 2 }, // Padding responsive
          }}
        >
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2,
              minWidth: '44px', // Touch target minimo
              minHeight: '44px',
            }}
          >
            {(open && !isMobile) ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
          
          <HomeIcon sx={{ mr: 1, display: { xs: 'none', sm: 'block' } }} />
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1, 
              fontSize: { xs: '14px', md: '16px' },
              display: { xs: 'none', sm: 'block' }
            }}
          >
            Gestione Mezzi
          </Typography>

          {/* Titolo abbreviato per mobile */}
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1, 
              fontSize: '14px',
              display: { xs: 'block', sm: 'none' }
            }}
          >
            Mezzi
          </Typography>

          {/* User menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={user?.ruolo || 'User'}
              size="small"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                fontSize: '11px',
                display: { xs: 'none', sm: 'inline-flex' }, // Nascosto su mobile
              }}
            />
            <IconButton
              size="small"
              onClick={handleMenuClick}
              sx={{ 
                color: 'white',
                minWidth: '44px', // Touch target
                minHeight: '44px',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
              }}
            >
              <Avatar 
                sx={{ 
                  width: { xs: 36, md: 32 }, // Più grande su mobile
                  height: { xs: 36, md: 32 }, 
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                {getInitials(user?.nome || '', user?.cognome || '')}
              </Avatar>
            </IconButton>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: { xs: 180, md: 200 },
                boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.15)',
                border: '1px solid #E0E0E0',
              }
            }}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #F0F0F0' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {user?.nome} {user?.cognome}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>
                {user?.email}
              </Typography>
            </Box>
            <MenuItem onClick={handleMenuClose} sx={{ py: 1.5 }}>
              <ListItemIcon sx={{ minWidth: '36px !important' }}>
                <AccountCircleIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Profilo" 
                primaryTypographyProps={{ fontSize: '14px' }}
              />
            </MenuItem>
            <MenuItem onClick={handleMenuClose} sx={{ py: 1.5 }}>
              <ListItemIcon sx={{ minWidth: '36px !important' }}>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Impostazioni" 
                primaryTypographyProps={{ fontSize: '14px' }}
              />
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: 'error.main' }}>
              <ListItemIcon sx={{ minWidth: '36px !important', color: 'error.main' }}>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Esci" 
                primaryTypographyProps={{ fontSize: '14px' }}
              />
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      {/* Sidebar in stile Odoo - Responsive */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        anchor="left"
        open={open}
        onClose={isMobile ? () => setOpen(false) : undefined}
        sx={{
          width: open ? drawerWidth : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: { xs: 280, md: drawerWidth }, // Più largo su mobile
            boxSizing: 'border-box',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            border: 'none',
            backgroundColor: '#2F2F2F',
            color: '#CCCCCC',
            ...(isMobile ? {} : {
              transform: open ? 'translateX(0)' : `translateX(-${drawerWidth}px)`,
            }),
          },
        }}
        ModalProps={{
          keepMounted: isMobile, // Migliora le prestazioni su mobile
        }}
      >
        {/* Logo/Header della sidebar */}
        <Box 
          sx={{ 
            height: { xs: '56px', md: '48px' }, // Allineato con AppBar
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #404040',
            backgroundColor: '#1A1A1A'
          }}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '0.5px'
            }}
          >
            MENU
          </Typography>
        </Box>

        {/* Menu principale */}
        <Box sx={{ flexGrow: 1, py: 1 }}>
          <List sx={{ px: 0 }}>
            {menuItems.map((item) => (
              <ListItemButton
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                selected={isSelected(item.path)}
                sx={{
                  mx: 1,
                  my: 0.5,
                  borderRadius: '3px',
                  paddingLeft: '16px',
                  paddingRight: '16px',
                  paddingTop: { xs: '12px', md: '8px' }, // Più padding su mobile
                  paddingBottom: { xs: '12px', md: '8px' },
                  minHeight: { xs: '48px', md: 'auto' }, // Touch target appropriato
                  '&:hover': {
                    backgroundColor: '#404040',
                  },
                  '&.Mui-selected': {
                    backgroundColor: '#714B67',
                    '&:hover': {
                      backgroundColor: '#875A7B',
                    },
                    '& .MuiListItemIcon-root': {
                      color: '#FFFFFF',
                    },
                    '& .MuiListItemText-primary': {
                      color: '#FFFFFF',
                      fontWeight: 500,
                    },
                    '& .MuiListItemText-secondary': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                  },
                }}
              >
                <ListItemIcon 
                  sx={{ 
                    minWidth: '40px',
                    color: isSelected(item.path) ? '#FFFFFF' : '#CCCCCC',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  secondary={item.description}
                  primaryTypographyProps={{
                    fontSize: { xs: '14px', md: '13px' }, // Più leggibile su mobile
                    fontWeight: isSelected(item.path) ? 500 : 400,
                    color: isSelected(item.path) ? '#FFFFFF' : '#CCCCCC',
                  }}
                  secondaryTypographyProps={{
                    fontSize: { xs: '12px', md: '11px' },
                    color: isSelected(item.path) ? 'rgba(255, 255, 255, 0.7)' : 'rgba(204, 204, 204, 0.7)',
                  }}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>

        {/* Footer della sidebar */}
        <Box 
          sx={{ 
            p: 2, 
            borderTop: '1px solid #404040',
            backgroundColor: '#1A1A1A'
          }}
        >
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#888888',
              fontSize: '10px',
              display: 'block',
              textAlign: 'center'
            }}
          >
            Versione 2.2.1
          </Typography>
        </Box>
      </Drawer>

      {/* Contenuto principale - Responsive */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: '100vh',
          backgroundColor: '#F0F0F0',
          transition: 'margin 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          marginLeft: (open && !isMobile) ? 0 : (isMobile ? 0 : `-${drawerWidth}px`),
        }}
      >
        <Toolbar sx={{ minHeight: { xs: '56px', md: '48px' } }} />
        <Box sx={{ 
          p: { xs: 1, md: 3 }, // Padding ridotto su mobile
        }}>
          <Container 
            maxWidth="lg"
            sx={{
              paddingX: { xs: 0, md: 2 }, // No padding laterale su mobile
            }}
          >
            {children}
          </Container>
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;