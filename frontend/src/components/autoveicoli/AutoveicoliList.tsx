// src/components/autoveicoli/AutoveicoliList.tsx
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Dialog,
  CircularProgress,
  Menu,
  ListItemIcon,
  ListItemText,
  Fab,
  Toolbar,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  DirectionsCar,
  SellOutlined,
  Delete as DemolisciIcon,
  Close as ChiudiIcon,
  Receipt,
  Security,
  CheckCircle,
  Update as UpdateIcon,
  CalendarMonth as CalendarIcon,
  ArticleOutlined,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/it';
import { autoveicoliService } from '../../services/autoveicoliService';
import { Autoveicolo, TUTTI_TIPI_CARROZZERIA, calcolaProssimaRevisione, getIntervalliRevisione } from '../../types/Autoveicolo';
import AutoveicoloForm from './AutoveicoloForm';
import AutoveicoloDetailModal from './AutoveicoloDetailModal';
import EnhancedDatePicker from '../common/EnhancedDatePicker';
import getDatePickerConfig from '../../config/datePickerConfig';

const AutoveicoliList: React.FC = () => {
  const datePickerConfig = getDatePickerConfig();
  const [autoveicoli, setAutoveicoli] = useState<Autoveicolo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStato, setFilterStato] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedAutoveicolo, setSelectedAutoveicolo] = useState<Autoveicolo | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuAutoveicolo, setMenuAutoveicolo] = useState<Autoveicolo | null>(null);
  
  
  // Stati per dialog di aggiornamento rapido
  const [showQuickUpdate, setShowQuickUpdate] = useState(false);
  const [quickUpdateType, setQuickUpdateType] = useState<'bollo' | 'assicurazione' | 'revisione' | null>(null);
  const [quickUpdateValue, setQuickUpdateValue] = useState<dayjs.Dayjs | null>(null);
  const [quickUpdateLoading, setQuickUpdateLoading] = useState(false);
  

  useEffect(() => {
    fetchAutoveicoli();
  }, []);

  const fetchAutoveicoli = async () => {
    try {
      setLoading(true);
      const response = await autoveicoliService.getAll();
      setAutoveicoli(response.data);
    } catch (error) {
      console.error('Errore nel caricamento autoveicoli:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, autoveicolo: Autoveicolo) => {
    setAnchorEl(event.currentTarget);
    setMenuAutoveicolo(autoveicolo);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuAutoveicolo(null);
  };

  const handleView = (autoveicolo: Autoveicolo) => {
    setSelectedAutoveicolo(autoveicolo);
    setShowDetail(true);
    handleMenuClose();
  };

  const handleEdit = (autoveicolo: Autoveicolo) => {
    setSelectedAutoveicolo(autoveicolo);
    setShowForm(true);
    handleMenuClose();
  };

  const handleDelete = async (autoveicolo: Autoveicolo) => {
    if (window.confirm('Sei sicuro di voler eliminare questo autoveicolo?')) {
      try {
        await autoveicoliService.delete(autoveicolo._id);
        await fetchAutoveicoli();
      } catch (error) {
        console.error('Errore nella eliminazione:', error);
      }
    }
    handleMenuClose();
  };

  const handleVendi = async (autoveicolo: Autoveicolo) => {
    if (window.confirm('Sei sicuro di voler vendere questo autoveicolo?')) {
      try {
        await autoveicoliService.vendi(autoveicolo._id);
        await fetchAutoveicoli();
      } catch (error) {
        console.error('Errore nella vendita:', error);
      }
    }
    handleMenuClose();
  };

  const handleDemolisci = async (autoveicolo: Autoveicolo) => {
    const datiDemolitore = prompt('Inserisci i dati del demolitore:');
    if (datiDemolitore !== null) {
      try {
        await autoveicoliService.demolisci(autoveicolo._id, {
          datiDemolitore,
          dataDemolizione: new Date().toISOString()
        });
        await fetchAutoveicoli();
      } catch (error) {
        console.error('Errore nella demolizione:', error);
      }
    }
    handleMenuClose();
  };

  const handleChiudiNoleggio = async (autoveicolo: Autoveicolo) => {
    if (window.confirm('Sei sicuro di voler chiudere il noleggio di questo autoveicolo?')) {
      try {
        await autoveicoliService.update(autoveicolo._id, { stato: 'Chiuso' });
        await fetchAutoveicoli();
      } catch (error) {
        console.error('Errore nella chiusura noleggio:', error);
      }
    }
    handleMenuClose();
  };

  // Aggiornamento rapido scadenze
  const openQuickUpdate = (type: 'bollo' | 'assicurazione' | 'revisione', autoveicolo: Autoveicolo) => {
    setSelectedAutoveicolo(autoveicolo);
    setQuickUpdateType(type);
    setQuickUpdateValue(
      type === 'bollo' 
        ? dayjs(autoveicolo.dataScadenzaBollo) 
        : type === 'assicurazione' 
        ? dayjs(autoveicolo.dataScadenzaAssicurazione)
        : null
    );
    setShowQuickUpdate(true);
    handleMenuClose();
  };

  const handleQuickUpdate = async () => {
    if (!selectedAutoveicolo || !quickUpdateType || !quickUpdateValue) return;

    try {
      setQuickUpdateLoading(true);
      const updateData: Partial<Autoveicolo> = {};

      if (quickUpdateType === 'bollo') {
        updateData.dataScadenzaBollo = quickUpdateValue.toDate();
      } else if (quickUpdateType === 'assicurazione') {
        updateData.dataScadenzaAssicurazione = quickUpdateValue.toDate();
        updateData.dataInizioAssicurazione = quickUpdateValue.subtract(1, 'year').toDate();
      } else if (quickUpdateType === 'revisione') {
        updateData.ultimaRevisione = quickUpdateValue.toDate();
      }

      await autoveicoliService.update(selectedAutoveicolo._id, updateData);
      await fetchAutoveicoli();
      setShowQuickUpdate(false);
    } catch (error) {
      console.error('Errore nell\'aggiornamento:', error);
    } finally {
      setQuickUpdateLoading(false);
    }
  };

  const filteredAutoveicoli = autoveicoli.filter(auto => {
    const matchesSearch = 
      auto.targa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      auto.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      auto.modello.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStato = filterStato === '' || auto.stato === filterStato;
    const matchesTipo = filterTipo === '' || auto.tipoCarrozzeria === filterTipo;
    
    return matchesSearch && matchesStato && matchesTipo;
  });

  const getStatusChip = (stato: string) => {
    const colors: Record<string, "primary" | "secondary" | "error" | "warning" | "info" | "success"> = {
      'Attivo': 'success',
      'Venduto': 'primary',
      'Chiuso': 'warning',
      'Demolito': 'error',
    };

    return <Chip label={stato} color={colors[stato] || 'info'} size="small" />;
  };

  // Funzione aggiornata per gli alert chips con nuova logica revisioni
  const getAlertChips = (autoveicolo: Autoveicolo): React.ReactElement[] => {
    const chips: React.ReactElement[] = [];
    const oggi = dayjs();
    const unMese = dayjs().add(30, 'day');
    const seiMesi = dayjs().add(180, 'day');
    
    // Check bollo
    if (dayjs(autoveicolo.dataScadenzaBollo).isBefore(unMese)) {
      chips.push(
        <Chip 
          key="bollo" 
          label="Bollo" 
          color="warning" 
          size="small" 
          icon={<Receipt />} 
          onClick={(e) => {
            e.stopPropagation();
            openQuickUpdate('bollo', autoveicolo);
          }}
          sx={{ cursor: 'pointer' }}
        />
      );
    }
    
    // Check assicurazione
    if (dayjs(autoveicolo.dataScadenzaAssicurazione).isBefore(unMese)) {
      chips.push(
        <Chip 
          key="assicurazione" 
          label="Assicurazione" 
          color="warning" 
          size="small" 
          icon={<Security />} 
          onClick={(e) => {
            e.stopPropagation();
            openQuickUpdate('assicurazione', autoveicolo);
          }}
          sx={{ cursor: 'pointer' }}
        />
      );
    }
    
    // Check revisione - NUOVA LOGICA basata sul tipo di carrozzeria
    const prossimaRevisione = dayjs(calcolaProssimaRevisione(autoveicolo));
    const intervalli = getIntervalliRevisione(autoveicolo.tipoCarrozzeria);
    
    // Determina quando mostrare l'alert in base al tipo di revisione
    let sogliaTempo;
    if (intervalli.revisioniSuccessive === 1) {
      // Per revisioni annuali, mostra alert 2 mesi prima
      sogliaTempo = oggi.add(60, 'day');
    } else {
      // Per revisioni biennali/quadriennali, mostra alert quando è scaduta o entro 30 giorni
      sogliaTempo = oggi.add(30, 'day');
    }
    
    if (prossimaRevisione.isBefore(sogliaTempo)) {
      const isUrgent = prossimaRevisione.isBefore(oggi);
      const tipoRevisionLabel = intervalli.revisioniSuccessive === 1 ? 'Rev. Annuale' : 'Revisione';
      
      chips.push(
        <Chip 
          key="revisione" 
          label={tipoRevisionLabel}
          color={isUrgent ? "error" : "warning"}
          size="small" 
          icon={<CheckCircle />} 
          onClick={(e) => {
            e.stopPropagation();
            openQuickUpdate('revisione', autoveicolo);
          }}
          sx={{ cursor: 'pointer' }}
        />
      );
    }
    
    // Check titoli di proprietà (per leasing e noleggio)
    if (autoveicolo.scadenzaTitoloProprietà && ['Leasing', 'Noleggio'].includes(autoveicolo.tipologiaAcquisto)) {
      const dataScadenza = dayjs(autoveicolo.scadenzaTitoloProprietà);
      if (dataScadenza.isBefore(seiMesi)) {
        chips.push(
          <Chip 
            key="titolo_proprieta" 
            label="Titolo Proprietà" 
            color={dataScadenza.isBefore(dayjs().add(90, 'day')) ? 'error' : 'warning'}
            size="small" 
            icon={<ArticleOutlined />} 
            onClick={(e) => {
              e.stopPropagation();
              // Potresti voler aggiungere una funzione per aggiornare anche questo
            }}
            sx={{ cursor: 'pointer' }}
          />
        );
      }
    }
    
    return chips;
  };

  // Funzione per ottenere il chip del tipo di revisione
  const getRevisionTypeChip = (tipoCarrozzeria: Autoveicolo['tipoCarrozzeria']) => {
    const intervalli = getIntervalliRevisione(tipoCarrozzeria);
    
    if (intervalli.revisioniSuccessive === 1) {
      return <Chip label="Rev. Annuale" color="warning" size="small" />;
    } else {
      return <Chip label="Rev. Biennale" color="info" size="small" />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="it">
      <Box>
        {/* Header */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DirectionsCar /> Gestione Autoveicoli
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedAutoveicolo(null);
                setShowForm(true);
              }}
              size="large"
            >
              Nuovo Autoveicolo
            </Button>
          </Box>

          {/* Filtri - AGGIORNATI */}
          <Toolbar sx={{ px: 0, gap: 2 }}>
            <TextField
              placeholder="Cerca per targa, marca o modello..."
              value={searchTerm}
              onChange={handleSearch}
              sx={{ minWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Stato</InputLabel>
              <Select
                value={filterStato}
                label="Stato"
                onChange={(e) => setFilterStato(e.target.value)}
              >
                <MenuItem value="">Tutti</MenuItem>
                <MenuItem value="Attivo">Attivo</MenuItem>
                <MenuItem value="Venduto">Venduto</MenuItem>
                <MenuItem value="Chiuso">Chiuso</MenuItem>
                <MenuItem value="Demolito">Demolito</MenuItem>
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Tipo Carrozzeria</InputLabel>
              <Select
                value={filterTipo}
                label="Tipo Carrozzeria"
                onChange={(e) => setFilterTipo(e.target.value)}
              >
                <MenuItem value="">Tutti</MenuItem>
                {TUTTI_TIPI_CARROZZERIA.map((tipo) => (
                  <MenuItem key={tipo} value={tipo}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span>{tipo}</span>
                      {getRevisionTypeChip(tipo)}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Toolbar>
        </Paper>

        {/* Tabella Autoveicoli */}
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.light' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Targa</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Veicolo</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tipo</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tipologia</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Stato</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Alert</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAutoveicoli.map((autoveicolo) => (
                <TableRow key={autoveicolo._id} hover>
                  <TableCell sx={{ fontWeight: 'medium' }}>
                    {autoveicolo.targa}
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        {autoveicolo.marca} {autoveicolo.modello}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {['Semirimorchio', 'Rimorchio < 3.5 ton', 'Rimorchio > 3.5 ton'].includes(autoveicolo.tipoCarrozzeria) 
                          ? 'Rimorchio/Semirimorchio' 
                          : `${autoveicolo.cilindrata}cc - ${autoveicolo.kw}kW`
                        }
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {autoveicolo.tipoCarrozzeria}
                      </Typography>
                      {getRevisionTypeChip(autoveicolo.tipoCarrozzeria)}
                    </Box>
                  </TableCell>
                  <TableCell>{autoveicolo.tipologiaAcquisto}</TableCell>
                  <TableCell>{getStatusChip(autoveicolo.stato)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {getAlertChips(autoveicolo)}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, autoveicolo)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filteredAutoveicoli.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">
                      Nessun autoveicolo trovato
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Menu Contestuale */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleView(menuAutoveicolo!)}>
            <ListItemIcon>
              <VisibilityIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Visualizza Dettagli</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleEdit(menuAutoveicolo!)}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Modifica</ListItemText>
          </MenuItem>
          {menuAutoveicolo?.stato === 'Attivo' && (
            <>
              <MenuItem onClick={() => openQuickUpdate('bollo', menuAutoveicolo!)}>
                <ListItemIcon>
                  <Receipt fontSize="small" />
                </ListItemIcon>
                <ListItemText>Aggiorna Bollo</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => openQuickUpdate('assicurazione', menuAutoveicolo!)}>
                <ListItemIcon>
                  <Security fontSize="small" />
                </ListItemIcon>
                <ListItemText>Aggiorna Assicurazione</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => openQuickUpdate('revisione', menuAutoveicolo!)}>
                <ListItemIcon>
                  <CheckCircle fontSize="small" />
                </ListItemIcon>
                <ListItemText>
                  Aggiorna Revisione 
                  {menuAutoveicolo && getRevisionTypeChip(menuAutoveicolo.tipoCarrozzeria)}
                </ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => handleVendi(menuAutoveicolo!)}>
                <ListItemIcon>
                  <SellOutlined fontSize="small" />
                </ListItemIcon>
                <ListItemText>Vendi</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleDemolisci(menuAutoveicolo!)}>
                <ListItemIcon>
                  <DemolisciIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Demolisci</ListItemText>
              </MenuItem>
              {menuAutoveicolo?.tipologiaAcquisto === 'Noleggio' && (
                <MenuItem onClick={() => handleChiudiNoleggio(menuAutoveicolo!)}>
                  <ListItemIcon>
                    <ChiudiIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Chiudi Noleggio</ListItemText>
                </MenuItem>
              )}
            </>
          )}
          <Divider />
          <MenuItem onClick={() => handleDelete(menuAutoveicolo!)} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Elimina</ListItemText>
          </MenuItem>
        </Menu>

        {/* Dialog Aggiornamento Rapido */}
        <Dialog 
          open={showQuickUpdate} 
          onClose={() => setShowQuickUpdate(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Aggiorna {quickUpdateType === 'bollo' ? 'Bollo' : quickUpdateType === 'assicurazione' ? 'Assicurazione' : 'Revisione'}
            {selectedAutoveicolo && quickUpdateType === 'revisione' && (
              <Box sx={{ mt: 1 }}>
                {getRevisionTypeChip(selectedAutoveicolo.tipoCarrozzeria)}
              </Box>
            )}
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={2}>
              {selectedAutoveicolo && `${selectedAutoveicolo.marca} ${selectedAutoveicolo.modello} - ${selectedAutoveicolo.targa}`}
            </Typography>
            <EnhancedDatePicker
              label={`Nuova data ${quickUpdateType === 'bollo' ? 'scadenza bollo' : quickUpdateType === 'assicurazione' ? 'scadenza assicurazione' : 'ultima revisione'}`}
              value={quickUpdateValue}
              onChange={(newValue) => setQuickUpdateValue(newValue)}
              fullWidth={true}
              {...datePickerConfig}
            />
            {quickUpdateType === 'assicurazione' && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                La data di inizio verrà automaticamente impostata a 1 anno prima
              </Typography>
            )}
            {quickUpdateType === 'revisione' && selectedAutoveicolo && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Tipo veicolo: {selectedAutoveicolo.tipoCarrozzeria}
                <br />
                {getIntervalliRevisione(selectedAutoveicolo.tipoCarrozzeria).revisioniSuccessive === 1 
                  ? 'Prossima revisione tra 1 anno' 
                  : 'Prossima revisione tra 2 anni'}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowQuickUpdate(false)}>Annulla</Button>
            <Button 
              onClick={handleQuickUpdate} 
              variant="contained" 
              disabled={quickUpdateLoading || !quickUpdateValue}
            >
              {quickUpdateLoading ? 'Salvando...' : 'Salva'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialogs */}
        <Dialog 
          open={showForm} 
          onClose={() => setShowForm(false)}
          maxWidth="lg"
          fullWidth
        >
          <AutoveicoloForm
            autoveicolo={selectedAutoveicolo}
            onSuccess={() => {
              setShowForm(false);
              fetchAutoveicoli();
            }}
            onCancel={() => setShowForm(false)}
          />
        </Dialog>

        <Dialog 
          open={showDetail} 
          onClose={() => setShowDetail(false)}
          maxWidth="md"
          fullWidth
        >
          {selectedAutoveicolo && (
            <AutoveicoloDetailModal
              autoveicolo={selectedAutoveicolo}
              onClose={() => setShowDetail(false)}
              onRefresh={fetchAutoveicoli}
            />
          )}
        </Dialog>

        {/* Floating Action Button for mobile */}
        <Fab
          color="primary"
          aria-label="add"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            display: { xs: 'flex', md: 'none' }
          }}
          onClick={() => {
            setSelectedAutoveicolo(null);
            setShowForm(true);
          }}
        >
          <AddIcon />
        </Fab>
      </Box>
    </LocalizationProvider>
  );
};

export default AutoveicoliList;