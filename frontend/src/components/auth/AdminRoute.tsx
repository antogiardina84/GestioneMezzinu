// src/components/auth/AdminRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Box, Alert, Paper, Typography } from '@mui/material';
import { AdminPanelSettings as AdminIcon } from '@mui/icons-material';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return null; // Il loading è gestito dal PrivateRoute parent
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (user?.ruolo !== 'admin') {
    return (
      <Box sx={{ p: 3 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <AdminIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom color="error">
            Accesso Negato
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Non hai i permessi necessari per accedere a questa sezione.
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Questa area è riservata agli amministratori del sistema.
          </Alert>
        </Paper>
      </Box>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;