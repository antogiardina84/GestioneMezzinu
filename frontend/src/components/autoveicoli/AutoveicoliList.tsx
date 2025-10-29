// src/components/autoveicoli/AutoveicoliList.tsx - CON COLONNA AUTISTA
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
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  DirectionsCar,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  SellOutlined,
  Delete as DemolisciIcon,
  Close as ChiudiIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/it';
import { autoveicoliService } from '../../services/autoveicoliService';
import { Autoveicolo } from '../../types/Autoveicolo';
import AutoveicoloForm from './AutoveicoloForm';
import AutoveicoloDetailModal from './AutoveicoloDetailModal';

const AutoveicoliList: React.FC = () => {
  const [allData, setAllData] = useState<Autoveicolo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [showForm, setShowForm] = useState(false);
  const [selectedAuto, setSelectedAuto] = useState<Autoveicolo | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuAuto, setMenuAuto] = useState<Autoveicolo | null>(null);

  // FETCH DATI
  useEffect(() => {
    let isCancelled = false;
    
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await autoveicoliService.getAll({ limit: 10000 });
        
        if (!isCancelled) {
          setAllData(response.data || []);
        }
      } catch (error) {
        console.error('Errore caricamento:', error);
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
    if (!searchTerm.trim()) return allData;
    
    const term = searchTerm.toLowerCase().trim();
    return allData.filter(auto => 
      auto.targa?.toLowerCase().includes(term) ||
      auto.marca?.toLowerCase().includes(term) ||
      auto.modello?.toLowerCase().includes(term)
    );
  }, [allData, searchTerm]);

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

  const handleEdit = React.useCallback((auto: Autoveicolo) => {
    setSelectedAuto(auto);
    setShowForm(true);
    setAnchorEl(null);
  }, []);

  const handleView = React.useCallback((auto: Autoveicolo) => {
    setSelectedAuto(auto);
    setShowDetail(true);
    setAnchorEl(null);
  }, []);

  const handleDelete = React.useCallback(async (auto: Autoveicolo) => {
    if (window.confirm(`Sei sicuro di voler eliminare l'autoveicolo ${auto.targa}?`)) {
      try {
        await autoveicoliService.delete(auto._id);
        const response = await autoveicoliService.getAll({ limit: 10000 });
        setAllData(response.data || []);
      } catch (error) {
        console.error('Errore eliminazione:', error);
      }
    }
    setAnchorEl(null);
  }, []);

  const handleVendi = React.useCallback(async (auto: Autoveicolo) => {
    if (window.confirm('Sei sicuro di voler vendere questo autoveicolo?')) {
      try {
        await autoveicoliService.vendi(auto._id);
        const response = await autoveicoliService.getAll({ limit: 10000 });
        setAllData(response.data || []);
      } catch (error) {
        console.error('Errore vendita:', error);
      }
    }
    setAnchorEl(null);
  }, []);

  const handleDemolisci = React.useCallback(async (auto: Autoveicolo) => {
    const datiDemolitore = prompt('Inserisci i dati del demolitore:');
    if (datiDemolitore !== null) {
      try {
        await autoveicoliService.demolisci(auto._id, {
          datiDemolitore,
          dataDemolizione: new Date().toISOString()
        });
        const response = await autoveicoliService.getAll({ limit: 10000 });
        setAllData(response.data || []);
      } catch (error) {
        console.error('Errore demolizione:', error);
      }
    }
    setAnchorEl(null);
  }, []);

  const handleChiudiNoleggio = React.useCallback(async (auto: Autoveicolo) => {
    if (window.confirm('Sei sicuro di voler chiudere il noleggio?')) {
      try {
        await autoveicoliService.update(auto._id, { stato: 'Chiuso' });
        const response = await autoveicoliService.getAll({ limit: 10000 });
        setAllData(response.data || []);
      } catch (error) {
        console.error('Errore chiusura:', error);
      }
    }
    setAnchorEl(null);
  }, []);

  const handleMenuOpen = React.useCallback((event: React.MouseEvent<HTMLElement>, auto: Autoveicolo) => {
    setAnchorEl(event.currentTarget);
    setMenuAuto(auto);
  }, []);

  const handleMenuClose = React.useCallback(() => {
    setAnchorEl(null);
    setMenuAuto(null);
  }, []); 

  const handleFormClose = React.useCallback(() => {
    setShowForm(false);
    setSelectedAuto(null);
  }, []);

  const handleFormSuccess = React.useCallback(async () => {
    setShowForm(false);
    setSelectedAuto(null);
    
    try {
      const response = await autoveicoliService.getAll({ limit: 10000 });
      setAllData(response.data || []);
    } catch (error) {
      console.error('Errore ricaricamento:', error);
    }
  }, []);

  const getStatusColor = (stato: string): "primary" | "success" | "warning" | "error" => {
    switch (stato) {
      case 'Attivo': return 'success';
      case 'Venduto': return 'primary';
      case 'Chiuso': return 'warning';
      case 'Demolito': return 'error';
      default: return 'primary';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Caricamento...</Typography>
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
                setSelectedAuto(null);
                setShowForm(true);
              }}
            >
              Nuovo Autoveicolo
            </Button>
          </Box>

          <Box display="flex" gap={2} alignItems="center">
            <TextField
              placeholder="Cerca targa, marca, modello..."
              value={searchTerm}
              onChange={handleSearchChange}
              sx={{ flexGrow: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Typography variant="body2" color="text.secondary">
              {filteredData.length} di {allData.length}
            </Typography>
          </Box>
        </Paper>

        {/* Tabella */}
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Targa</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Marca</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Modello</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Autista</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Anno</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Stato</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.map((auto, index) => (
                <TableRow key={`${auto._id}_${index}`} hover>
                  <TableCell sx={{ fontWeight: 'medium' }}>
                    {auto.targa}
                  </TableCell>
                  <TableCell>{auto.marca}</TableCell>
                  <TableCell>{auto.modello}</TableCell>
                  <TableCell>
                    {typeof auto.autistaAssegnato === 'object' && auto.autistaAssegnato ? (
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {auto.autistaAssegnato.nome} {auto.autistaAssegnato.cognome}
                        </Typography>
                        {auto.autistaAssegnato.contatti?.telefono && (
                          <Typography variant="caption" color="text.secondary">
                            📱 {auto.autistaAssegnato.contatti.telefono}
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Non assegnato
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {auto.dataImmatricolazione 
                      ? dayjs(auto.dataImmatricolazione).format('YYYY')
                      : '-'
                    }
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={auto.stato} 
                      color={getStatusColor(auto.stato)} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" gap={0.5} justifyContent="center" alignItems="center">
                      <Tooltip title="Visualizza" arrow>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleView(auto)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Modifica" arrow>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEdit(auto)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Elimina" arrow>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(auto)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {auto.stato === 'Attivo' && (
                        <Tooltip title="Altre azioni" arrow>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, auto)}
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
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">
                      Nessun autoveicolo trovato
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

        {/* Menu Azioni */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => menuAuto && handleVendi(menuAuto)}>
            <ListItemIcon>
              <SellOutlined fontSize="small" />
            </ListItemIcon>
            <ListItemText>Vendi</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => menuAuto && handleDemolisci(menuAuto)}>
            <ListItemIcon>
              <DemolisciIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Demolisci</ListItemText>
          </MenuItem>
          {menuAuto?.tipologiaAcquisto === 'Noleggio' && (
            <MenuItem onClick={() => menuAuto && handleChiudiNoleggio(menuAuto)}>
              <ListItemIcon>
                <ChiudiIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Chiudi Noleggio</ListItemText>
            </MenuItem>
          )}
        </Menu>

        {/* Dialog Form */}
        <Dialog 
          open={showForm} 
          onClose={handleFormClose}
          maxWidth="lg"
          fullWidth
        >
          <AutoveicoloForm
            autoveicolo={selectedAuto}
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
          {selectedAuto && (
            <AutoveicoloDetailModal
              autoveicolo={selectedAuto}
              onClose={() => setShowDetail(false)}
            />
          )}
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default AutoveicoliList;