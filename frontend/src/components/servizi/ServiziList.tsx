// src/components/servizi/ServiziList.tsx - CON CALENDARIO PLANNER
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Dialog,
  CircularProgress,
  TablePagination,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MiscellaneousServices as ServicesIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CompleteIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  ListAlt as ListIcon,
  CalendarMonth as CalendarIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/it';
import { serviziService } from '../../services/serviziService';
import { Servizio, StatoServizio, PrioritaServizio } from '../../types/Servizio';
import ServizioForm from './ServizioForm';
import ServizioDetailModal from './ServizioDetailModal';
import ServiziCalendarioPlanner from './ServiziCalendarioPlanner';
import FoglioLavoroGiornaliero from './FoglioLavoroGiornaliero';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box>{children}</Box>}
  </div>
);

const ServiziList: React.FC = () => {
  // STATI
  const [activeTab, setActiveTab] = useState(0);
  const [allData, setAllData] = useState<Servizio[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statoFilter, setStatoFilter] = useState<string>('');
  const [tipoFilter, setTipoFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [showForm, setShowForm] = useState(false);
  const [selectedServizio, setSelectedServizio] = useState<Servizio | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showStampa, setShowStampa] = useState(false);
  
  // STATI MENU
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuServizio, setMenuServizio] = useState<Servizio | null>(null);

  // FETCH DATI
  useEffect(() => {
    let isCancelled = false;
    
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await serviziService.getAll({ limit: 10000 });
        
        if (!isCancelled) {
          setAllData(response.data || []);
        }
      } catch (error) {
        console.error('Errore caricamento servizi:', error);
        if (!isCancelled) {
          setAllData([]);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadData();
    
    return () => {
      isCancelled = true;
    };
  }, []);

  // FILTRAGGIO
  const filteredData = React.useMemo(() => {
    let filtered = allData;
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(servizio => 
        servizio.titolo?.toLowerCase().includes(term) ||
        servizio.autista?.toLowerCase().includes(term) ||
        servizio.autoveicolo?.targa?.toLowerCase().includes(term)
      );
    }
    
    if (statoFilter) {
      filtered = filtered.filter(servizio => servizio.stato === statoFilter);
    }
    
    if (tipoFilter) {
      filtered = filtered.filter(servizio => servizio.tipoServizio === tipoFilter);
    }
    
    return filtered;
  }, [allData, searchTerm, statoFilter, tipoFilter]);

  // PAGINAZIONE
  const paginatedData = React.useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  // HANDLERS
  const handleSearchChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  }, []);

  const handlePageChange = React.useCallback((event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleRowsPerPageChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const handleEdit = React.useCallback((servizio: Servizio) => {
    setSelectedServizio(servizio);
    setShowForm(true);
    setAnchorEl(null);
  }, []);

  const handleView = React.useCallback((servizio: Servizio) => {
    setSelectedServizio(servizio);
    setShowDetail(true);
    setAnchorEl(null);
  }, []);

  const handleDelete = React.useCallback(async (servizio: Servizio) => {
    if (window.confirm(`Sei sicuro di voler eliminare il servizio "${servizio.titolo}"?`)) {
      try {
        await serviziService.delete(servizio._id);
        const response = await serviziService.getAll({ limit: 10000 });
        setAllData(response.data || []);
      } catch (error) {
        console.error('Errore eliminazione:', error);
        alert('Errore durante l\'eliminazione del servizio');
      }
    }
    setAnchorEl(null);
  }, []);

  const handleCompleta = React.useCallback(async (servizio: Servizio) => {
    if (window.confirm('Sei sicuro di voler completare questo servizio?')) {
      try {
        await serviziService.update(servizio._id, { 
          stato: 'Completato' as StatoServizio,
          completato: true,
          dataCompletamento: new Date()
        });
        const response = await serviziService.getAll({ limit: 10000 });
        setAllData(response.data || []);
      } catch (error) {
        console.error('Errore completamento:', error);
        alert('Errore durante il completamento del servizio');
      }
    }
    setAnchorEl(null);
  }, []);

  const handleAnnulla = React.useCallback(async (servizio: Servizio) => {
    if (window.confirm('Sei sicuro di voler annullare questo servizio?')) {
      try {
        await serviziService.update(servizio._id, { stato: 'Annullato' as StatoServizio });
        const response = await serviziService.getAll({ limit: 10000 });
        setAllData(response.data || []);
      } catch (error) {
        console.error('Errore annullamento:', error);
        alert('Errore durante l\'annullamento del servizio');
      }
    }
    setAnchorEl(null);
  }, []);

  const handleMenuOpen = React.useCallback((event: React.MouseEvent<HTMLElement>, servizio: Servizio) => {
    setAnchorEl(event.currentTarget);
    setMenuServizio(servizio);
  }, []);

  const handleMenuClose = React.useCallback(() => {
    setAnchorEl(null);
    setMenuServizio(null);
  }, []);

  const handleFormClose = React.useCallback(() => {
    setShowForm(false);
    setSelectedServizio(null);
  }, []);

  const handleFormSuccess = React.useCallback(async () => {
    setShowForm(false);
    setSelectedServizio(null);
    
    try {
      const response = await serviziService.getAll({ limit: 10000 });
      setAllData(response.data || []);
    } catch (error) {
      console.error('Errore ricaricamento:', error);
    }
  }, []);

  const getStatoColor = (stato: StatoServizio): "default" | "primary" | "success" | "warning" | "error" => {
    switch (stato) {
      case 'Programmato': return 'primary';
      case 'In corso': return 'warning';
      case 'Completato': return 'success';
      case 'Annullato': return 'error';
      case 'Posticipato': return 'default';
      default: return 'default';
    }
  };

  const getPrioritaColor = (priorita: PrioritaServizio): "default" | "primary" | "warning" | "error" => {
    switch (priorita) {
      case 'Bassa': return 'default';
      case 'Media': return 'primary';
      case 'Alta': return 'warning';
      case 'Urgente': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Caricamento servizi...</Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="it">
      <Box>
        {/* Header */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
            <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ServicesIcon /> Gestione Servizi
            </Typography>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={() => setShowStampa(true)}
              >
                Stampa Foglio Lavoro
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setSelectedServizio(null);
                  setShowForm(true);
                }}
              >
                Nuovo Servizio
              </Button>
            </Box>
          </Box>

          {/* Tabs Lista/Calendario */}
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab
              icon={<ListIcon />}
              iconPosition="start"
              label="Lista"
              sx={{ textTransform: 'none', fontWeight: 500 }}
            />
            <Tab
              icon={<CalendarIcon />}
              iconPosition="start"
              label="Calendario"
              sx={{ textTransform: 'none', fontWeight: 500 }}
            />
          </Tabs>
        </Paper>

        {/* TAB 1: LISTA */}
        <TabPanel value={activeTab} index={0}>
          {/* Filtri */}
          <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  placeholder="Cerca titolo, autista, targa..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Stato</InputLabel>
                  <Select
                    value={statoFilter}
                    label="Stato"
                    onChange={(e) => {
                      setStatoFilter(e.target.value);
                      setPage(0);
                    }}
                  >
                    <MenuItem value="">Tutti</MenuItem>
                    <MenuItem value="Programmato">Programmato</MenuItem>
                    <MenuItem value="In corso">In corso</MenuItem>
                    <MenuItem value="Completato">Completato</MenuItem>
                    <MenuItem value="Annullato">Annullato</MenuItem>
                    <MenuItem value="Posticipato">Posticipato</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={tipoFilter}
                    label="Tipo"
                    onChange={(e) => {
                      setTipoFilter(e.target.value);
                      setPage(0);
                    }}
                  >
                    <MenuItem value="">Tutti</MenuItem>
                    <MenuItem value="Trasporto">Trasporto</MenuItem>
                    <MenuItem value="Raccolta">Raccolta</MenuItem>
                    <MenuItem value="Consegna">Consegna</MenuItem>
                    <MenuItem value="Manutenzione">Manutenzione</MenuItem>
                    <MenuItem value="Ispezione">Ispezione</MenuItem>
                    <MenuItem value="Altro">Altro</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={1}>
                <Typography variant="body2" color="text.secondary" textAlign="right">
                  {filteredData.length} di {allData.length}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Tabella */}
          <TableContainer component={Paper} elevation={2}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Titolo</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Autoveicolo</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Autista</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tipo</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Data</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Priorità</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Stato</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Azioni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.map((servizio) => (
                  <TableRow key={servizio._id} hover>
                    <TableCell sx={{ fontWeight: 'medium' }}>
                      {servizio.titolo}
                    </TableCell>
                    <TableCell>
                      {servizio.autoveicolo?.targa || '-'}
                      <Typography variant="caption" display="block" color="text.secondary">
                        {servizio.autoveicolo?.marca} {servizio.autoveicolo?.modello}
                      </Typography>
                    </TableCell>
                    <TableCell>{servizio.autista}</TableCell>
                    <TableCell>
                      <Chip label={servizio.tipoServizio} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      {dayjs(servizio.dataInizio).format('DD/MM/YYYY')}
                      <Typography variant="caption" display="block" color="text.secondary">
                        {servizio.oraInizio} - {servizio.oraFine}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={servizio.priorita} 
                        color={getPrioritaColor(servizio.priorita)} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={servizio.stato} 
                        color={getStatoColor(servizio.stato)} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" gap={0.5} justifyContent="center" alignItems="center">
                        <Tooltip title="Visualizza" arrow>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleView(servizio)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Modifica" arrow>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEdit(servizio)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Elimina" arrow>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(servizio)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {servizio.stato !== 'Completato' && servizio.stato !== 'Annullato' && (
                          <Tooltip title="Altre azioni" arrow>
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, servizio)}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="textSecondary">
                        Nessun servizio trovato
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            
            <TablePagination
              rowsPerPageOptions={[25, 50, 100]}
              component="div"
              count={filteredData.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              labelRowsPerPage="Record per pagina:"
              labelDisplayedRows={({ from, to, count }) => 
                `${from}-${to} di ${count}`
              }
            />
          </TableContainer>
        </TabPanel>

        {/* TAB 2: CALENDARIO */}
        <TabPanel value={activeTab} index={1}>
          <ServiziCalendarioPlanner />
        </TabPanel>

        {/* Menu Azioni Aggiuntive */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          {menuServizio?.stato === 'Programmato' && (
            <MenuItem onClick={() => menuServizio && serviziService.update(menuServizio._id, { stato: 'In corso' as StatoServizio }).then(() => {
              serviziService.getAll({ limit: 10000 }).then(response => setAllData(response.data || []));
              handleMenuClose();
            })}>
              <ListItemIcon>
                <ScheduleIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Avvia Servizio</ListItemText>
            </MenuItem>
          )}
          {(menuServizio?.stato === 'In corso' || menuServizio?.stato === 'Programmato') && (
            <MenuItem onClick={() => menuServizio && handleCompleta(menuServizio)}>
              <ListItemIcon>
                <CompleteIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Completa</ListItemText>
            </MenuItem>
          )}
          <MenuItem onClick={() => menuServizio && handleAnnulla(menuServizio)}>
            <ListItemIcon>
              <CancelIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Annulla</ListItemText>
          </MenuItem>
        </Menu>

        {/* Dialog Form */}
        <Dialog 
          open={showForm} 
          onClose={handleFormClose}
          maxWidth="lg"
          fullWidth
        >
          <ServizioForm
            servizio={selectedServizio}
            onSuccess={handleFormSuccess}
            onCancel={handleFormClose}
          />
        </Dialog>

        {/* Dialog Dettagli */}
        <Dialog 
          open={showDetail} 
          onClose={() => setShowDetail(false)}
          maxWidth="md"
          fullWidth
        >
          {selectedServizio && (
            <ServizioDetailModal
              servizio={selectedServizio}
              onClose={() => setShowDetail(false)}
            />
          )}
        </Dialog>

        {/* Dialog Stampa Foglio Lavoro */}
        <FoglioLavoroGiornaliero
          open={showStampa}
          onClose={() => setShowStampa(false)}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default ServiziList;