// src/components/dashboard/Dashboard.tsx
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
  Schedule as ScheduleIcon
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

  const formatDate = (date: string | Date) => {
    if (!date) return '-';
    return dayjs(date).format('DD MMMM YYYY');
  };

  const getChipColor = (giorni: number) => {
    if (giorni <= 0) return 'error';
    if (giorni <= 30) return 'warning';
    return 'info';
  };

  // Funzione per ottenere il chip del tipo di revisione
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

  // Funzioni per navigazione quando si clicca sugli alert
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

  // Conta gli alert totali (includendo titoli di proprietà)
  const alertTotali = 
    data.contatori.revisioniInScadenza +
    data.contatori.bolliInScadenza +
    data.contatori.assicurazioniInScadenza +
    data.contatori.angaInScadenza +
    data.contatori.renInScadenza +
    (data.contatori.titoliProprietaInScadenza || 0);

  // Separa le revisioni per tipo
  const revisioniAnnuali = data.revisioni.filter(r => r.tipoRevisione === 'Annuale');
  const revisioniBiennali = data.revisioni.filter(r => r.tipoRevisione !== 'Annuale');

  // Prepara i dati per le card statistiche (con titoli di proprietà)
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
      title: 'Assicurazioni',
      value: data.contatori.assicurazioniInScadenza,
      icon: <Security />,
      color: data.contatori.assicurazioniInScadenza > 0 ? '#ff9800' : '#4caf50',
      bgColor: data.contatori.assicurazioniInScadenza > 0 ? '#fff3e0' : '#e8f5e9'
    }
  ];

  // Aggiungi card per titoli di proprietà se ci sono
  if (data.contatori.titoliProprietaInScadenza && data.contatori.titoliProprietaInScadenza > 0) {
    statsCards.push({
      title: 'Titoli Proprietà',
      value: data.contatori.titoliProprietaInScadenza,
      icon: <ArticleOutlined />,
      color: '#ff9800',
      bgColor: '#fff3e0'
    });
  }

  return (
    <Box>
      <Box mb={4} sx={{ 
        background: 'linear-gradient(45deg, #1976d2 30%, #21cbf3 90%)',
        color: 'white',
        p: 3,
        borderRadius: 2,
        mb: 4
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
        {/* Revisioni in Scadenza - AGGIORNATO */}
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
                      {item.urgent ? 
                        <Error color="error" /> : 
                        <Warning color="warning" />
                      }
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {`${item.autoveicolo.marca} ${item.autoveicolo.modello} - ${item.autoveicolo.targa}`}
                          {getRevisionTypeChip(item.tipoRevisione)}
                          {item.autoveicolo.tipoCarrozzeria && (
                            <Chip 
                              size="small" 
                              label={item.autoveicolo.tipoCarrozzeria}
                              variant="outlined"
                              sx={{ fontSize: '0.65rem' }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {formatDate(item.dataRevisione)}
                          <Chip 
                            size="small" 
                            label={`${item.giorni > 0 ? item.giorni : Math.abs(item.giorni)} giorni ${item.giorni > 0 ? 'rimanenti' : 'scaduto'}`}
                            color={getChipColor(item.giorni)}
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
                {data.revisioni.length > 5 && (
                  <ListItem>
                    <ListItemText 
                      primary={`... e altre ${data.revisioni.length - 5} revisioni in scadenza`}
                      sx={{ textAlign: 'center', color: 'text.secondary' }}
                    />
                  </ListItem>
                )}
              </List>
            ) : (
              <Alert severity="success">Nessuna revisione in scadenza</Alert>
            )}
            
            {/* Riepilogo per tipo di revisione */}
            {(revisioniAnnuali.length > 0 || revisioniBiennali.length > 0) && (
              <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Riepilogo per tipo:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {revisioniAnnuali.length > 0 && (
                    <Chip 
                      size="small" 
                      label={`${revisioniAnnuali.length} Annuali`} 
                      color="warning"
                    />
                  )}
                  {revisioniBiennali.length > 0 && (
                    <Chip 
                      size="small" 
                      label={`${revisioniBiennali.length} Biennali`} 
                      color="info"
                    />
                  )}
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Bolli in Scadenza */}
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
                      {item.urgent ? 
                        <Error color="error" /> : 
                        <Warning color="warning" />
                      }
                    </ListItemIcon>
                    <ListItemText
                      primary={`${item.autoveicolo.marca} ${item.autoveicolo.modello} - ${item.autoveicolo.targa}`}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {formatDate(item.dataScadenza)}
                          <Chip 
                            size="small" 
                            label={`${item.giorni > 0 ? item.giorni : Math.abs(item.giorni)} giorni ${item.giorni > 0 ? 'rimanenti' : 'scaduto'}`}
                            color={getChipColor(item.giorni)}
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
                {data.bolliInScadenza.length > 5 && (
                  <ListItem>
                    <ListItemText 
                      primary={`... e altri ${data.bolliInScadenza.length - 5} bolli in scadenza`}
                      sx={{ textAlign: 'center', color: 'text.secondary' }}
                    />
                  </ListItem>
                )}
              </List>
            ) : (
              <Alert severity="success">Nessun bollo in scadenza</Alert>
            )}
          </Paper>
        </Grid>

        {/* Assicurazioni in Scadenza */}
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
                      {item.urgent ? 
                        <Error color="error" /> : 
                        <Warning color="warning" />
                      }
                    </ListItemIcon>
                    <ListItemText
                      primary={`${item.autoveicolo.marca} ${item.autoveicolo.modello} - ${item.autoveicolo.targa}`}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {formatDate(item.dataScadenza)}
                          <Chip 
                            size="small" 
                            label={`${item.giorni > 0 ? item.giorni : Math.abs(item.giorni)} giorni ${item.giorni > 0 ? 'rimanenti' : 'scaduto'}`}
                            color={getChipColor(item.giorni)}
                          />
                          {item.tolleranza && (
                            <Chip size="small" label="15 giorni tolleranza" color="info" />
                          )}
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
                {data.assicurazioniInScadenza.length > 5 && (
                  <ListItem>
                    <ListItemText 
                      primary={`... e altre ${data.assicurazioniInScadenza.length - 5} assicurazioni in scadenza`}
                      sx={{ textAlign: 'center', color: 'text.secondary' }}
                    />
                  </ListItem>
                )}
              </List>
            ) : (
              <Alert severity="success">Nessuna assicurazione in scadenza</Alert>
            )}
          </Paper>
        </Grid>

        {/* Titoli di Proprietà in Scadenza */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom color="warning.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ArticleOutlined /> Titoli di Proprietà in Scadenza ({(data.titoliProprietaInScadenza || []).length})
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {data.titoliProprietaInScadenza && data.titoliProprietaInScadenza.length > 0 ? (
              <List dense>
                {data.titoliProprietaInScadenza.slice(0, 5).map((item, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon>
                      {item.urgent ? 
                        <Error color="error" /> : 
                        <Warning color="warning" />
                      }
                    </ListItemIcon>
                    <ListItemText
                      primary={`${item.autoveicolo.marca} ${item.autoveicolo.modello} - ${item.autoveicolo.targa}`}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip 
                            size="small"
                            label={item.autoveicolo.tipologiaAcquisto}
                            color="secondary"
                          />
                          {formatDate(item.dataScadenza)}
                          <Chip 
                            size="small" 
                            label={`${item.giorni > 0 ? item.giorni : Math.abs(item.giorni)} giorni ${item.giorni > 0 ? 'rimanenti' : 'scaduto'}`}
                            color={getChipColor(item.giorni)}
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
                {(data.titoliProprietaInScadenza || []).length > 5 && (
                  <ListItem>
                    <ListItemText 
                      primary={`... e altri ${(data.titoliProprietaInScadenza || []).length - 5} titoli in scadenza`}
                      sx={{ textAlign: 'center', color: 'text.secondary' }}
                    />
                  </ListItem>
                )}
              </List>
            ) : (
              <Alert severity="success">Nessun titolo di proprietà in scadenza</Alert>
            )}
          </Paper>
        </Grid>

        {/* ANGA e REN in Scadenza */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom color="secondary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Assignment /> Iscrizioni in Scadenza
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Chip 
                label={`ANGA: ${data.contatori.angaInScadenza}`} 
                color={data.contatori.angaInScadenza > 0 ? 'warning' : 'success'}
                size="small"
              />
              <Chip 
                label={`REN: ${data.contatori.renInScadenza}`} 
                color={data.contatori.renInScadenza > 0 ? 'warning' : 'success'}
                size="small"
              />
            </Box>
            
            {/* Mostra iscrizioni ANGA in scadenza */}
            {data.angaInScadenza.length > 0 && (
              <Box mb={2}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Albo Gestori Ambientali
                </Typography>
                <List dense>
                  {data.angaInScadenza.slice(0, 3).map((item, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon>
                        {item.urgent ? 
                          <Error color="error" /> : 
                          <Warning color="warning" />
                        }
                      </ListItemIcon>
                      <ListItemText
                        primary={`${item.alboGestore.numeroIscrizione} - Cat. ${item.alboGestore.categoria} Classe ${item.alboGestore.classe}`}
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {formatDate(item.dataScadenza)}
                            <Chip 
                              size="small" 
                              label={`${item.giorni} giorni`}
                              color={getChipColor(item.giorni)}
                            />
                          </Box>
                        }
                      />
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleViewAlboGestori(item.alboGestore._id)}
                      >
                        <Visibility />
                      </IconButton>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* Mostra iscrizioni REN in scadenza */}
            {data.renInScadenza.length > 0 && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Registro Elettronico Nazionale
                </Typography>
                <List dense>
                  {data.renInScadenza.slice(0, 3).map((item, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon>
                        {item.urgent ? 
                          <Error color="error" /> : 
                          <Warning color="warning" />
                        }
                      </ListItemIcon>
                      <ListItemText
                        primary={`${item.ren.numeroIscrizione} - ${item.ren.regione}, ${item.ren.provincia}`}
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {formatDate(item.dataScadenza)}
                            <Chip 
                              size="small" 
                              label={`${item.giorni} giorni`}
                              color={getChipColor(item.giorni)}
                            />
                          </Box>
                        }
                      />
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleViewREN(item.ren._id)}
                      >
                        <Visibility />
                      </IconButton>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {data.angaInScadenza.length === 0 && data.renInScadenza.length === 0 && (
              <Alert severity="success">Nessuna iscrizione in scadenza</Alert>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Riepilogo mezzi per tipo */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Riepilogo Mezzi per Stato
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {data.riepilogoMezzi.map((item, index) => (
                <Grid item xs={6} key={index}>
                  <Card sx={{ 
                    bgcolor: item._id === 'Attivo' ? '#e8f5e9' : '#f5f5f5',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      boxShadow: 4
                    }
                  }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">
                          {item._id}
                        </Typography>
                        <Typography variant="h6" component="div">
                          {item.count}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Azioni Rapide
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6} sm={4}>
                <Card sx={{ 
                  bgcolor: '#e3f2fd',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: 4
                  }
                }} onClick={() => navigate('/autoveicoli')}>
                  <CardContent sx={{ p: 2, textAlign: 'center' }}>
                    <DirectionsCar color="primary" sx={{ mb: 1 }} />
                    <Typography variant="body2">
                      Nuovo Veicolo
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Card sx={{ 
                  bgcolor: '#f3e5f5',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: 4
                  }
                }} onClick={() => navigate('/albo-gestori')}>
                  <CardContent sx={{ p: 2, textAlign: 'center' }}>
                    <Receipt color="secondary" sx={{ mb: 1 }} />
                    <Typography variant="body2">
                      Nuovo Albo
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Card sx={{ 
                  bgcolor: '#e8f5e9',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: 4
                  }
                }} onClick={() => navigate('/ren')}>
                  <CardContent sx={{ p: 2, textAlign: 'center' }}>
                    <Assignment color="success" sx={{ mb: 1 }} />
                    <Typography variant="body2">
                      Nuovo REN
                    </Typography>
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