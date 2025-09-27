// src/components/manutenzioni/ManutenzioniList.tsx - VERSIONE CORRETTA
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Button,
  Typography,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Tooltip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Collapse
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Search,
  Build,
  Warning,
  CheckCircle,
  Schedule,
  Cancel,
  Pause,
  ExpandMore,
  ExpandLess,
  Assessment,
  Clear,
  Download,
  Refresh
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/it';

import { manutenzioniService } from '../../services/manutenzioniService';
import { autoveicoliService } from '../../services/autoveicoliService';
import { 
  Manutenzione, 
  ManutenzioneFilters, 
  TIPI_MANUTENZIONE, 
  STATI_MANUTENZIONE, 
  PRIORITA_MANUTENZIONE 
} from '../../types/Manutenzione';
import { Autoveicolo } from '../../types/Autoveicolo';
import ManutenzioneModal from './ManutenzioneModal';
import ManutenzioneDetailModal from './ManutenzioneDetailModal';

// Setup dayjs
dayjs.extend(relativeTime);
dayjs.locale('it');

interface ListResponse<T> {
  success: boolean;
  count: number;
  total: number;
  pagination: {
    next?: { page: number; limit: number };
    prev?: { page: number; limit: number };
  };
  data: T[];
}

const ManutenzioniList: React.FC = () => {
  // State per dati
  const [manutenzioni, setManutenzioni] = useState<Manutenzione[]>([]);
  const [autoveicoli, setAutoveicoli] = useState<Autoveicolo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  // State per paginazione
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // State per modali
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedManutenzione, setSelectedManutenzione] = useState<Manutenzione | null>(null);

  // State per filtri
  const [filters, setFilters] = useState<ManutenzioneFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // State per statistiche rapide
  const [stats, setStats] = useState({
    totale: 0,
    urgenti: 0,
    programmata: 0,
    inCorso: 0,
    completata: 0
  });

  const fetchManutenzioni = useCallback(async () => {
    try {
      setLoading(true);
      const params: ManutenzioneFilters = {
        ...filters,
        page: page + 1,
        limit: rowsPerPage
      };
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      const response: ListResponse<Manutenzione> = await manutenzioniService.getAll(params);
      setManutenzioni(response.data || []);
      setTotalCount(response.total || 0);
      
      // Calcola statistiche rapide
      calculateStats(response.data || []);
      
    } catch (err: any) {
      setError('Errore nel caricamento delle manutenzioni');
      console.error('Errore:', err);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, filters, searchTerm]);

  const fetchAutoveicoli = useCallback(async () => {
    try {
      const response = await autoveicoliService.getAll({ limit: 1000 });
      setAutoveicoli(response.data?.filter(auto => auto.stato === 'Attivo') || []);
    } catch (err: any) {
      console.error('Errore caricamento autoveicoli:', err);
    }
  }, []);

  useEffect(() => {
    fetchManutenzioni();
  }, [fetchManutenzioni]);

  useEffect(() => {
    fetchAutoveicoli();
  }, [fetchAutoveicoli]);

  const calculateStats = (data: Manutenzione[]) => {
    const stats = data.reduce((acc, manutenzione) => {
      acc.totale++;
      if (manutenzione.priorita === 'Urgente') acc.urgenti++;
      
      switch (manutenzione.stato) {
        case 'Programmata':
          acc.programmata++;
          break;
        case 'In corso':
          acc.inCorso++;
          break;
        case 'Completata':
          acc.completata++;
          break;
      }
      
      return acc;
    }, {
      totale: 0,
      urgenti: 0,
      programmata: 0,
      inCorso: 0,
      completata: 0
    });
    
    setStats(stats);
  };

  const handleCreate = () => {
    setSelectedManutenzione(null);
    setCreateModalOpen(true);
  };

  const handleEdit = (manutenzione: Manutenzione) => {
    setSelectedManutenzione(manutenzione);
    setEditModalOpen(true);
  };

  const handleView = (manutenzione: Manutenzione) => {
    setSelectedManutenzione(manutenzione);
    setDetailModalOpen(true);
  };

  const handleDeleteConfirm = (manutenzione: Manutenzione) => {
    setSelectedManutenzione(manutenzione);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedManutenzione) return;
    
    try {
      await manutenzioniService.delete(selectedManutenzione._id);
      setDeleteDialogOpen(false);
      setSelectedManutenzione(null);
      await fetchManutenzioni(); // Ricarica i dati
    } catch (err: any) {
      console.error('Errore eliminazione:', err);
      setError('Errore durante l\'eliminazione');
    }
  };

  const getStatoChip = (stato: string) => {
    const configs = {
      'Programmata': { color: 'info' as const, icon: <Schedule fontSize="small" /> },
      'In corso': { color: 'warning' as const, icon: <Build fontSize="small" /> },
      'Completata': { color: 'success' as const, icon: <CheckCircle fontSize="small" /> },
      'Annullata': { color: 'error' as const, icon: <Cancel fontSize="small" /> },
      'Rimandata': { color: 'default' as const, icon: <Pause fontSize="small" /> }
    };

    const config = configs[stato as keyof typeof configs];
    
    return (
      <Chip
        size="small"
        icon={config?.icon}
        label={stato}
        color={config?.color || 'default'}
        variant="filled"
      />
    );
  };

  const getPrioritaChip = (priorita: string) => {
    const configs = {
      'Bassa': { color: 'default' as const, variant: 'outlined' as const },
      'Media': { color: 'info' as const, variant: 'outlined' as const },
      'Alta': { color: 'warning' as const, variant: 'filled' as const },
      'Urgente': { color: 'error' as const, variant: 'filled' as const }
    };

    const config = configs[priorita as keyof typeof configs];

    return (
      <Chip
        size="small"
        label={priorita}
        color={config?.color || 'default'}
        variant={config?.variant || 'outlined'}
        sx={{
          fontWeight: priorita === 'Urgente' ? 'bold' : 'normal',
          ...(priorita === 'Urgente' && {
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%': { transform: 'scale(1)' },
              '50%': { transform: 'scale(1.05)' },
              '100%': { transform: 'scale(1)' }
            }
          })
        }}
      />
    );
  };

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return '-';
    return dayjs(date).format('DD/MM/YYYY');
  };

  const formatDateWithRelative = (date: string | Date | undefined) => {
    if (!date) return '-';
    return dayjs(date).fromNow();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const calcolaCostoTotale = (manutenzione: Manutenzione): number => {
    if (!manutenzione.costi) return 0;
    const subtotale = (manutenzione.costi.manodopera || 0) + (manutenzione.costi.ricambi || 0) + (manutenzione.costi.altri || 0);
    const iva = subtotale * ((manutenzione.costi.iva || 0) / 100);
    return subtotale + iva;
  };

  const handleFilterChange = (field: keyof ManutenzioneFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value || undefined // Rimuovi il filtro se il valore è vuoto
    }));
    setPage(0); // Reset alla prima pagina
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setPage(0);
  };

  const handleSearch = () => {
    setPage(0);
    fetchManutenzioni();
  };

  const exportToCSV = () => {
    const headers = [
      'Veicolo',
      'Tipo',
      'Descrizione',
      'Data Programmata',
      'Data Esecuzione',
      'Stato',
      'Priorità',
      'Fornitore',
      'Costo Totale'
    ];

    const csvData = manutenzioni.map(m => [
      `${m.autoveicolo?.targa || 'N/A'} - ${m.autoveicolo?.marca || ''} ${m.autoveicolo?.modello || ''}`,
      m.tipoManutenzione || '',
      m.descrizione || '',
      formatDate(m.dataProgrammata),
      formatDate(m.dataEsecuzione),
      m.stato || '',
      m.priorita || '',
      (m.fornitore as any)?.nome || 'Non specificato', // Cast per gestire la discrepanza tra interfaccia e realtà
      m.stato === 'Completata' ? calcolaCostoTotale(m).toFixed(2) : '0'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `manutenzioni_${dayjs().format('YYYY-MM-DD')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={() => {
              setError('');
              fetchManutenzioni();
            }}>
              <Refresh /> Riprova
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="it">
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Gestione Manutenzioni
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Monitora e gestisci tutte le manutenzioni dei veicoli aziendali
          </Typography>
        </Box>

        {/* Statistiche Rapide */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3} md={2}>
            <Card sx={{ textAlign: 'center', backgroundColor: 'primary.light' }}>
              <CardContent sx={{ py: 1.5 }}>
                <Typography variant="h6" color="primary.dark">
                  {totalCount}
                </Typography>
                <Typography variant="caption" color="primary.dark">
                  Totali
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={3} md={2}>
            <Card sx={{ textAlign: 'center', backgroundColor: 'error.light' }}>
              <CardContent sx={{ py: 1.5 }}>
                <Typography variant="h6" color="error.dark">
                  {stats.urgenti}
                </Typography>
                <Typography variant="caption" color="error.dark">
                  Urgenti
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={3} md={2}>
            <Card sx={{ textAlign: 'center', backgroundColor: 'info.light' }}>
              <CardContent sx={{ py: 1.5 }}>
                <Typography variant="h6" color="info.dark">
                  {stats.programmata}
                </Typography>
                <Typography variant="caption" color="info.dark">
                  Programmate
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={3} md={2}>
            <Card sx={{ textAlign: 'center', backgroundColor: 'warning.light' }}>
              <CardContent sx={{ py: 1.5 }}>
                <Typography variant="h6" color="warning.dark">
                  {stats.inCorso}
                </Typography>
                <Typography variant="caption" color="warning.dark">
                  In Corso
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={3} md={2}>
            <Card sx={{ textAlign: 'center', backgroundColor: 'success.light' }}>
              <CardContent sx={{ py: 1.5 }}>
                <Typography variant="h6" color="success.dark">
                  {stats.completata}
                </Typography>
                <Typography variant="caption" color="success.dark">
                  Completate
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Toolbar */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Cerca manutenzioni..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                endAdornment: searchTerm && (
                  <IconButton size="small" onClick={() => setSearchTerm('')}>
                    <Clear />
                  </IconButton>
                )
              }}
              sx={{ minWidth: 250 }}
            />
            <Button
              variant="outlined"
              startIcon={showFilters ? <ExpandLess /> : <ExpandMore />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filtri
            </Button>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={exportToCSV}
              disabled={manutenzioni.length === 0}
            >
              Esporta
            </Button>
            <Button
              variant="outlined"
              startIcon={<Assessment />}
              onClick={() => window.open('/manutenzioni/dashboard', '_blank')}
            >
              Dashboard
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreate}
            >
              Nuova Manutenzione
            </Button>
          </Box>
        </Box>

        {/* Pannello Filtri */}
        <Collapse in={showFilters}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Filtri Avanzati
              </Typography>
              
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Veicolo</InputLabel>
                    <Select
                      value={filters.autoveicolo || ''}
                      onChange={(e) => handleFilterChange('autoveicolo', e.target.value)}
                      label="Veicolo"
                    >
                      <MenuItem value="">Tutti</MenuItem>
                      {autoveicoli.map(auto => (
                        <MenuItem key={auto._id} value={auto._id}>
                          {auto.targa} - {auto.marca} {auto.modello}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Stato</InputLabel>
                    <Select
                      value={filters.stato || ''}
                      onChange={(e) => handleFilterChange('stato', e.target.value)}
                      label="Stato"
                    >
                      <MenuItem value="">Tutti</MenuItem>
                      {STATI_MANUTENZIONE.map(stato => (
                        <MenuItem key={stato} value={stato}>{stato}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Tipo</InputLabel>
                    <Select
                      value={filters.tipoManutenzione || ''}
                      onChange={(e) => handleFilterChange('tipoManutenzione', e.target.value)}
                      label="Tipo"
                    >
                      <MenuItem value="">Tutti</MenuItem>
                      {TIPI_MANUTENZIONE.map(tipo => (
                        <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Priorità</InputLabel>
                    <Select
                      value={filters.priorita || ''}
                      onChange={(e) => handleFilterChange('priorita', e.target.value)}
                      label="Priorità"
                    >
                      <MenuItem value="">Tutte</MenuItem>
                      {PRIORITA_MANUTENZIONE.map(priorita => (
                        <MenuItem key={priorita} value={priorita}>{priorita}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={2}>
                  <DatePicker
                    label="Da Data"
                    value={filters.dataInizio ? dayjs(filters.dataInizio) : null}
                    onChange={(date) => handleFilterChange('dataInizio', date?.format('YYYY-MM-DD'))}
                    slotProps={{ 
                      textField: { 
                        fullWidth: true, 
                        size: 'small' 
                      } 
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={1}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      onClick={clearFilters}
                      size="small"
                      fullWidth
                    >
                      Reset
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Collapse>

        {/* Tabella */}
        <Paper sx={{ overflow: 'hidden' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={40} />
            </Box>
          ) : (
            <>
              <TableContainer sx={{ maxHeight: 600 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Veicolo</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Tipo</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Descrizione</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Data Programmata</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Stato</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Priorità</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Fornitore</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Costo</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Azioni</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {manutenzioni.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} sx={{ textAlign: 'center', py: 4 }}>
                          <Typography variant="body1" color="text.secondary">
                            {searchTerm || Object.keys(filters).length > 0 
                              ? 'Nessuna manutenzione trovata con i filtri applicati' 
                              : 'Nessuna manutenzione presente'
                            }
                          </Typography>
                          {!searchTerm && Object.keys(filters).length === 0 && (
                            <Button
                              variant="contained"
                              startIcon={<Add />}
                              onClick={handleCreate}
                              sx={{ mt: 2 }}
                            >
                              Crea Prima Manutenzione
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ) : (
                      manutenzioni.map((manutenzione) => (
                        <TableRow 
                          key={manutenzione._id} 
                          hover 
                          sx={{ 
                            cursor: 'pointer',
                            '&:hover': { backgroundColor: 'action.hover' }
                          }}
                          onClick={() => handleView(manutenzione)}
                        >
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {manutenzione.autoveicolo?.targa || 'N/A'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {manutenzione.autoveicolo?.marca || ''} {manutenzione.autoveicolo?.modello || ''}
                              </Typography>
                            </Box>
                          </TableCell>
                          
                          <TableCell>
                            <Chip 
                              size="small" 
                              label={manutenzione.tipoManutenzione || 'N/A'}
                              variant="outlined"
                              color="primary"
                            />
                          </TableCell>
                          
                          <TableCell>
                            <Tooltip title={manutenzione.descrizione || ''} arrow>
                              <Typography 
                                variant="body2" 
                                noWrap 
                                sx={{ 
                                  maxWidth: 200,
                                  cursor: 'help'
                                }}
                              >
                                {manutenzione.descrizione || 'N/A'}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          
                          <TableCell>
                            <Box>
                              <Typography variant="body2">
                                {formatDate(manutenzione.dataProgrammata)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDateWithRelative(manutenzione.dataProgrammata)}
                              </Typography>
                            </Box>
                          </TableCell>
                          
                          <TableCell>
                            {getStatoChip(manutenzione.stato)}
                          </TableCell>
                          
                          <TableCell>
                            {getPrioritaChip(manutenzione.priorita)}
                          </TableCell>
                          
                          <TableCell>
                            <Box>
                              <Typography variant="body2">
                                {(manutenzione.fornitore as any)?.nome || 'Non specificato'}
                              </Typography>
                              {(manutenzione.fornitore as any)?.telefono && (
                                <Typography variant="caption" color="text.secondary">
                                  {(manutenzione.fornitore as any).telefono}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          
                          <TableCell>
                            {manutenzione.stato === 'Completata' ? (
                              <Box>
                                <Typography variant="body2" fontWeight="bold">
                                  {formatCurrency(calcolaCostoTotale(manutenzione))}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  IVA {manutenzione.costi?.iva || 0}%
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                -
                              </Typography>
                            )}
                          </TableCell>
                          
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title="Visualizza" arrow>
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleView(manutenzione)}
                                  color="primary"
                                >
                                  <Visibility fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Modifica" arrow>
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleEdit(manutenzione)}
                                  color="info"
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Elimina" arrow>
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleDeleteConfirm(manutenzione)}
                                  color="error"
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {manutenzioni.length > 0 && (
                <TablePagination
                  component="div"
                  count={totalCount}
                  page={page}
                  onPageChange={(_, newPage) => setPage(newPage)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value));
                    setPage(0);
                  }}
                  rowsPerPageOptions={[5, 10, 25, 50, 100]}
                  labelRowsPerPage="Righe per pagina:"
                  labelDisplayedRows={({ from, to, count }) => 
                    `${from}-${to} di ${count !== -1 ? count : `più di ${to}`}`
                  }
                  showFirstButton
                  showLastButton
                />
              )}
            </>
          )}
        </Paper>

        {/* Modali */}
        <ManutenzioneModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSave={() => {
            setCreateModalOpen(false);
            fetchManutenzioni();
          }}
          manutenzione={null}
        />

        <ManutenzioneModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSave={() => {
            setEditModalOpen(false);
            fetchManutenzioni();
          }}
          manutenzione={selectedManutenzione}
        />

        <ManutenzioneDetailModal
          open={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          manutenzione={selectedManutenzione}
          onEdit={() => {
            setDetailModalOpen(false);
            setEditModalOpen(true);
          }}
          onRefresh={fetchManutenzioni}
        />

        {/* Dialog conferma eliminazione */}
        <Dialog 
          open={deleteDialogOpen} 
          onClose={() => setDeleteDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Warning color="error" />
              Conferma Eliminazione
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography>
              Sei sicuro di voler eliminare la manutenzione <strong>"{selectedManutenzione?.descrizione}"</strong> 
              per il veicolo <strong>{selectedManutenzione?.autoveicolo?.targa}</strong>?
            </Typography>
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Questa azione non può essere annullata. Tutti gli allegati associati verranno eliminati definitivamente.
              </Typography>
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>
              Annulla
            </Button>
            <Button 
              onClick={handleDelete} 
              color="error" 
              variant="contained"
              startIcon={<Delete />}
            >
              Elimina Definitivamente
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default ManutenzioniList;