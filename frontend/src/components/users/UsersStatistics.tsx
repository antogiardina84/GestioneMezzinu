// src/components/users/UsersStatistics.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import {
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { usersService, UsersStatistics as UsersStatisticsType } from '../../services/usersService';

const UsersStatistics: React.FC = () => {
  const [statistics, setStatistics] = useState<UsersStatisticsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await usersService.getStatistics();
      setStatistics(response.data);
    } catch (err: any) {
      setError('Errore nel caricamento delle statistiche');
      console.error('Error fetching statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | Date) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: it });
  };

  const getMonthName = (month: number) => {
    const months = [
      'Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu',
      'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'
    ];
    return months[month - 1];
  };

  const getRoleChip = (ruolo: string) => {
    return ruolo === 'admin' ? (
      <Chip 
        label="Admin" 
        color="primary" 
        size="small" 
        icon={<AdminIcon />} 
      />
    ) : (
      <Chip 
        label="Utente" 
        color="default" 
        size="small" 
        icon={<PersonIcon />} 
      />
    );
  };

  const getStatusChip = (attivo: boolean) => {
    return attivo ? (
      <Chip 
        label="Attivo" 
        color="success" 
        size="small" 
        icon={<ActiveIcon />}
      />
    ) : (
      <Chip 
        label="Inattivo" 
        color="error" 
        size="small" 
        icon={<InactiveIcon />}
      />
    );
  };

  const getUserAvatar = (user: any) => {
    const initials = `${user.nome.charAt(0)}${user.cognome.charAt(0)}`.toUpperCase();
    return (
      <Avatar 
        sx={{ 
          bgcolor: user.ruolo === 'admin' ? 'primary.main' : 'secondary.main',
          width: 32,
          height: 32,
          fontSize: '0.8rem'
        }}
      >
        {initials}
      </Avatar>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!statistics) {
    return null;
  }

  return (
    <Box>
      {/* Cards Statistiche */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            bgcolor: '#e3f2fd',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 6
            }
          }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Totale Utenti
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ color: '#1976d2' }}>
                    {statistics.totals.totalUsers}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#1976d2', width: 56, height: 56 }}>
                  <PeopleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            bgcolor: '#e8f5e9',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 6
            }
          }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Utenti Attivi
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ color: '#2e7d32' }}>
                    {statistics.totals.activeUsers}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {((statistics.totals.activeUsers / statistics.totals.totalUsers) * 100).toFixed(1)}% del totale
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#2e7d32', width: 56, height: 56 }}>
                  <ActiveIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            bgcolor: '#fff3e0',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 6
            }
          }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Amministratori
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ color: '#ed6c02' }}>
                    {statistics.totals.adminUsers}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {statistics.totals.regularUsers} utenti normali
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#ed6c02', width: 56, height: 56 }}>
                  <AdminIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            bgcolor: '#ffebee',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 6
            }
          }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Utenti Inattivi
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ color: '#d32f2f' }}>
                    {statistics.totals.inactiveUsers}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {statistics.totals.inactiveUsers > 0 
                      ? `${((statistics.totals.inactiveUsers / statistics.totals.totalUsers) * 100).toFixed(1)}% del totale`
                      : 'Tutti gli utenti sono attivi'
                    }
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#d32f2f', width: 56, height: 56 }}>
                  <InactiveIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Grafico Utenti per Mese */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon /> Registrazioni per Mese
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {statistics.usersByMonth.length > 0 ? (
              <Box>
                {statistics.usersByMonth.map((item, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2">
                        {getMonthName(item._id.month)} {item._id.year}
                      </Typography>
                      <Chip label={item.count} size="small" color="primary" />
                    </Box>
                    <Box sx={{ 
                      height: 8, 
                      bgcolor: 'grey.200', 
                      borderRadius: 1,
                      overflow: 'hidden'
                    }}>
                      <Box sx={{ 
                        height: '100%', 
                        bgcolor: 'primary.main',
                        width: `${(item.count / Math.max(...statistics.usersByMonth.map(u => u.count))) * 100}%`,
                        transition: 'width 0.3s ease'
                      }} />
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
                Nessuna registrazione negli ultimi 6 mesi
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Utenti Recenti */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonAddIcon /> Utenti Recenti
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {statistics.recentUsers.length > 0 ? (
              <List dense>
                {statistics.recentUsers.map((user) => (
                  <ListItem key={user._id} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      {getUserAvatar(user)}
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight="medium">
                            {user.nome} {user.cognome}
                          </Typography>
                          {getRoleChip(user.ruolo)}
                          {getStatusChip(user.attivo)}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {user.email}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Registrato il: {formatDate(user.createdAt)}
                          </Typography>
                          {user.ultimoAccesso && (
                            <Typography variant="caption" color="text.secondary">
                              Ultimo accesso: {formatDate(user.ultimoAccesso)}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
                Nessun utente trovato
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Riepilogo Rapido */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Riepilogo Rapido
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                  <Typography variant="h4" color="white" fontWeight="bold">
                    {statistics.totals.totalUsers}
                  </Typography>
                  <Typography variant="body2" color="white">
                    Utenti Totali
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                  <Typography variant="h4" color="white" fontWeight="bold">
                    {((statistics.totals.activeUsers / statistics.totals.totalUsers) * 100).toFixed(0)}%
                  </Typography>
                  <Typography variant="body2" color="white">
                    Tasso Utenti Attivi
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                  <Typography variant="h4" color="white" fontWeight="bold">
                    {((statistics.totals.adminUsers / statistics.totals.totalUsers) * 100).toFixed(0)}%
                  </Typography>
                  <Typography variant="body2" color="white">
                    Amministratori
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                  <Typography variant="h4" color="white" fontWeight="bold">
                    {statistics.usersByMonth.reduce((sum, month) => sum + month.count, 0)}
                  </Typography>
                  <Typography variant="body2" color="white">
                    Registrazioni (6 mesi)
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UsersStatistics;