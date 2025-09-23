// src/components/dashboard/Dashboard.tsx - VERSIONE COMPLETA CON PASS ZTL
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  DirectionsCar,
  Warning,
  Receipt,
  Security,
  CheckCircle,
  Error,
  Assignment,
  Visibility,
  ArticleOutlined,
  Schedule as ScheduleIcon,
  LocalParking,
  Info
} from '@mui/icons-material';
import { dashboardService } from '../../services/dashboardService';
import { DashboardData } from '../../types/Dashboard';
import dayjs from 'dayjs';
import 'dayjs/locale/it';

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const dashboardData = await dashboardService.getDashboardData();
      setData(dashboardData);
    } catch (err: any) {
      setError('Errore nel caricamento dei dati della dashboard');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const formatDate = (date: string | Date) => {
    if (!date) return '-';
    return dayjs(date).format('DD MMMM YYYY');
  };

  const getChipColor = (giorni: number) => {
    if (giorni <= 0) return 'error';
    if (giorni <= 30) return 'warning';
    return 'info';
  };

  const getRevisionTypeChip = (tipoRevisione?: string) => {
    if (!tipoRevisione) return null;
    return (
      <Chip 
        size="small" 
        label={tipoRevisione === 'Annuale' ? 'Ann.' : 'Bien.'} 
        color={tipoRevisione === 'Annuale' ? 'warning' : 'info'}
        sx={{ ml: 1 }}
      />
    );
  };

  const getLivelloUrgenzaColor = (livello: string) => {
    switch (livello) {
      case 'scaduto': return 'error';
      case 'critico': return 'error';
      case 'urgente': return 'warning';
      case 'avviso': return 'info';
      default: return 'default';
    }
  };

  const getLivelloUrgenzaIcon = (livello: string) => {
    switch (livello) {
      case 'scaduto': return <Error color="error" />;
      case 'critico': return <Warning color="error" />;
      case 'urgente': return <Warning color="warning" />;
      case 'avviso': return <Info color="info" />;
      default: return <ScheduleIcon />;
    }
  };

  const getStatoChip = (stato: string) => {
    const colors: Record<string, "primary" | "secondary" | "error" | "warning" | "info" | "success"> = {
      'Attivo': 'success',
      'Venduto': 'primary',
      'Chiuso': 'warning',
      'Demolito': 'error',
      'Veicolo Guasto': 'warning'
    };
    return <Chip label={stato} color={colors[stato] || 'info'} size="small" />;
  };

  const handleViewAutoveicolo = (autoveicoloId: string) => {
    navigate(`/autoveicoli`);
  };

  const handleViewAlboGestori = (alboId: string) => {
    navigate(`/albo-gestori`);
  };

  const handleViewREN = (renId: string) => {
    navigate(`/ren`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!data) {
    return null;
  }

  // Calcola alert totali includendo Pass ZTL
  const alertTotali = 
    data.contatori.revisioniInScadenza +
    data.contatori.bolliInScadenza +
    data.contatori.assicurazioniInScadenza +
    data.contatori.angaInScadenza +
    data.contatori.renInScadenza +
    (data.contatori.titoliProprietaInScadenza || 0) +
    (data.contatori.passZTLInScadenza || 0);

  const revisioniAnnuali = data.revisioni.filter(r => r.tipoRevisione === 'Annuale');
  const revisioniBiennali = data.revisioni.filter(r => r.tipoRevisione !== 'Annuale');

  // Cards statistiche aggiornate con Pass ZTL
  const statsCards = [
    {
      title: 'Mezzi Attivi',
      value: data.contatori.mezziAttivi,
      icon: <DirectionsCar />,
      color: '#4caf50',
      bgColor: '#e8f5e9'
    },
    {
      title: 'Alert Totali',
      value: alertTotali,
      icon: <Warning />,
      color: alertTotali > 0 ? '#f44336' : '#4caf50',
      bgColor: alertTotali > 0 ? '#ffebee' : '#e8f5e9'
    },
    {
      title: 'Revisioni',
      value: data.contatori.revisioniInScadenza,
      icon: <CheckCircle />,
      color: data.contatori.revisioniInScadenza > 0 ? '#ff9800' : '#4caf50',
      bgColor: data.contatori.revisioniInScadenza > 0 ? '#fff3e0' : '#e8f5e9',
      subtitle: revisioniAnnuali.length > 0 ? `${revisioniAnnuali.length} ann. + ${revisioniBiennali.length} bien.` : undefined
    },
    {
      title: 'Pass ZTL',
      value: data.contatori.passZTLInScadenza,
      icon: <LocalParking />,
      color: data.contatori.passZTLInScadenza > 0 ? '#ff9800' : '#4caf50',
      bgColor: data.contatori.passZTLInScadenza > 0 ? '#fff3e0' : '#e8f5e9'
    }
  ];

  return (
    <Box>
      {/* Header */}
      <Box mb={4} sx={{ 
        background: 'linear-gradient(45deg, #1976d2 30%, #21cbf3 90%)',
        color: 'white',
        p: 3,
        borderRadius: 2
      }}>
        <Typography variant="h4" gutterBottom>
          Dashboard - Gestione Mezzi
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9 }}>
          {new Date().toLocaleDateString('it-IT', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Typography>
      </Box>

      {/* Cards Statistiche */}
      <Grid container spacing={3} mb={4}>
        {statsCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ 
              bgcolor: card.bgColor,
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
                      {card.title}
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ color: card.color }}>
                      {card.value}
                    </Typography>
                    {card.subtitle && (
                      <Typography variant="caption" color="text.secondary">
                        {card.subtitle}
                      </Typography>
                    )}
                  </Box>
                  <Avatar sx={{ bgcolor: card.color, width: 56, height: 56 }}>
                    {card.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Sezione Alert */}
      <Grid container spacing={3} mb={4}>
        {/* Pass ZTL in Scadenza - NUOVA SEZIONE */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocalParking /> Pass ZTL in Scadenza ({data.passZTLInScadenza.length})
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {data.passZTLInScadenza.length > 0 ? (
              <List dense>
                {data.passZTLInScadenza.slice(0, 5).map((item, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon>
                      {getLivelloUrgenzaIcon(item.livelloUrgenza)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {`${item.autoveicolo.marca} ${item.autoveicolo.modello} - ${item.autoveicolo.targa}`}
                          {getStatoChip(item.autoveicolo.stato)}
                          {item.autoveicolo.autista && (
                            <Chip 
                              size="small" 
                              label={item.autoveicolo.autista}
                              variant="outlined"
                              sx={{ fontSize: '0.65rem' }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(item.dataScadenza)}
                          </Typography>
                          <Chip 
                            size="small" 
                            label={item.messaggio}
                            color={getLivelloUrgenzaColor(item.livelloUrgenza) as any}
                          />
                        </Box>
                      }
                    />
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => handleViewAutoveicolo(item.autoveicolo._id)}
                    >
                      <Visibility />
                    </IconButton>
                  </ListItem>
                ))}
                {data.passZTLInScadenza.length > 5 && (
                  <ListItem>
                    <ListItemText 
                      primary={`... e altri ${data.passZTLInScadenza.length - 5} Pass ZTL in scadenza`}
                      sx={{ textAlign: 'center', color: 'text.secondary' }}
                    />
                  </ListItem>
                )}
              </List>
            ) : (
              <Alert severity="success" icon={<LocalParking />}>
                Nessun Pass ZTL in scadenza
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Revisioni in Scadenza */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom color="error" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle /> Revisioni in Scadenza ({data.revisioni.length})
              {revisioniAnnuali.length > 0 && (
                <Tooltip title={`${revisioniAnnuali.length} annuali, ${revisioniBiennali.length} biennali`}>
                  <ScheduleIcon fontSize="small" color="info" />
                </Tooltip>
              )}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {data.revisioni.length > 0 ? (
              <List dense>
                {data.revisioni.slice(0, 5).map((item, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon>
                      {item.urgent ? <Error color="error" /> : <Warning color="warning" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {`${item.autoveicolo.marca} ${item.autoveicolo.modello} - ${item.autoveicolo.targa}`}
                          {getRevisionTypeChip(item.tipoRevisione)}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {formatDate(item.dataRevisione)}
                          <Chip 
                            size="small" 
                            label={`${Math.abs(item.giorni)} giorni ${item.giorni > 0 ? 'rimanenti' : 'scaduto'}`}
                            color={getChipColor(item.giorni)}
                          />
                        </Box>
                      }
                    />
                    <IconButton size="small" color="primary" onClick={() => handleViewAutoveicolo(item.autoveicolo._id)}>
                      <Visibility />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="success">Nessuna revisione in scadenza</Alert>
            )}
          </Paper>
        </Grid>

        {/* Altre sezioni... */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom color="warning.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Receipt /> Bolli in Scadenza ({data.bolliInScadenza.length})
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {data.bolliInScadenza.length > 0 ? (
              <List dense>
                {data.bolliInScadenza.slice(0, 5).map((item, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon>
                      {item.urgent ? <Error color="error" /> : <Warning color="warning" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={`${item.autoveicolo.marca} ${item.autoveicolo.modello} - ${item.autoveicolo.targa}`}
                      secondary={formatDate(item.dataScadenza)}
                    />
                    <IconButton size="small" color="primary" onClick={() => handleViewAutoveicolo(item.autoveicolo._id)}>
                      <Visibility />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="success">Nessun bollo in scadenza</Alert>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom color="info.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Security /> Assicurazioni in Scadenza ({data.assicurazioniInScadenza.length})
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {data.assicurazioniInScadenza.length > 0 ? (
              <List dense>
                {data.assicurazioniInScadenza.slice(0, 5).map((item, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon>
                      {item.urgent ? <Error color="error" /> : <Warning color="warning" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={`${item.autoveicolo.marca} ${item.autoveicolo.modello} - ${item.autoveicolo.targa}`}
                      secondary={formatDate(item.dataScadenza)}
                    />
                    <IconButton size="small" color="primary" onClick={() => handleViewAutoveicolo(item.autoveicolo._id)}>
                      <Visibility />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="success">Nessuna assicurazione in scadenza</Alert>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Riepilogo */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Riepilogo Mezzi per Stato</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {data.riepilogoMezzi.map((item, index) => (
                <Grid item xs={6} key={index}>
                  <Card sx={{ bgcolor: item._id === 'Attivo' ? '#e8f5e9' : '#f5f5f5' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="body2" color="text.secondary">{item._id}</Typography>
                      <Typography variant="h6">{item.count}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Azioni Rapide</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Card sx={{ bgcolor: '#e3f2fd', cursor: 'pointer' }} onClick={() => navigate('/autoveicoli')}>
                  <CardContent sx={{ p: 2, textAlign: 'center' }}>
                    <DirectionsCar color="primary" />
                    <Typography variant="body2">Nuovo Veicolo</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={4}>
                <Card sx={{ bgcolor: '#f3e5f5', cursor: 'pointer' }} onClick={() => navigate('/albo-gestori')}>
                  <CardContent sx={{ p: 2, textAlign: 'center' }}>
                    <Receipt color="secondary" />
                    <Typography variant="body2">Nuovo Albo</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={4}>
                <Card sx={{ bgcolor: '#e8f5e9', cursor: 'pointer' }} onClick={() => navigate('/ren')}>
                  <CardContent sx={{ p: 2, textAlign: 'center' }}>
                    <Assignment color="success" />
                    <Typography variant="body2">Nuovo REN</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;