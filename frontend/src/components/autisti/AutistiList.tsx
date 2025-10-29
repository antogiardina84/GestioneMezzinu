// frontend/src/components/autisti/AutistiList.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { Autista } from '../../types/Autista';
import { autistiService } from '../../services/autistiService';
import AutistaForm from './AutistaForm';
import AutistaDetailModal from './AutistaDetailModal';
import ScadenzeAlert from './ScadenzeAlert';

const AutistiList: React.FC = () => {
  const [autisti, setAutisti] = useState<Autista[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Paginazione
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filtri
  const [searchTerm, setSearchTerm] = useState('');
  const [statoFilter, setStatoFilter] = useState<string>('');
  const [attivoFilter, setAttivoFilter] = useState<string>('');
  
  // Modals
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedAutista, setSelectedAutista] = useState<Autista | null>(null);
  const [editMode, setEditMode] = useState(false);

  // Carica autisti
  const loadAutisti = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {
        page: page + 1,
        limit: rowsPerPage,
      };
      
      if (searchTerm) params.search = searchTerm;
      if (statoFilter) params.stato = statoFilter;
      if (attivoFilter !== '') params.attivo = attivoFilter === 'true';
      
      const response = await autistiService.getAll(params);
      setAutisti(response.data);
      setTotalCount(response.total);
    } catch (err: any) {
      console.error('Errore caricamento autisti:', err);
      setError(err.message || 'Errore durante il caricamento degli autisti');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm, statoFilter, attivoFilter]);

  useEffect(() => {
    loadAutisti();
  }, [loadAutisti]);

  // Handlers
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleCreateNew = () => {
    setSelectedAutista(null);
    setEditMode(false);
    setShowForm(true);
  };

  const handleEdit = (autista: Autista) => {
    setSelectedAutista(autista);
    setEditMode(true);
    setShowForm(true);
  };

  const handleView = (autista: Autista) => {
    setSelectedAutista(autista);
    setShowDetail(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedAutista(null);
    setEditMode(false);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedAutista(null);
  };

  const handleSaveSuccess = () => {
    handleCloseForm();
    loadAutisti();
  };

  // Helpers
  const getStatoColor = (stato: string) => {
    switch (stato) {
      case 'Attivo': return 'success';
      case 'In Ferie': return 'info';
      case 'Malattia': return 'warning';
      case 'Sospeso': return 'error';
      case 'Cessato': return 'default';
      default: return 'default';
    }
  };

  const getStatoIcon = (stato: string) => {
    switch (stato) {
      case 'Attivo': return <CheckCircleIcon fontSize="small" />;
      case 'In Ferie': return <WarningIcon fontSize="small" />;
      case 'Malattia': return <WarningIcon fontSize="small" />;
      case 'Sospeso': return <BlockIcon fontSize="small" />;
      case 'Cessato': return <BlockIcon fontSize="small" />;
      default: return undefined;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  const verificaPatentiScadute = (autista: Autista): boolean => {
    if (!autista.patenti || autista.patenti.length === 0) return false;
    
    const oggi = new Date();
    const trentaGiorni = new Date();
    trentaGiorni.setDate(oggi.getDate() + 30);
    
    return autista.patenti.some(patente => {
      const scadenza = new Date(patente.dataScadenza);
      return scadenza <= trentaGiorni && scadenza >= oggi;
    });
  };

  return (
    <Box>
      {/* Header con Alert Scadenze */}
      <Box mb={3}>
        <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', fontWeight: 500 }}>
          👤 Gestione Autisti
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Gestisci anagrafica, patenti, qualifiche e disponibilità degli autisti
        </Typography>
      </Box>

      {/* Alert Scadenze */}
      <Box mb={3}>
        <ScadenzeAlert />
      </Box>

      {/* Filtri e Azioni */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          {/* Ricerca */}
          <TextField
            placeholder="Cerca per nome, cognome o CF..."
            value={searchTerm}
            onChange={handleSearchChange}
            size="small"
            sx={{ flexGrow: 1, minWidth: { xs: '100%', md: 300 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          {/* Filtro Stato */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Stato</InputLabel>
            <Select
              value={statoFilter}
              label="Stato"
              onChange={(e) => setStatoFilter(e.target.value)}
            >
              <MenuItem value="">Tutti</MenuItem>
              <MenuItem value="Attivo">Attivo</MenuItem>
              <MenuItem value="In Ferie">In Ferie</MenuItem>
              <MenuItem value="Malattia">Malattia</MenuItem>
              <MenuItem value="Sospeso">Sospeso</MenuItem>
              <MenuItem value="Cessato">Cessato</MenuItem>
            </Select>
          </FormControl>

          {/* Filtro Attivo */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Attività</InputLabel>
            <Select
              value={attivoFilter}
              label="Attività"
              onChange={(e) => setAttivoFilter(e.target.value)}
            >
              <MenuItem value="">Tutti</MenuItem>
              <MenuItem value="true">Attivi</MenuItem>
              <MenuItem value="false">Non Attivi</MenuItem>
            </Select>
          </FormControl>

          {/* Refresh */}
          <Tooltip title="Aggiorna">
            <IconButton onClick={loadAutisti} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          {/* Nuovo Autista */}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateNew}
            sx={{ minWidth: { xs: '100%', md: 'auto' } }}
          >
            Nuovo Autista
          </Button>
        </Stack>
      </Paper>

      {/* Messaggio Errore */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabella Autisti */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome Completo</TableCell>
                <TableCell>Codice Fiscale</TableCell>
                <TableCell>Telefono</TableCell>
                <TableCell>Stato</TableCell>
                <TableCell>Patenti</TableCell>
                <TableCell>Contratto</TableCell>
                <TableCell align="center">Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : autisti.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Typography color="text.secondary">
                      Nessun autista trovato
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                autisti.map((autista) => (
                  <TableRow key={autista._id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {verificaPatentiScadute(autista) && (
                          <Tooltip title="Patente in scadenza!">
                            <WarningIcon color="warning" fontSize="small" />
                          </Tooltip>
                        )}
                        <Typography variant="body2" fontWeight={500}>
                          {autista.nome} {autista.cognome}
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {autista.codiceFiscale}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {autista.contatti.telefono}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={autista.stato}
                        color={getStatoColor(autista.stato)}
                        icon={getStatoIcon(autista.stato)}
                        size="small"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Box display="flex" gap={0.5} flexWrap="wrap">
                        {autista.patenti.slice(0, 3).map((patente, idx) => (
                          <Chip
                            key={idx}
                            label={patente.tipo}
                            size="small"
                            variant="outlined"
                            color={patente.valida ? 'default' : 'error'}
                          />
                        ))}
                        {autista.patenti.length > 3 && (
                          <Chip
                            label={`+${autista.patenti.length - 3}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {autista.contratto.tipo}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        dal {formatDate(autista.contratto.dataAssunzione)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="center">
                      <Box display="flex" gap={0.5} justifyContent="center">
                        <Tooltip title="Visualizza">
                          <IconButton
                            size="small"
                            onClick={() => handleView(autista)}
                            color="info"
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Modifica">
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(autista)}
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
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

        {/* Paginazione */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Righe per pagina:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} di ${count !== -1 ? count : `più di ${to}`}`
          }
        />
      </Paper>

      {/* Form Modal */}
      {showForm && (
        <AutistaForm
          open={showForm}
          onClose={handleCloseForm}
          onSuccess={handleSaveSuccess}
          autista={selectedAutista}
          editMode={editMode}
        />
      )}

      {/* Detail Modal */}
      {showDetail && selectedAutista && (
        <AutistaDetailModal
          open={showDetail}
          onClose={handleCloseDetail}
          autista={selectedAutista}
          onEdit={() => {
            handleCloseDetail();
            handleEdit(selectedAutista);
          }}
        />
      )}
    </Box>
  );
};

export default AutistiList;