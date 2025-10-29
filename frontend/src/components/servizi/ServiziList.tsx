// src/components/servizi/ServiziList.tsx - CON CALENDARIO PLANNER E LocalizationProvider
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
  Tabs,
  Tab,
  Alert,
  AlertProps,
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
  ListAlt as ListIcon,
  CalendarMonth as CalendarIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import 'dayjs/locale/it';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { serviziService } from '../../services/serviziService';
import { Servizio, StatoServizio } from '../../types/Servizio';
import { AutistaListItem } from '../../types/Autista';
import ServizioForm from './ServizioForm';
import ServizioDetailModal from './ServizioDetailModal';
import ServiziCalendarioPlanner from './ServiziCalendarioPlanner';
import FoglioLavoroGiornaliero from './FoglioLavoroGiornaliero';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface AlertState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box>{children}</Box>}
  </div>
);

// Helper per estrarre il nome dell'autista
function getAutistaName(autista: string | AutistaListItem | undefined): string {
  if (!autista) return '-';
  
  if (typeof autista === 'string') {
    return autista;
  }
  
  if (autista && typeof autista === 'object' && 'nome' in autista && 'cognome' in autista) {
    return `${autista.nome} ${autista.cognome}`.trim();
  }
  
  return '-';
}

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
  const [alert, setAlert] = useState<AlertState>({
    open: false,
    message: '',
    severity: 'info',
  });
  
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
        (typeof servizio.autista === 'string' && servizio.autista.toLowerCase().includes(term)) ||
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
        setAlert({
          open: true,
          message: 'Servizio eliminato con successo',
          severity: 'success',
        });
      } catch (error) {
        console.error('Errore eliminazione:', error);
        setAlert({
          open: true,
          message: "Errore durante l'eliminazione del servizio",
          severity: 'error',
        });
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
        setAlert({
          open: true,
          message: 'Servizio completato con successo',
          severity: 'success',
        });
      } catch (error) {
        console.error('Errore completamento:', error);
        setAlert({
          open: true,
          message: 'Errore durante il completamento del servizio',
          severity: 'error',
        });
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
        setAlert({
          open: true,
          message: 'Servizio annullato con successo',
          severity: 'success',
        });
      } catch (error) {
        console.error('Errore annullamento:', error);
        setAlert({
          open: true,
          message: "Errore durante l'annullamento del servizio",
          severity: 'error',
        });
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

  const handleFormSuccess = React.useCallback(() => {
    setShowForm(false);
    setSelectedServizio(null);
    // Reload data
    serviziService.getAll({ limit: 10000 }).then(response => {
      setAllData(response.data || []);
    });
  }, []);

  const handleFormCancel = React.useCallback(() => {
    setShowForm(false);
    setSelectedServizio(null);
  }, []);

  const handleDetailClose = React.useCallback(() => {
    setShowDetail(false);
    setSelectedServizio(null);
  }, []);

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="it">
      <Box sx={{ width: '100%' }}>
        {/* ALERT */}
        {alert.open && (
          <Alert 
            severity={alert.severity}
            onClose={handleCloseAlert}
            sx={{ mb: 2 }}
          >
            {alert.message}
          </Alert>
        )}

        {/* HEADER */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" fontWeight={700}>
            <ServicesIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Gestione Servizi
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedServizio(null);
              setShowForm(true);
            }}
          >
            Nuovo Servizio
          </Button>
        </Box>

        {/* TABS */}
        <Paper sx={{ mb: 2 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab icon={<ListIcon />} label="Elenco" />
            <Tab icon={<CalendarIcon />} label="Calendario" />
            <Tab icon={<PrintIcon />} label="Foglio Lavoro" />
          </Tabs>
        </Paper>

        <TabPanel value={activeTab} index={0}>
          {/* FILTRI E RICERCA */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
              <TextField
                fullWidth
                placeholder="Cerca servizio..."
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
              
              <FormControl fullWidth>
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
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Tipo Servizio</InputLabel>
                <Select
                  value={tipoFilter}
                  label="Tipo Servizio"
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
                </Select>
              </FormControl>
            </Box>
          </Paper>

          {/* TABELLA */}
          {paginatedData.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="textSecondary">
                Nessun servizio trovato
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell>Titolo</TableCell>
                    <TableCell>Autista</TableCell>
                    <TableCell>Veicolo</TableCell>
                    <TableCell>Data Inizio</TableCell>
                    <TableCell>Stato</TableCell>
                    <TableCell>Priorità</TableCell>
                    <TableCell align="right">Azioni</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedData.map((servizio) => (
                    <TableRow key={servizio._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {servizio.titolo}
                        </Typography>
                      </TableCell>
                      <TableCell>{getAutistaName(servizio.autista)}</TableCell>
                      <TableCell>{servizio.autoveicolo?.targa || '-'}</TableCell>
                      <TableCell>
                        {dayjs(servizio.dataInizio).format('DD/MM/YYYY')}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={servizio.stato}
                          color={servizio.stato === 'Completato' ? 'success' : 'default'}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={servizio.priorita}
                          size="small"
                          color={servizio.priorita === 'Urgente' ? 'error' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Visualizza">
                          <IconButton
                            size="small"
                            onClick={() => handleView(servizio)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Modifica">
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(servizio)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Menu">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, servizio)}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                count={filteredData.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
              />
            </TableContainer>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <ServiziCalendarioPlanner servizi={allData} />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <FoglioLavoroGiornaliero servizi={allData} />
        </TabPanel>

        {/* MENU AZIONI */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => menuServizio && handleCompleta(menuServizio)}>
            <ListItemIcon>
              <CompleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Completa</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => menuServizio && handleAnnulla(menuServizio)}>
            <ListItemIcon>
              <CancelIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Annulla</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => menuServizio && handleDelete(menuServizio)}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Elimina</ListItemText>
          </MenuItem>
        </Menu>

        {/* FORM DIALOG */}
        <Dialog
          open={showForm}
          onClose={handleFormCancel}
          maxWidth="lg"
          fullWidth
        >
          <ServizioForm
            servizio={selectedServizio}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </Dialog>

        {/* DETAIL MODAL */}
        {selectedServizio && showDetail && (
          <ServizioDetailModal
            servizio={selectedServizio}
            onClose={handleDetailClose}
          />
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default ServiziList;