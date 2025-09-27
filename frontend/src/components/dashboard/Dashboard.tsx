// src/components/dashboard/Dashboard.tsx - VERSIONE COMPLETA CON MANUTENZIONI
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
  Build,
  Schedule,
  ArticleOutlined,
  Schedule as ScheduleIcon,
  LocalParking,
  Info,
  PriorityHigh,
  PlayArrow
} from '@mui/icons-material';
import { dashboardService } from '../../services/dashboardService';
import { manutenzioniService } from '../../services/manutenzioniService';
import { DashboardData } from '../../types/Dashboard';
import { ManutenzioneScadenze } from '../../types/Manutenzione';
import dayjs from 'dayjs';
import 'dayjs/locale/it';

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [manutenzioniScadenze, setManutenzioniScadenze] = useState<ManutenzioneScadenze | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardData, manutenzioniData] = await Promise.all([
        dashboardService.getDashboardData(),
        manutenzioniService.getScadenze()
      ]);
      setData(dashboardData);
      setManutenzioniScadenze(manutenzioniData);
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

  const getManutenzioneStatoIcon = (stato: string) => {
    switch (stato) {
      case 'Programmata': return <Schedule color="info" />;
      case 'In corso': return <PlayArrow color="warning" />;
      case 'Completata': return <CheckCircle color="success" />;
      case 'Annullata': return <Error color="error" />;
      case 'Rimandata': return <Schedule color="disabled" />;
      default: return <Build />;
    }
  };

  const getPrioritaColor = (priorita: string) => {
    const colors = {
      'Bassa': 'default' as const,
      'Media': 'info' as const,
      'Alta': 'warning' as const,
      'Urgente': 'error' as const
    };
    return colors[priorita as keyof typeof colors];
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

  const handleViewManutenzione = (manutenzioneId: string) => {
    navigate(`/manutenzioni`);
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

  if (!data || !manutenzioniScadenze) {
    return null;
  }

  // Calcola alert totali includendo Pass ZTL e Manutenzioni
  const alertTotali = 
    data.contatori.revisioniInScadenza +
    data.contatori.bolliInScadenza +
    data.contatori.assicurazioniInScadenza +
    data.contatori.angaInScadenza +
    data.contatori.renInScadenza +
    (data.contatori.titoliProprietaInScadenza || 0) +
    (data.contatori.passZTLInScadenza || 0) +
    (manutenzioniScadenze.scaduteEUrgenti?.length || 0);

  const revisioniAnnuali = data.revisioni.filter(r => r.tipoRevisione === 'Annuale');
  const revisioniBiennali = data.revisioni.filter(r => r.tipoRevisione !== 'Annuale');

  // Cards statistiche aggiornate con Manutenzioni
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
      title: 'Manutenzioni',
      value: manutenzioniScadenze.scaduteEUrgenti?.length || 0,
      icon: <Build />,
      color: (manutenzioniScadenze.scaduteEUrgenti?.length || 0) > 0 ? '#ff9800' : '#4caf50',
      bgColor: (manutenzioniScadenze.scaduteEUrgenti?.length || 0) > 0 ? '#fff3e0' : '#e8f5e9',
      subtitle: manutenzioniScadenze.prossimiTreGiorni?.length 
        ? `${manutenzioniScadenze.prossimiTreGiorni.length} prossimi 3gg`
        : undefined
    },
    {
      title: 'Revisioni',
      value: data.contatori.revisioniInScadenza,
      icon: <CheckCircle />,
      color: data.contatori.revisioniInScadenza > 0 ? '#ff9800' : '#4caf50',
      bgColor: data.contatori.revisioniInScadenza > 0 ? '#fff3e0' : '#e8f5e9',
      subtitle: revisioniAnnuali.length > 0 ? `${revisioniAnnuali.length} ann. + ${revisioniBiennali.length} bien.` : undefined
    }
  ];

  return (
   <Box>
    {/* Header in stile Odoo */}
    <Box 
      mb={4} 
      sx={{ 
        backgroundColor: '#FFFFFF',
        border: '1px solid #E0E0E0',
        borderRadius: '3px',
        boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}
    >
      {/* Header bar viola */}
      <Box 
        sx={{
          backgroundColor: '#714B67',
          color: 'white',
          px: 3,
          py: 1.5,
          borderBottom: '1px solid #E0E0E0'
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            fontSize: '16px',
            fontWeight: 600,
            margin: 0
          }}
        >
          Dashboard - Gestione Mezzi
        </Typography>
      </Box>
      
      {/* Contenuto */}
      <Box sx={{ p: 3, backgroundColor: '#FAFAFA' }}>
        <Typography 
          variant="body2" 
          sx={{ 
            color: '#666666',
            fontSize: '13px',
            fontWeight: 400,
            margin: 0
          }}
        >
          {new Date().toLocaleDateString('it-IT', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Typography>
      </Box>
    </Box>

      {/* Cards Statistiche */}
      <Grid container spacing={3} mb={4}>
        {statsCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ 
              bgcolor: card.bgColor,
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6
              }
            }}
            onClick={() => {
              if (card.title === 'Manutenzioni') navigate('/manutenzioni');
              else if (card.title === 'Revisioni') navigate('/autoveicoli');
              else if (card.title === 'Mezzi Attivi') navigate('/autoveicoli');
            }}
            >
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
        {/* Manutenzioni Urgenti - NUOVA SEZIONE */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom color="error" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PriorityHigh /> Manutenzioni Urgenti ({manutenzioniScadenze.scaduteEUrgenti?.length || 0})
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {manutenzioniScadenze.scaduteEUrgenti && manutenzioniScadenze.scaduteEUrgenti.length > 0 ? (
              <List dense>
                {manutenzioniScadenze.scaduteEUrgenti.slice(0, 5).map((manutenzione, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon>
                      {getManutenzioneStatoIcon(manutenzione.stato)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="body2" fontWeight="bold">
                            {manutenzione.autoveicolo.targa}
                          </Typography>
                          <Chip 
                            size="small" 
                            label={manutenzione.tipoManutenzione}
                            variant="outlined"
                            color="primary"
                          />
                          <Chip
                            size="small"
                            label={manutenzione.priorita}
                            color={getPrioritaColor(manutenzione.priorita)}
                            sx={{
                              fontWeight: manutenzione.priorita === 'Urgente' ? 'bold' : 'normal',
                              ...(manutenzione.priorita === 'Urgente' && {
                                animation: 'pulse 2s infinite',
                                '@keyframes pulse': {
                                  '0%': { transform: 'scale(1)' },
                                  '50%': { transform: 'scale(1.05)' },
                                  '100%': { transform: 'scale(1)' }
                                }
                              })
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {manutenzione.descrizione}
                          </Typography>
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            Programmata: {formatDate(manutenzione.dataProgrammata)} • 
                            Fornitore: {manutenzione.fornitore.nome}
                          </Typography>
                        </Box>
                      }
                    />
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => handleViewManutenzione(manutenzione._id)}
                    >
                      <Visibility />
                    </IconButton>
                  </ListItem>
                ))}
                {(manutenzioniScadenze.scaduteEUrgenti.length > 5) && (
                  <ListItem>
                    <ListItemText 
                      primary={`... e altre ${manutenzioniScadenze.scaduteEUrgenti.length - 5} manutenzioni urgenti`}
                      sx={{ textAlign: 'center', color: 'text.secondary' }}
                    />
                  </ListItem>
                )}
              </List>
            ) : (
              <Alert severity="success" icon={<CheckCircle />}>
                Nessuna manutenzione urgente o scaduta
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Pass ZTL in Scadenza */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocalParking /> Pass ZTL in Scadenza ({data.passZTLInScadenza?.length || 0})
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {data.passZTLInScadenza && data.passZTLInScadenza.length > 0 ? (
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

        {/* Prossime Manutenzioni (3 giorni) */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom color="warning.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Schedule /> Prossime Manutenzioni ({manutenzioniScadenze.prossimiTreGiorni?.length || 0})
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {manutenzioniScadenze.prossimiTreGiorni && manutenzioniScadenze.prossimiTreGiorni.length > 0 ? (
              <List dense>
                {manutenzioniScadenze.prossimiTreGiorni.slice(0, 5).map((manutenzione, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon>
                      {getManutenzioneStatoIcon(manutenzione.stato)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight="bold">
                            {manutenzione.autoveicolo.targa}
                          </Typography>
                          <Chip 
                            size="small" 
                            label={manutenzione.tipoManutenzione}
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {manutenzione.descrizione}
                          </Typography>
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(manutenzione.dataProgrammata)} • {manutenzione.fornitore.nome}
                          </Typography>
                        </Box>
                      }
                    />
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => handleViewManutenzione(manutenzione._id)}
                    >
                      <Visibility />
                    </IconButton>
                  </ListItem>
                ))}
                {(manutenzioniScadenze.prossimiTreGiorni.length > 5) && (
                  <ListItem>
                    <ListItemText 
                      primary={`... e altre ${manutenzioniScadenze.prossimiTreGiorni.length - 5} manutenzioni`}
                      sx={{ textAlign: 'center', color: 'text.secondary' }}
                    />
                  </ListItem>
                )}
              </List>
            ) : (
              <Alert severity="info" icon={<Schedule />}>
                Nessuna manutenzione nei prossimi 3 giorni
              </Alert>
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
              <Grid item xs={3}>
                <Card sx={{ bgcolor: '#e3f2fd', cursor: 'pointer' }} onClick={() => navigate('/autoveicoli')}>
                  <CardContent sx={{ p: 2, textAlign: 'center' }}>
                    <DirectionsCar color="primary" />
                    <Typography variant="body2">Nuovo Veicolo</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={3}>
                <Card sx={{ bgcolor: '#fff3e0', cursor: 'pointer' }} onClick={() => navigate('/manutenzioni')}>
                  <CardContent sx={{ p: 2, textAlign: 'center' }}>
                    <Build color="warning" />
                    <Typography variant="body2">Manutenzione</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={3}>
                <Card sx={{ bgcolor: '#f3e5f5', cursor: 'pointer' }} onClick={() => navigate('/albo-gestori')}>
                  <CardContent sx={{ p: 2, textAlign: 'center' }}>
                    <Receipt color="secondary" />
                    <Typography variant="body2">Nuovo Albo</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={3}>
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

      {/* Sezione Riepilogo Manutenzioni */}
      <Grid container spacing={3} mt={2}>
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Build /> Riepilogo Manutenzioni
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  bgcolor: '#ffebee', 
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 4 }
                }} 
                onClick={() => navigate('/manutenzioni?stato=Programmata&priorita=Urgente')}
                >
                  <CardContent sx={{ p: 2, textAlign: 'center' }}>
                    <PriorityHigh color="error" sx={{ fontSize: 32 }} />
                    <Typography variant="h6" color="error.main">
                      {manutenzioniScadenze.scaduteEUrgenti?.length || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Urgenti/Scadute
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  bgcolor: '#fff3e0', 
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 4 }
                }} 
                onClick={() => navigate('/manutenzioni/dashboard')}
                >
                  <CardContent sx={{ p: 2, textAlign: 'center' }}>
                    <Schedule color="warning" sx={{ fontSize: 32 }} />
                    <Typography variant="h6" color="warning.main">
                      {manutenzioniScadenze.prossimiTreGiorni?.length || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Prossimi 3 giorni
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  bgcolor: '#e3f2fd', 
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 4 }
                }} 
                onClick={() => navigate('/manutenzioni?stato=Programmata')}
                >
                  <CardContent sx={{ p: 2, textAlign: 'center' }}>
                    <ScheduleIcon color="info" sx={{ fontSize: 32 }} />
                    <Typography variant="h6" color="info.main">
                      {manutenzioniScadenze.prossimeScadenze?.length || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Programmate
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  bgcolor: '#e8f5e9', 
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 4 }
                }} 
                onClick={() => navigate('/manutenzioni?stato=In corso')}
                >
                  <CardContent sx={{ p: 2, textAlign: 'center' }}>
                    <PlayArrow color="success" sx={{ fontSize: 32 }} />
                    <Typography variant="h6" color="success.main">
                      {/* Calcoliamo quante sono in corso dal totale */}
                      {(manutenzioniScadenze.scaduteEUrgenti?.filter(m => m.stato === 'In corso').length || 0) +
                       (manutenzioniScadenze.prossimiTreGiorni?.filter(m => m.stato === 'In corso').length || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      In Corso
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Link veloci alla dashboard manutenzioni */}
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Accesso rapido alle funzionalità manutenzioni:
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Chip
                  label="📊 Dashboard Completa"
                  color="primary"
                  variant="outlined"
                  onClick={() => navigate('/manutenzioni/dashboard')}
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'primary.light' } }}
                />
                <Chip
                  label="📋 Tutte le Manutenzioni"
                  color="default"
                  variant="outlined"
                  onClick={() => navigate('/manutenzioni')}
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'grey.200' } }}
                />
                <Chip
                  label="➕ Nuova Manutenzione"
                  color="success"
                  variant="outlined"
                  onClick={() => navigate('/manutenzioni/new')}
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'success.light' } }}
                />
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;