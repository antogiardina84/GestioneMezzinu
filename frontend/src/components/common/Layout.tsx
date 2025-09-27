// src/components/common/Layout.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { People } from '@mui/icons-material';
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
  ListItemIcon,
  ListItemText,
  Container,
  ListItemButton,
} from '@mui/material';
import { People as PeopleIcon } from '@mui/icons-material';
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
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const drawerWidth = 240;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Autoveicoli', icon: <CarIcon />, path: '/autoveicoli' },
    { text: 'Albo Gestori', icon: <ReceiptIcon />, path: '/albo-gestori' },
    { text: 'REN', icon: <DocumentIcon />, path: '/ren' },
    { text: 'Manutenzioni', icon: <BuildIcon />, path: '/manutenzioni'},
    { text: 'Dashboard Manutenzioni', icon: <AssessmentIcon />, path: '/manutenzioni/dashboard'},
    ...(user?.ruolo === 'admin' ? [
    { text: 'Gestione Utenti', icon: <PeopleIcon />, path: '/users' }
  ] : [])
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: open ? `calc(100% - ${drawerWidth}px)` : '100%',
          ml: open ? `${drawerWidth}px` : 0,
          transition: 'all 0.3s',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Gestione Mezzi
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {user?.nome} {user?.cognome}
          </Typography>
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      
      <Drawer
        sx={{
          width: open ? drawerWidth : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            transition: 'all 0.3s',
            ...(open ? {} : { marginLeft: `-${drawerWidth}px` }),
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <Toolbar />
        <Divider />
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                onClick={() => navigate(item.path)}
                selected={window.location.pathname === item.path}
                sx={{
                  backgroundColor: window.location.pathname === item.path ? 'primary.light' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
      
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Container maxWidth="lg">
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;