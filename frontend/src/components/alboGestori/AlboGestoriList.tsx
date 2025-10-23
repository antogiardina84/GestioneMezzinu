// src/components/alboGestori/AlboGestoriList.tsx - CON ACTION BUTTONS INLINE
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
  Receipt as ReceiptIcon,
  Warning as WarningIcon,
  FolderOpen as FolderIcon
} from '@mui/icons-material';
import { alboGestoriService } from '../../services/alboGestoriService';
import AlboGestoriForm from './AlboGestoriForm';
import AlboGestoriDetailModal from './AlboGestoriDetailModal';
import dayjs from 'dayjs';
import 'dayjs/locale/it';

const AlboGestoriList: React.FC = () => {
  const [alboGestori, setAlboGestori] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterClasse, setFilterClasse] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedAlbo, setSelectedAlbo] = useState<any | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    fetchAlboGestori();
  }, []);

  const fetchAlboGestori = async () => {
    try {
      setLoading(true);
      const response = await alboGestoriService.getAll();
      setAlboGestori(response.data);
    } catch (error) {
      console.error('Errore nel caricamento albo gestori:', error);
      setAlboGestori([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleView = (albo: any) => {
    setSelectedAlbo(albo);
    setShowDetail(true);
  };

  const handleEdit = (albo: any) => {
    setSelectedAlbo(albo);
    setShowForm(true);
  };

  const handleDelete = async (albo: any) => {
    if (window.confirm(`Sei sicuro di voler eliminare l'iscrizione ${albo.numeroIscrizioneAlbo}?`)) {
      try {
        await alboGestoriService.delete(albo._id);
        await fetchAlboGestori();
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

  const filteredAlboGestori = alboGestori.filter(albo => {
    const matchesSearch = 
      albo.numeroIscrizioneAlbo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = filterCategoria === '' || albo.categoria === filterCategoria;
    const matchesClasse = filterClasse === '' || albo.classe === filterClasse;
    
    return matchesSearch && matchesCategoria && matchesClasse;
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
            <ReceiptIcon /> Albo Nazionale Gestori Ambientali
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedAlbo(null);
              setShowForm(true);
            }}
            size="large"
          >
            Nuova Iscrizione
          </Button>
        </Box>

        {/* Filtri */}
        <Toolbar sx={{ px: 0, gap: 2 }}>
          <TextField
            placeholder="Cerca per numero iscrizione..."
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
            <InputLabel>Categoria</InputLabel>
            <Select
              value={filterCategoria}
              label="Categoria"
              onChange={(e) => setFilterCategoria(e.target.value)}
            >
              <MenuItem value="">Tutte</MenuItem>
              <MenuItem value="1">1</MenuItem>
              <MenuItem value="4">4</MenuItem>
              <MenuItem value="5">5</MenuItem>
              <MenuItem value="8">8</MenuItem>
              <MenuItem value="9">9</MenuItem>
              <MenuItem value="10">10</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Classe</InputLabel>
            <Select
              value={filterClasse}
              label="Classe"
              onChange={(e) => setFilterClasse(e.target.value)}
            >
              <MenuItem value="">Tutte</MenuItem>
              <MenuItem value="A">A</MenuItem>
              <MenuItem value="B">B</MenuItem>
              <MenuItem value="C">C</MenuItem>
              <MenuItem value="D">D</MenuItem>
              <MenuItem value="E">E</MenuItem>
              <MenuItem value="F">F</MenuItem>
            </Select>
          </FormControl>
        </Toolbar>
      </Paper>

      {/* Tabella Albo Gestori */}
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.light' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Numero Iscrizione</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Categoria</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Classe</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Data Iscrizione</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Data Scadenza</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Stato</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Allegati</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAlboGestori.map((albo) => (
              <TableRow key={albo._id} hover>
                <TableCell sx={{ fontWeight: 'medium' }}>
                  {albo.numeroIscrizioneAlbo}
                </TableCell>
                <TableCell>{albo.categoria}</TableCell>
                <TableCell>{albo.classe}</TableCell>
                <TableCell>{formatDate(albo.dataIscrizione)}</TableCell>
                <TableCell>{formatDate(albo.dataScadenzaIscrizione)}</TableCell>
                <TableCell>
                  {getScadenzaChip(albo.dataScadenzaIscrizione)}
                </TableCell>
                <TableCell>
                  <IconButton size="small" color="primary">
                    <FolderIcon />
                    <Typography variant="caption" ml={0.5}>
                      {albo.allegati?.length || 0}
                    </Typography>
                  </IconButton>
                </TableCell>
                <TableCell align="center">
                  <Box display="flex" gap={0.5} justifyContent="center">
                    <Tooltip title="Visualizza" arrow>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleView(albo)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Modifica" arrow>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEdit(albo)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Elimina" arrow>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(albo)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {filteredAlboGestori.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">
                    Nessuna iscrizione trovata
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
        <AlboGestoriForm
          alboGestore={selectedAlbo}
          onSuccess={() => {
            setShowForm(false);
            fetchAlboGestori();
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
        {selectedAlbo && (
          <AlboGestoriDetailModal
            alboGestore={selectedAlbo}
            onClose={() => setShowDetail(false)}
            onRefresh={fetchAlboGestori}
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
          setSelectedAlbo(null);
          setShowForm(true);
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default AlboGestoriList;