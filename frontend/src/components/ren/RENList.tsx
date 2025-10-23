// src/components/ren/RENList.tsx - CON ACTION BUTTONS INLINE
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
  Fab,
  Toolbar,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  FolderOpen as FolderIcon
} from '@mui/icons-material';
import { renService } from '../../services/renService';
import RENForm from './RENForm';
import RENDetailModal from './RENDetailModal';
import dayjs from 'dayjs';
import 'dayjs/locale/it';

const RENList: React.FC = () => {
  const [rens, setRens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegione, setFilterRegione] = useState('');
  const [filterTipologia, setFilterTipologia] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedREN, setSelectedREN] = useState<any | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const regioni = [
    'Abruzzo', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna',
    'Friuli-Venezia Giulia', 'Lazio', 'Liguria', 'Lombardia', 'Marche',
    'Molise', 'Piemonte', 'Puglia', 'Sardegna', 'Sicilia', 'Toscana',
    'Trentino-Alto Adige', 'Umbria', 'Valle d\'Aosta', 'Veneto'
  ];

  useEffect(() => {
    fetchRENs();
  }, []);

  const fetchRENs = async () => {
    try {
      setLoading(true);
      const response = await renService.getAll();
      setRens(response.data);
    } catch (error) {
      console.error('Errore nel caricamento REN:', error);
      setRens([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleView = (ren: any) => {
    setSelectedREN(ren);
    setShowDetail(true);
  };

  const handleEdit = (ren: any) => {
    setSelectedREN(ren);
    setShowForm(true);
  };

  const handleDelete = async (ren: any) => {
    if (window.confirm(`Sei sicuro di voler eliminare il REN ${ren.numeroIscrizioneREN}?`)) {
      try {
        await renService.delete(ren._id);
        await fetchRENs();
      } catch (error) {
        console.error('Errore nella eliminazione:', error);
      }
    }
  };

  const formatDate = (date: string | Date) => {
    if (!date) return '-';
    return dayjs(date).format('DD/MM/YYYY');
  };

  const getScadenzaChip = (dataScadenza: Date) => {
    const oggi = dayjs();
    const scadenza = dayjs(dataScadenza);
    const giorni = scadenza.diff(oggi, 'day');

    if (giorni < 0) {
      return <Chip label="Scaduto" color="error" size="small" icon={<WarningIcon />} />;
    } else if (giorni <= 90) {
      return <Chip label={`${giorni} giorni`} color="error" size="small" icon={<WarningIcon />} />;
    } else if (giorni <= 180) {
      return <Chip label={`${giorni} giorni`} color="warning" size="small" icon={<WarningIcon />} />;
    }
    return null;
  };

  const filteredRENs = rens.filter(ren => {
    const matchesSearch = 
      ren.numeroIscrizioneREN.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ren.regione.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ren.provincia.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegione = filterRegione === '' || ren.regione === filterRegione;
    const matchesTipologia = filterTipologia === '' || ren.tipologiaAttività === filterTipologia;
    
    return matchesSearch && matchesRegione && matchesTipologia;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssignmentIcon /> Registro Elettronico Nazionale (REN)
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedREN(null);
              setShowForm(true);
            }}
            size="large"
          >
            Nuova Iscrizione REN
          </Button>
        </Box>

        {/* Filtri */}
        <Toolbar sx={{ px: 0, gap: 2 }}>
          <TextField
            placeholder="Cerca per numero, regione o provincia..."
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
            <InputLabel>Regione</InputLabel>
            <Select
              value={filterRegione}
              label="Regione"
              onChange={(e) => setFilterRegione(e.target.value)}
            >
              <MenuItem value="">Tutte</MenuItem>
              {regioni.map((regione) => (
                <MenuItem key={regione} value={regione}>
                  {regione}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Tipologia</InputLabel>
            <Select
              value={filterTipologia}
              label="Tipologia"
              onChange={(e) => setFilterTipologia(e.target.value)}
            >
              <MenuItem value="">Tutte</MenuItem>
              <MenuItem value="Conto Proprio">Conto Proprio</MenuItem>
              <MenuItem value="Conto Terzi">Conto Terzi</MenuItem>
            </Select>
          </FormControl>
        </Toolbar>
      </Paper>

      {/* Tabella REN */}
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.light' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Numero REN</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Regione</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Provincia</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tipologia</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Data Iscrizione</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Data Scadenza</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Stato</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Allegati</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRENs.map((ren) => (
              <TableRow key={ren._id} hover>
                <TableCell sx={{ fontWeight: 'medium' }}>
                  {ren.numeroIscrizioneREN}
                </TableCell>
                <TableCell>{ren.regione}</TableCell>
                <TableCell>{ren.provincia}</TableCell>
                <TableCell>
                  <Chip 
                    label={ren.tipologiaAttività} 
                    color={ren.tipologiaAttività === 'Conto Terzi' ? 'primary' : 'secondary'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{formatDate(ren.dataIscrizioneREN)}</TableCell>
                <TableCell>{formatDate(ren.dataScadenzaREN)}</TableCell>
                <TableCell>
                  {getScadenzaChip(ren.dataScadenzaREN)}
                </TableCell>
                <TableCell>
                  <IconButton size="small" color="primary">
                    <FolderIcon />
                    <Typography variant="caption" ml={0.5}>
                      {ren.allegati?.length || 0}
                    </Typography>
                  </IconButton>
                </TableCell>
                <TableCell align="center">
                  <Box display="flex" gap={0.5} justifyContent="center">
                    <Tooltip title="Visualizza" arrow>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleView(ren)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Modifica" arrow>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEdit(ren)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Elimina" arrow>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(ren)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {filteredRENs.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">
                    Nessuna iscrizione REN trovata
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialogs */}
      <Dialog 
        open={showForm} 
        onClose={() => setShowForm(false)}
        maxWidth="lg"
        fullWidth
      >
        <RENForm
          ren={selectedREN}
          onSuccess={() => {
            setShowForm(false);
            fetchRENs();
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
        {selectedREN && (
          <RENDetailModal
            ren={selectedREN}
            onClose={() => setShowDetail(false)}
            onRefresh={fetchRENs}
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
          setSelectedREN(null);
          setShowForm(true);
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default RENList;