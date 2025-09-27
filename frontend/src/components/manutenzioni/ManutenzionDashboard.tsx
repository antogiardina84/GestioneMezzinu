// src/components/manutenzioni/DashboardManutenzioni.tsx - VERSIONE COMPLETA CORRETTA
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Build,
  Warning,
  Schedule,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Visibility,
  Add,
  Euro,
  DirectionsCar,
  Person,
  CalendarMonth,
  Assessment,
  PriorityHigh,
  PlayArrow,
  Pause,
  Cancel
} from '@mui/icons-material';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip
} from 'recharts';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/it';
import { useNavigate } from 'react-router-dom';

import { manutenzioniService } from '../../services/manutenzioniService';
import { ManutenzioneScadenze, ManutenzioneStatistiche } from '../../types/Manutenzione';

// Setup dayjs
dayjs.extend(relativeTime);
dayjs.locale('it');

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#ff7c7c'];

const DashboardManutenzioni: React.FC = () => {
  const navigate = useNavigate();
  const [scadenze, setScadenze] = useState<ManutenzioneScadenze | null>(null);
  const [statistiche, setStatistiche] = useState<ManutenzioneStatistiche | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Generiamo gli anni disponibili (dal 2020 all'anno corrente)
  const availableYears = Array.from(
    { length: new Date().getFullYear() - 2019 }, 
    (_, i) => 2020 + i
  ).reverse();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [scadenzeData, statisticheData] = await Promise.all([
        manutenzioniService.getScadenze(),
        manutenzioniService.getStatistiche(selectedYear)
      ]);
      
      setScadenze(scadenzeData);
      setStatistiche(statisticheData);
    } catch (err: any) {
      setError('Errore nel caricamento dei dati');
      console.error('Errore:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatDate = (date: string | Date) => {
    if (!date) return '-';
    return dayjs(date).format('DD MMM YYYY');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getPrioritaColor = (priorita: string) => {
    const colors = {
      'Bassa': '#4caf50',
      'Media': '#2196f3',
      'Alta': '#ff9800',
      'Urgente': '#f44336'
    };
    return colors[priorita as keyof typeof colors] || '#666';
  };

  const getStatoIcon = (stato: string) => {
    switch (stato) {
      case 'Programmata': return <Schedule color="info" />;
      case 'In corso': return <PlayArrow color="warning" />;
      case 'Completata': return <CheckCircle color="success" />;
      case 'Annullata': return <Cancel color="error" />;
      case 'Rimandata': return <Pause color="disabled" />;
      default: return <Schedule />;
    }
  };

  const calcolaTotaleAnno = () => {
    if (!statistiche?.costiMensili) return 0;
    return statistiche.costiMensili.reduce((sum, item) => sum + item.costoTotale, 0);
  };

  const calcolaMediaMensile = () => {
    const totale = calcolaTotaleAnno();
    const mesiConDati = statistiche?.costiMensili?.length || 1;
    return totale / mesiConDati;
  };

  // Prepara i dati per il grafico dei costi mensili
  const prepareCostiMensili = () => {
    if (!statistiche?.costiMensili) return [];
    
    const mesi = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
    
    return Array.from({ length: 12 }, (_, i) => {
      const datiMese = statistiche.costiMensili.find(item => item._id === i + 1);
      return {
        mese: mesi[i],
        costo: datiMese?.costoTotale || 0
      };
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={fetchData} sx={{ mt: 2 }}>
          Riprova
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Dashboard Manutenzioni
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Panoramica completa delle manutenzioni aziendali
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Anno</InputLabel>
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              label="Anno"
            >
              {availableYears.map(year => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/manutenzioni')}
          >
            Gestisci Manutenzioni
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* KPI Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #f44336, #d32f2f)' }}>
            <CardContent sx={{ textAlign: 'center', color: 'white' }}>
              <PriorityHigh sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" component="div">
                {scadenze?.scaduteEUrgenti?.length || 0}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Urgenti/Scadute
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #ff9800, #f57c00)' }}>
            <CardContent sx={{ textAlign: 'center', color: 'white' }}>
              <Schedule sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" component="div">
                {scadenze?.prossimiTreGiorni?.length || 0}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Prossimi 3 giorni
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #2196f3, #1976d2)' }}>
            <CardContent sx={{ textAlign: 'center', color: 'white' }}>
              <Build sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" component="div">
                {scadenze?.prossimeScadenze?.length || 0}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Prossimo mese
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #4caf50, #388e3c)' }}>
            <CardContent sx={{ textAlign: 'center', color: 'white' }}>
              <Euro sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" component="div" sx={{ fontSize: '1.5rem' }}>
                {formatCurrency(calcolaTotaleAnno())}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Costi Totali {selectedYear}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Statistiche secondarie */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
                Statistiche Rapide
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Media mensile:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {formatCurrency(calcolaMediaMensile())}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Tipi manutenzione:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {statistiche?.statistichePerTipo?.length || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Fornitori attivi:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {statistiche?.statistichePerFornitore?.length || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Veicoli con manutenzioni:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {statistiche?.statistichePerAutoveicolo?.length || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Manutenzioni urgenti e scadute */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Warning color="error" />
              Manutenzioni Urgenti e Scadute
            </Typography>
            {scadenze?.scaduteEUrgenti && scadenze.scaduteEUrgenti.length > 0 ? (
              <List sx={{ maxHeight: 320, overflow: 'auto' }}>
                {scadenze.scaduteEUrgenti.map((manutenzione) => (
                  <ListItem 
                    key={manutenzione._id} 
                    sx={{ 
                      border: '1px solid', 
                      borderColor: manutenzione.priorita === 'Urgente' ? 'error.main' : 'warning.main',
                      borderRadius: 1, 
                      mb: 1,
                      backgroundColor: manutenzione.priorita === 'Urgente' ? 'error.light' : 'warning.light',
                      '&:hover': {
                        backgroundColor: manutenzione.priorita === 'Urgente' ? 'error.main' : 'warning.main',
                        '& .MuiTypography-root': { color: 'white' },
                        '& .MuiChip-root': { backgroundColor: 'rgba(255,255,255,0.2)' }
                      }
                    }}
                  >
                    <ListItemIcon>
                      {getStatoIcon(manutenzione.stato)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" fontWeight="bold">
                            {manutenzione.autoveicolo.targa} - {manutenzione.descrizione}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Chip
                              size="small"
                              label={manutenzione.priorita}
                              sx={{ 
                                backgroundColor: getPrioritaColor(manutenzione.priorita), 
                                color: 'white',
                                fontWeight: 'bold'
                              }}
                            />
                            <Tooltip title="Visualizza dettagli">
                              <IconButton 
                                size="small"
                                onClick={() => navigate(`/manutenzioni/${manutenzione._id}`)}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Programmata: {formatDate(manutenzione.dataProgrammata)}</span>
                          <span>Fornitore: {manutenzione.fornitore.nome}</span>
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: 200,
                backgroundColor: 'success.light',
                borderRadius: 2,
                border: '2px solid',
                borderColor: 'success.main'
              }}>
                <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" color="success.dark" fontWeight="bold">
                  Ottimo lavoro!
                </Typography>
                <Typography variant="body2" color="success.dark">
                  Nessuna manutenzione urgente o scaduta
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Grafico costi mensili */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp />
              Andamento Costi Mensili ({selectedYear})
            </Typography>
            {statistiche?.costiMensili && statistiche.costiMensili.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={prepareCostiMensili()}>
                  <defs>
                    <linearGradient id="colorCosto" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2196f3" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#2196f3" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="mese" 
                    tick={{ fontSize: 12 }}
                    stroke="#666"
                  />
                  <YAxis 
                    tickFormatter={(value) => formatCurrency(value)} 
                    tick={{ fontSize: 12 }}
                    stroke="#666"
                  />
                  <RechartsTooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Costo']}
                    labelStyle={{ color: '#666' }}
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="costo" 
                    stroke="#2196f3" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorCosto)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: 320,
                backgroundColor: 'grey.50',
                borderRadius: 2,
                border: '2px dashed',
                borderColor: 'grey.300'
              }}>
                <Typography variant="body1" color="text.secondary">
                  Nessun dato disponibile per l'anno {selectedYear}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Grafico manutenzioni per tipo */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Assessment />
              Manutenzioni per Tipo ({selectedYear})
            </Typography>
            {statistiche?.statistichePerTipo && statistiche.statistichePerTipo.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statistiche.statistichePerTipo}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props: any) => {
                      const { name, percent } = props;
                      return `${name}\n${(percent * 100).toFixed(0)}%`;
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="_id"
                  >
                    {statistiche.statistichePerTipo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: number, name: string) => [
                      `${value} manutenzioni`, 
                      name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: 280,
                backgroundColor: 'grey.50',
                borderRadius: 2
              }}>
                <Typography variant="body2" color="text.secondary">
                  Nessun dato per l'anno {selectedYear}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Top fornitori */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person />
              Top Fornitori per Costo ({selectedYear})
            </Typography>
            {statistiche?.statistichePerFornitore && statistiche.statistichePerFornitore.length > 0 ? (
              <TableContainer sx={{ maxHeight: 320 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Fornitore</TableCell>
                      <TableCell align="center">Manutenzioni</TableCell>
                      <TableCell align="right">Costo Totale</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {statistiche.statistichePerFornitore.map((fornitore, index) => (
                      <TableRow 
                        key={fornitore._id}
                        hover
                        sx={{ 
                          '&:nth-of-type(odd)': { backgroundColor: 'grey.50' },
                          '&:hover': { backgroundColor: 'primary.light' }
                        }}
                      >
                        <TableCell>
                          <Avatar 
                            sx={{ 
                              width: 24, 
                              height: 24, 
                              backgroundColor: index < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][index] : 'primary.main',
                              fontSize: 12,
                              fontWeight: 'bold'
                            }}
                          >
                            {index + 1}
                          </Avatar>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={index < 3 ? 'bold' : 'normal'}>
                            {fornitore._id}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            size="small" 
                            label={fornitore.count}
                            color={index < 3 ? 'primary' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography 
                            variant="body2" 
                            fontWeight="bold" 
                            color={index < 3 ? 'primary.main' : 'text.primary'}
                          >
                            {formatCurrency(fornitore.costoTotale)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: 320,
                backgroundColor: 'grey.50',
                borderRadius: 2
              }}>
                <Typography variant="body2" color="text.secondary">
                  Nessun fornitore per l'anno {selectedYear}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Top veicoli per costo */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DirectionsCar />
              Top Veicoli per Costo Manutenzione ({selectedYear})
            </Typography>
            {statistiche?.statistichePerAutoveicolo && statistiche.statistichePerAutoveicolo.length > 0 ? (
              <TableContainer sx={{ maxHeight: 320 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Veicolo</TableCell>
                      <TableCell align="center">Manutenzioni</TableCell>
                      <TableCell align="right">Costo Totale</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {statistiche.statistichePerAutoveicolo.map((item, index) => (
                      <TableRow 
                        key={item._id}
                        hover
                        sx={{ 
                          '&:nth-of-type(odd)': { backgroundColor: 'grey.50' },
                          '&:hover': { backgroundColor: 'warning.light' }
                        }}
                      >
                        <TableCell>
                          <Avatar 
                            sx={{ 
                              width: 24, 
                              height: 24, 
                              backgroundColor: index < 3 ? ['#FF6B6B', '#4ECDC4', '#45B7D1'][index] : 'warning.main',
                              fontSize: 12,
                              fontWeight: 'bold'
                            }}
                          >
                            {index + 1}
                          </Avatar>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {item.autoveicolo.targa}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.autoveicolo.marca} {item.autoveicolo.modello}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            size="small" 
                            label={item.count}
                            color={index < 3 ? 'warning' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography 
                            variant="body2" 
                            fontWeight="bold" 
                            color={index < 3 ? 'warning.dark' : 'text.primary'}
                          >
                            {formatCurrency(item.costoTotale)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: 320,
                backgroundColor: 'grey.50',
                borderRadius: 2
              }}>
                <Typography variant="body2" color="text.secondary">
                  Nessun veicolo per l'anno {selectedYear}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Prossime manutenzioni nei prossimi 3 giorni */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarMonth />
              Prossime Manutenzioni (3 giorni)
            </Typography>
            {scadenze?.prossimiTreGiorni && scadenze.prossimiTreGiorni.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Veicolo</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Descrizione</TableCell>
                      <TableCell>Data Programmata</TableCell>
                      <TableCell>Priorità</TableCell>
                      <TableCell>Fornitore</TableCell>
                      <TableCell>Stato</TableCell>
                      <TableCell>Azioni</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {scadenze.prossimiTreGiorni.map((manutenzione) => (
                      <TableRow key={manutenzione._id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {manutenzione.autoveicolo.targa}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {manutenzione.autoveicolo.marca} {manutenzione.autoveicolo.modello}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            size="small" 
                            label={manutenzione.tipoManutenzione}
                            variant="outlined"
                            color="primary"
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title={manutenzione.descrizione}>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                              {manutenzione.descrizione}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              {formatDate(manutenzione.dataProgrammata)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {dayjs(manutenzione.dataProgrammata).fromNow()}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={manutenzione.priorita}
                            sx={{ 
                              backgroundColor: getPrioritaColor(manutenzione.priorita), 
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {manutenzione.fornitore.nome}
                          </Typography>
                          {manutenzione.fornitore.telefono && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {manutenzione.fornitore.telefono}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getStatoIcon(manutenzione.stato)}
                            <Typography variant="body2">
                              {manutenzione.stato}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Visualizza dettagli">
                            <IconButton 
                              size="small"
                              onClick={() => navigate(`/manutenzioni/${manutenzione._id}`)}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Nessuna manutenzione programmata per i prossimi 3 giorni
                </Typography>
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Insight e raccomandazioni */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, backgroundColor: 'primary.light' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              💡 Insights e Raccomandazioni
            </Typography>
            <Grid container spacing={2}>
              {/* Media costi per veicolo */}
              {statistiche?.statistichePerAutoveicolo && statistiche.statistichePerAutoveicolo.length > 0 && (
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, backgroundColor: 'white', borderRadius: 2 }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      📊 Costo Medio per Veicolo
                    </Typography>
                    <Typography variant="h6" color="primary.dark">
                      {formatCurrency(
                        statistiche.statistichePerAutoveicolo.reduce((sum, item) => sum + item.costoTotale, 0) / 
                        statistiche.statistichePerAutoveicolo.length
                      )}
                    </Typography>
                  </Box>
                </Grid>
              )}

              {/* Fornitore più economico */}
              {statistiche?.statistichePerFornitore && statistiche.statistichePerFornitore.length > 0 && (
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, backgroundColor: 'white', borderRadius: 2 }}>
                    <Typography variant="subtitle2" color="success.main" gutterBottom>
                      💰 Fornitore più Conveniente
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {statistiche.statistichePerFornitore[statistiche.statistichePerFornitore.length - 1]?._id}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Media: {formatCurrency(
                        statistiche.statistichePerFornitore[statistiche.statistichePerFornitore.length - 1]?.costoTotale / 
                        statistiche.statistichePerFornitore[statistiche.statistichePerFornitore.length - 1]?.count || 0
                      )}
                    </Typography>
                  </Box>
                </Grid>
              )}

              {/* Trend mensile */}
              {statistiche?.costiMensili && statistiche.costiMensili.length >= 2 && (
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, backgroundColor: 'white', borderRadius: 2 }}>
                    <Typography variant="subtitle2" color="info.main" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      📈 Trend Ultimo Mese
                      {(() => {
                        const ultimi2Mesi = statistiche.costiMensili.slice(-2);
                        if (ultimi2Mesi.length < 2) return null;
                        const trend = ultimi2Mesi[1].costoTotale - ultimi2Mesi[0].costoTotale;
                        return trend > 0 ? 
                          <TrendingUp color="error" fontSize="small" /> : 
                          <TrendingDown color="success" fontSize="small" />;
                      })()}
                    </Typography>
                    {(() => {
                      const ultimi2Mesi = statistiche.costiMensili.slice(-2);
                      if (ultimi2Mesi.length < 2) {
                        return <Typography variant="body2">Dati insufficienti</Typography>;
                      }
                      const trend = ultimi2Mesi[1].costoTotale - ultimi2Mesi[0].costoTotale;
                      const percentuale = Math.abs((trend / ultimi2Mesi[0].costoTotale) * 100);
                      return (
                        <>
                          <Typography variant="body2" fontWeight="bold" color={trend > 0 ? 'error.main' : 'success.main'}>
                            {trend > 0 ? '+' : ''}{formatCurrency(trend)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {trend > 0 ? 'Aumento' : 'Diminuzione'} del {percentuale.toFixed(1)}%
                          </Typography>
                        </>
                      );
                    })()}
                  </Box>
                </Grid>
              )}
            </Grid>

            {/* Raccomandazioni specifiche */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                🎯 Raccomandazioni Specifiche:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {scadenze?.scaduteEUrgenti && scadenze.scaduteEUrgenti.length > 0 && (
                  <Chip 
                    icon={<Warning />}
                    label={`${scadenze.scaduteEUrgenti.length} manutenzioni urgenti da gestire`}
                    color="error"
                    variant="filled"
                  />
                )}
                
                {statistiche?.statistichePerAutoveicolo && 
                 statistiche.statistichePerAutoveicolo.length > 0 &&
                 statistiche.statistichePerAutoveicolo[0].count > 5 && (
                  <Chip 
                    icon={<DirectionsCar />}
                    label={`Veicolo ${statistiche.statistichePerAutoveicolo[0].autoveicolo.targa} richiede attenzione`}
                    color="warning"
                    variant="filled"
                  />
                )}

                {calcolaMediaMensile() > 1000 && (
                  <Chip 
                    icon={<Euro />}
                    label="Valuta contratti di manutenzione preventiva"
                    color="info"
                    variant="filled"
                  />
                )}

                {statistiche?.statistichePerFornitore && statistiche.statistichePerFornitore.length > 3 && (
                  <Chip 
                    icon={<Person />}
                    label="Considera consolidamento fornitori"
                    color="default"
                    variant="filled"
                  />
                )}
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
            <Typography variant="h6" gutterBottom>
              🚀 Azioni Rapide
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/manutenzioni/new')}
                size="large"
              >
                Nuova Manutenzione
              </Button>
              <Button
                variant="outlined"
                startIcon={<Schedule />}
                onClick={() => navigate('/manutenzioni?stato=Programmata')}
              >
                Manutenzioni Programmate
              </Button>
              <Button
                variant="outlined"
                startIcon={<Build />}
                onClick={() => navigate('/manutenzioni?stato=In corso')}
              >
                In Corso
              </Button>
              <Button
                variant="outlined"
                startIcon={<CheckCircle />}
                onClick={() => navigate('/manutenzioni?stato=Completata')}
              >
                Completate
              </Button>
              <Button
                variant="outlined"
                startIcon={<Assessment />}
                onClick={() => {
                  const csvData = statistiche?.costiMensili?.map(item => ({
                    Mese: item._id,
                    Costo: item.costoTotale
                  })) || [];
                  
                  const csvContent = "data:text/csv;charset=utf-8," + 
                    "Mese,Costo\n" +
                    csvData.map(row => `${row.Mese},${row.Costo}`).join("\n");
                  
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement("a");
                  link.setAttribute("href", encodedUri);
                  link.setAttribute("download", `manutenzioni_${selectedYear}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                Esporta Dati
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardManutenzioni;