// src/components/manutenzioni/ManutenzionDashboard.tsx - CON FILTRO MEZZO
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
  Cancel,
  FilterList
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
import { autoveicoliService } from '../../services/autoveicoliService';
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
  
  // NUOVO: Stati per il filtro mezzo
  const [autoveicoli, setAutoveicoli] = useState<any[]>([]);
  const [selectedMezzo, setSelectedMezzo] = useState<string>(''); // '' = tutti i mezzi
  const [mezzoFiltrato, setMezzoFiltrato] = useState<any>(null);

  // Generiamo gli anni disponibili (dal 2020 all'anno corrente)
  const availableYears = Array.from(
    { length: new Date().getFullYear() - 2019 }, 
    (_, i) => 2020 + i
  ).reverse();

  // NUOVO: Carica lista autoveicoli al mount
  useEffect(() => {
    const fetchAutoveicoli = async () => {
      try {
        const response = await autoveicoliService.getAll({ stato: 'Attivo' });
        setAutoveicoli(response.data || []);
      } catch (err) {
        console.error('Errore nel caricamento autoveicoli:', err);
      }
    };
    fetchAutoveicoli();
  }, []);

  // MODIFICATO: Aggiungi selectedMezzo alle dipendenze
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Prepara i parametri per le statistiche
      const statsParams: any = { anno: selectedYear };
      if (selectedMezzo) {
        statsParams.autoveicolo = selectedMezzo;
      }
      
      const [scadenzeData, statisticheData] = await Promise.all([
        manutenzioniService.getScadenze(),
        manutenzioniService.getStatistiche(statsParams)
      ]);
      
      // NUOVO: Se c'è un filtro mezzo, trova i dettagli del mezzo
      if (selectedMezzo) {
        const mezzoDetails = autoveicoli.find(a => a._id === selectedMezzo);
        setMezzoFiltrato(mezzoDetails);
      } else {
        setMezzoFiltrato(null);
      }
      
      setScadenze(scadenzeData);
      setStatistiche(statisticheData);
    } catch (err: any) {
      setError('Errore nel caricamento dei dati');
      console.error('Errore:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMezzo, autoveicoli]);

  useEffect(() => {
    if (autoveicoli.length > 0) {
      fetchData();
    }
  }, [fetchData, autoveicoli.length]);

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

  // NUOVO: Filtra le scadenze per mezzo se selezionato
  const getScadenzeFiltrate = () => {
    if (!scadenze) return { scaduteEUrgenti: [], prossimiTreGiorni: [] };
    
    if (!selectedMezzo) return scadenze;
    
    return {
      scaduteEUrgenti: scadenze.scaduteEUrgenti?.filter(
        m => m.autoveicolo._id === selectedMezzo
      ) || [],
      prossimiTreGiorni: scadenze.prossimiTreGiorni?.filter(
        m => m.autoveicolo._id === selectedMezzo
      ) || [],
      prossimeScadenze: scadenze.prossimeScadenze?.filter(
        m => m.autoveicolo._id === selectedMezzo
      ) || []
    };
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
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

  const scadenzeFiltrate = getScadenzeFiltrate();

  return (
    <Box sx={{ p: 3 }}>
      {/* Header con filtri */}
      <Grid container spacing={3} sx={{ mb: 3 }} alignItems="center">
        <Grid item xs={12} md={6}>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Build fontSize="large" color="primary" />
            Dashboard Manutenzioni
          </Typography>
          {mezzoFiltrato && (
            <Typography variant="subtitle1" color="text.secondary">
              Filtrato per: <strong>{mezzoFiltrato.targa}</strong> - {mezzoFiltrato.marca} {mezzoFiltrato.modello}
            </Typography>
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            {/* NUOVO: Selector mezzo */}
            <FormControl sx={{ minWidth: 250 }} size="small">
              <InputLabel>Filtra per Mezzo</InputLabel>
              <Select
                value={selectedMezzo}
                onChange={(e) => setSelectedMezzo(e.target.value)}
                label="Filtra per Mezzo"
                startAdornment={<DirectionsCar sx={{ mr: 1, color: 'text.secondary' }} />}
              >
                <MenuItem value="">
                  <em>Tutti i Mezzi</em>
                </MenuItem>
                {autoveicoli.map((auto) => (
                  <MenuItem key={auto._id} value={auto._id}>
                    {auto.targa} - {auto.marca} {auto.modello}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 120 }} size="small">
              <InputLabel>Anno</InputLabel>
              <Select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                label="Anno"
              >
                {availableYears.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/manutenzioni/new')}
            >
              Nuova
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Badge filtro attivo */}
      {selectedMezzo && (
        <Alert severity="info" sx={{ mb: 3 }} icon={<FilterList />}>
          Stai visualizzando le statistiche per il mezzo <strong>{mezzoFiltrato?.targa}</strong>.
          Le statistiche per autoveicolo non sono disponibili quando si filtra per un singolo mezzo.
          <Button 
            size="small" 
            onClick={() => setSelectedMezzo('')}
            sx={{ ml: 2 }}
          >
            Rimuovi Filtro
          </Button>
        </Alert>
      )}

      {/* Cards riepilogative */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#fff3e0', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="warning.main">
                    {scadenzeFiltrate.scaduteEUrgenti?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Scadute/Urgenti
                  </Typography>
                </Box>
                <Warning sx={{ fontSize: 48, color: 'warning.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#e3f2fd', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="info.main">
                    {scadenzeFiltrate.prossimiTreGiorni?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Prossimi 3 Giorni
                  </Typography>
                </Box>
                <Schedule sx={{ fontSize: 48, color: 'info.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#f3e5f5', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="primary.main">
                    {formatCurrency(calcolaTotaleAnno())}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Costo Totale {selectedYear}
                  </Typography>
                </Box>
                <Euro sx={{ fontSize: 48, color: 'primary.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#e8f5e9', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="success.main">
                    {formatCurrency(calcolaMediaMensile())}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Media Mensile
                  </Typography>
                </Box>
                <CalendarMonth sx={{ fontSize: 48, color: 'success.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sezione grafici */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Manutenzioni scadute/urgenti */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Warning color="warning" />
              Manutenzioni Urgenti
            </Typography>
            {scadenzeFiltrate.scaduteEUrgenti && scadenzeFiltrate.scaduteEUrgenti.length > 0 ? (
              <List sx={{ maxHeight: 320, overflow: 'auto' }}>
                {scadenzeFiltrate.scaduteEUrgenti.map((manutenzione) => (
                  <ListItem
                    key={manutenzione._id}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      backgroundColor: manutenzione.priorita === 'Urgente' ? '#ffebee' : 'background.paper'
                    }}
                  >
                    <ListItemIcon>
                      <Avatar 
                        sx={{ 
                          bgcolor: getPrioritaColor(manutenzione.priorita),
                          width: 32,
                          height: 32
                        }}
                      >
                        {getStatoIcon(manutenzione.stato)}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {manutenzione.autoveicolo.targa} - {manutenzione.tipoManutenzione}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {manutenzione.descrizione}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                          <Chip 
                            label={manutenzione.priorita}
                            size="small"
                            sx={{ 
                              backgroundColor: getPrioritaColor(manutenzione.priorita),
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                          />
                          <Typography variant="caption">
                            {formatDate(manutenzione.dataProgrammata)}
                          </Typography>
                        </Box>
                      }
                    />
                    <Tooltip title="Visualizza">
                      <IconButton 
                        size="small"
                        onClick={() => navigate(`/manutenzioni/${manutenzione._id}`)}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center', 
                height: 320 
              }}>
                <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
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
              {selectedMezzo && mezzoFiltrato && (
                <Chip 
                  label={`${mezzoFiltrato.targa}`} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
              )}
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
                  {selectedMezzo && ` e il mezzo ${mezzoFiltrato?.targa}`}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Grafici secondari */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Grafico manutenzioni per tipo */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Assessment />
              Manutenzioni per Tipo ({selectedYear})
            </Typography>
            {statistiche?.statistichePerTipo && statistiche.statistichePerTipo.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={statistiche.statistichePerTipo}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ _id, count }) => `${_id} (${count})`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {statistiche.statistichePerTipo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: number, name: string, props: any) => [
                      `${value} manutenzioni - ${formatCurrency(props.payload.costoTotale)}`,
                      props.payload._id
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
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
                  Nessun dato disponibile
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Grafico manutenzioni per fornitore */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person />
              Top Fornitori ({selectedYear})
            </Typography>
            {statistiche?.statistichePerFornitore && statistiche.statistichePerFornitore.length > 0 ? (
              <List sx={{ maxHeight: 320, overflow: 'auto' }}>
                {statistiche.statistichePerFornitore.slice(0, 5).map((fornitore, index) => (
                  <ListItem key={index} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: COLORS[index % COLORS.length] }}>
                        {index + 1}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={fornitore._id}
                      secondary={
                        <Box>
                          <Typography variant="caption">
                            {fornitore.count} interventi
                          </Typography>
                          <Typography variant="body2" color="primary" fontWeight="bold">
                            {formatCurrency(fornitore.costoTotale)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
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
                  Nessun dato disponibile
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Grafico manutenzioni per autoveicolo - NASCOSTO SE FILTRIAMO PER UN MEZZO */}
        {!selectedMezzo && (
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: 400 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DirectionsCar />
                Manutenzioni per Mezzo ({selectedYear})
              </Typography>
              {statistiche?.statistichePerAutoveicolo && statistiche.statistichePerAutoveicolo.length > 0 ? (
                <List sx={{ maxHeight: 320, overflow: 'auto' }}>
                  {statistiche.statistichePerAutoveicolo.slice(0, 5).map((auto, index) => (
                    <ListItem 
                      key={index} 
                      sx={{ 
                        borderBottom: '1px solid', 
                        borderColor: 'divider',
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: 'action.hover' }
                      }}
                      onClick={() => setSelectedMezzo(auto._id)}
                    >
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: COLORS[index % COLORS.length] }}>
                          <DirectionsCar />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={`${auto.autoveicolo.targa} - ${auto.autoveicolo.marca} ${auto.autoveicolo.modello}`}
                        secondary={
                          <Box>
                            <Typography variant="caption">
                              {auto.count} interventi
                            </Typography>
                            <Typography variant="body2" color="primary" fontWeight="bold">
                              {formatCurrency(auto.costoTotale)}
                            </Typography>
                          </Box>
                        }
                      />
                      <Tooltip title="Filtra per questo mezzo">
                        <IconButton size="small">
                          <FilterList />
                        </IconButton>
                      </Tooltip>
                    </ListItem>
                  ))}
                </List>
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
                    Nessun dato disponibile
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Prossimi interventi */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Schedule />
              Prossimi Interventi (3 Giorni)
            </Typography>
            {scadenzeFiltrate.prossimiTreGiorni && scadenzeFiltrate.prossimiTreGiorni.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Stato</TableCell>
                      <TableCell>Veicolo</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Descrizione</TableCell>
                      <TableCell>Data</TableCell>
                      <TableCell>Priorità</TableCell>
                      <TableCell>Azioni</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {scadenzeFiltrate.prossimiTreGiorni.map((manutenzione) => (
                      <TableRow key={manutenzione._id} hover>
                        <TableCell>
                          {getStatoIcon(manutenzione.stato)}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {manutenzione.autoveicolo.targa}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {manutenzione.autoveicolo.marca} {manutenzione.autoveicolo.modello}
                          </Typography>
                        </TableCell>
                        <TableCell>{manutenzione.tipoManutenzione}</TableCell>
                        <TableCell>{manutenzione.descrizione}</TableCell>
                        <TableCell>{formatDate(manutenzione.dataProgrammata)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={manutenzione.priorita}
                            size="small"
                            sx={{ 
                              backgroundColor: getPrioritaColor(manutenzione.priorita),
                              color: 'white'
                            }}
                          />
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
                  {selectedMezzo && ` per il mezzo ${mezzoFiltrato?.targa}`}
                </Typography>
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardManutenzioni;