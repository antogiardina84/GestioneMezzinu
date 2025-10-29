// src/components/servizi/FoglioLavoroGiornaliero.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Grid,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Checkbox,
  FormControlLabel,
  Stack,
} from '@mui/material';
import {
  Print as PrintIcon,
  Close as CloseIcon,
  Assignment as AssignmentIcon,
  Person,
  DirectionsCar,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/it';
import { serviziService } from '../../services/serviziService';
import { autistiService } from '../../services/autistiService';
import { Servizio } from '../../types/Servizio';
import { AutistaListItem } from '../../types/Autista';

interface FoglioLavoroGiornalieroProps {
  servizi: Servizio[];
}

// ============================================
// HELPER TYPE-SAFE PER GESTIRE AUTISTA
// ============================================
interface AutistaPopulated {
  _id: string;
  nome: string;
  cognome: string;
}

// Type guard per verificare se autista è popolato
function isAutistaPopulated(autista: any): autista is AutistaPopulated {
  return autista && typeof autista === 'object' && '_id' in autista;
}

// Helper per ottenere ID autista (sia string che object)
function getAutistaId(autista: string | any): string {
  if (typeof autista === 'string') {
    return autista;
  }
  if (isAutistaPopulated(autista)) {
    return autista._id;
  }
  return '';
}
// ============================================

const FoglioLavoroGiornaliero: React.FC<FoglioLavoroGiornalieroProps> = ({
  servizi: propsServizi,
}) => {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Dayjs>(dayjs());
  const [servizi, setServizi] = useState<Servizio[]>([]);
  const [autisti, setAutisti] = useState<AutistaListItem[]>([]);
  const [autistaSelezionato, setAutistaSelezionato] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [includiNote, setIncludiNote] = useState(true);
  const [includiMateriali, setIncludiMateriali] = useState(true);
  const [includiCliente, setIncludiCliente] = useState(true);
  const [includiCosti, setIncludiCosti] = useState(false);

  // Carica servizi quando cambia la data o quando viene ricevuto props
  useEffect(() => {
    if (open && data && propsServizi.length > 0) {
      loadServizi();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, data, propsServizi]);

  // Carica autisti dal database
  useEffect(() => {
    if (open) {
      loadAutisti();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const loadAutisti = async () => {
    try {
      const autistiFromDB = await autistiService.getListaSemplice();
      setAutisti(autistiFromDB);
      
      // Se c'è un solo autista, preselezionalo
      if (autistiFromDB.length === 1 && !autistaSelezionato) {
        setAutistaSelezionato(autistiFromDB[0].id);
      }
    } catch (error) {
      console.error('Errore caricamento autisti:', error);
      setAutisti([]);
    }
  };

  const loadServizi = async () => {
    try {
      setLoading(true);
      
      // Formatta le date in formato YYYY-MM-DD locale senza conversione UTC
      const dataSelezionata = data.format('YYYY-MM-DD');
      const startOfDay = `${dataSelezionata}T00:00:00`;
      const endOfDay = `${dataSelezionata}T23:59:59`;
      
      const response = await serviziService.getAll({
        limit: 1000,
        dataInizio: startOfDay,
        dataFine: endOfDay,
        stato: 'Programmato,In corso', // Solo servizi attivi
      });
      
      const serviziDelGiorno = (response.data || []).filter(servizio => {
        const servizioDate = dayjs(servizio.dataInizio);
        return servizioDate.format('YYYY-MM-DD') === dataSelezionata;
      });
      
      setServizi(serviziDelGiorno);
    } catch (error) {
      console.error('Errore caricamento servizi:', error);
      setServizi([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtra servizi per autista selezionato (TYPE-SAFE!)
  const serviziAutista = servizi.filter(s => {
    if (!s.autista) return false;
    return getAutistaId(s.autista) === autistaSelezionato;
  });

  // Ordina per ora inizio
  const serviziOrdinati = [...serviziAutista].sort((a, b) => {
    return a.oraInizio.localeCompare(b.oraInizio);
  });

  const handleStampa = () => {
    if (!autistaSelezionato) {
      alert('Seleziona un autista');
      return;
    }

    // Apre la finestra di stampa del browser
    window.print();
  };

  const handleStampaTuttiAutisti = () => {
    // Stampa per tutti gli autisti
    setAutistaSelezionato('TUTTI');
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  // Trova nome autista selezionato
  const nomeAutistaSelezionato = autisti.find(a => a.id === autistaSelezionato)?.nomeCompleto || autistaSelezionato;

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        startIcon={<PrintIcon />}
        onClick={handleOpen}
      >
        Apri Foglio Lavoro
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        className="no-print"
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <AssignmentIcon color="primary" />
              <Typography variant="h6">Foglio Lavoro Giornaliero</Typography>
            </Box>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <DatePicker
                label="Data"
                value={data}
                onChange={(newValue) => newValue && setData(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Autista</InputLabel>
                <Select
                  value={autistaSelezionato}
                  onChange={(e) => setAutistaSelezionato(e.target.value)}
                  disabled={autisti.length === 0}
                >
                  <MenuItem value="">
                    <em>Seleziona autista</em>
                  </MenuItem>
                  {autisti.map((autista) => (
                    <MenuItem key={autista.id} value={autista.id}>
                      {autista.nomeCompleto}
                      {autista.telefono && ` - ${autista.telefono}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {autisti.length === 0 && !loading && (
              <Grid item xs={12}>
                <Alert severity="warning">
                  Nessun autista attivo trovato nel sistema
                </Alert>
              </Grid>
            )}

            {!autistaSelezionato && autisti.length > 0 && (
              <Grid item xs={12}>
                <Alert severity="info">
                  Seleziona un autista per visualizzare i servizi programmati
                </Alert>
              </Grid>
            )}

            {servizi.length === 0 && !loading && autistaSelezionato && (
              <Grid item xs={12}>
                <Alert severity="info">
                  Nessun servizio programmato per questa data
                </Alert>
              </Grid>
            )}

            {autistaSelezionato && serviziAutista.length === 0 && servizi.length > 0 && (
              <Grid item xs={12}>
                <Alert severity="warning">
                  Nessun servizio trovato per l'autista selezionato in questa data
                </Alert>
              </Grid>
            )}

            {autistaSelezionato && serviziAutista.length > 0 && (
              <Grid item xs={12}>
                <Alert severity="success">
                  Trovati {serviziAutista.length} servizio/i per {nomeAutistaSelezionato}
                </Alert>
              </Grid>
            )}

            <Grid item xs={12}>
              <Stack direction="row" spacing={2}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includiNote}
                      onChange={(e) => setIncludiNote(e.target.checked)}
                    />
                  }
                  label="Note"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includiMateriali}
                      onChange={(e) => setIncludiMateriali(e.target.checked)}
                    />
                  }
                  label="Materiali"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includiCliente}
                      onChange={(e) => setIncludiCliente(e.target.checked)}
                    />
                  }
                  label="Cliente"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includiCosti}
                      onChange={(e) => setIncludiCosti(e.target.checked)}
                    />
                  }
                  label="Costi"
                />
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Annulla</Button>
          <Button
            variant="outlined"
            onClick={handleStampaTuttiAutisti}
            disabled={servizi.length === 0}
          >
            Stampa Tutti
          </Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={handleStampa}
            disabled={!autistaSelezionato || serviziAutista.length === 0}
          >
            Stampa
          </Button>
        </DialogActions>
      </Dialog>

      {/* Area di stampa */}
      <Box className="print-only" sx={{ p: 3 }}>
        {autistaSelezionato && serviziOrdinati.map((servizio, index) => (
          <Box key={servizio._id} mb={index < serviziOrdinati.length - 1 ? 4 : 0}>
            <Paper elevation={0} sx={{ border: '2px solid #714B67', p: 2 }}>
              {/* Header */}
              <Box mb={2} pb={2} borderBottom="2px solid #714B67">
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={6}>
                    <Typography variant="h5" fontWeight="bold" color="primary">
                      FOGLIO LAVORO GIORNALIERO
                    </Typography>
                  </Grid>
                  <Grid item xs={6} textAlign="right">
                    <Typography variant="h6">
                      {data.format('DD/MM/YYYY')}
                    </Typography>
                    <Typography variant="subtitle2" color="text.secondary">
                      Servizio #{index + 1} di {serviziOrdinati.length}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Info Autista e Veicolo */}
              <Grid container spacing={2} mb={2}>
                <Grid item xs={6}>
                  <Box bgcolor="#F5F5F5" p={1.5} borderRadius={1}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      <Person fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                      AUTISTA
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {nomeAutistaSelezionato}
                    </Typography>
                    {autisti.find(a => a.id === autistaSelezionato)?.telefono && (
                      <Typography variant="body2" color="text.secondary">
                        Tel: {autisti.find(a => a.id === autistaSelezionato)?.telefono}
                      </Typography>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box bgcolor="#F5F5F5" p={1.5} borderRadius={1}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      <DirectionsCar fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                      VEICOLO
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {typeof servizio.autoveicolo === 'object' 
                        ? `${servizio.autoveicolo.targa} - ${servizio.autoveicolo.marca} ${servizio.autoveicolo.modello}`
                        : 'N/D'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Dettagli Servizio */}
              <Box mb={2} bgcolor="#E3F2FD" p={1.5} borderRadius={1}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  📋 {servizio.titolo}
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Orario
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {servizio.oraInizio} - {servizio.oraFine}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Tipo
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {servizio.tipoServizio}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Stato
                    </Typography>
                    <Chip 
                      label={servizio.stato} 
                      size="small"
                      color={servizio.stato === 'Programmato' ? 'primary' : 'warning'}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Priorità
                    </Typography>
                    <Chip 
                      label={servizio.priorita} 
                      size="small"
                      color={
                        servizio.priorita === 'Urgente' ? 'error' :
                        servizio.priorita === 'Alta' ? 'warning' : 'default'
                      }
                    />
                  </Grid>
                </Grid>

                {servizio.descrizione && (
                  <Box mt={1.5} pt={1.5} borderTop="1px solid rgba(0,0,0,0.1)">
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                      {servizio.descrizione}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Luoghi */}
              {(servizio.luogoPartenza || servizio.luogoArrivo) && (
                <Box mb={2} bgcolor="#FFF3E0" p={1.5} borderRadius={1}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    🗺️ PERCORSO
                  </Typography>
                  <Table size="small">
                    <TableBody>
                      {servizio.luogoPartenza && (
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold', width: '100px', border: 'none' }}>
                            📍 PARTENZA:
                          </TableCell>
                          <TableCell sx={{ border: 'none' }}>
                            {servizio.luogoPartenza.indirizzo}
                            <br />
                            {servizio.luogoPartenza.citta} ({servizio.luogoPartenza.provincia}) - {servizio.luogoPartenza.cap}
                          </TableCell>
                        </TableRow>
                      )}
                      {servizio.luogoArrivo && (
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold', border: 'none' }}>
                            📍 ARRIVO:
                          </TableCell>
                          <TableCell sx={{ border: 'none' }}>
                            {servizio.luogoArrivo.indirizzo}
                            <br />
                            {servizio.luogoArrivo.citta} ({servizio.luogoArrivo.provincia}) - {servizio.luogoArrivo.cap}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Box>
              )}

              {/* Cliente */}
              {includiCliente && servizio.cliente && servizio.cliente.nome && (
                <Box mb={2} bgcolor="#FFF9E6" p={1.5} borderRadius={1}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    👤 CLIENTE
                  </Typography>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', width: '100px', border: 'none', py: 0.5 }}>
                          Nome:
                        </TableCell>
                        <TableCell sx={{ border: 'none', py: 0.5 }}>
                          {servizio.cliente.nome}
                        </TableCell>
                      </TableRow>
                      {servizio.cliente.telefono && (
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold', border: 'none', py: 0.5 }}>
                            Telefono:
                          </TableCell>
                          <TableCell sx={{ border: 'none', py: 0.5 }}>
                            {servizio.cliente.telefono}
                          </TableCell>
                        </TableRow>
                      )}
                      {servizio.cliente.riferimento && (
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold', border: 'none', py: 0.5 }}>
                            Riferimento:
                          </TableCell>
                          <TableCell sx={{ border: 'none', py: 0.5 }}>
                            {servizio.cliente.riferimento}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Box>
              )}

              {/* Materiali */}
              {includiMateriali && servizio.materiali && servizio.materiali.length > 0 && (
                <Box mb={2} bgcolor="#E8F5E9" p={1.5} borderRadius={1}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    📦 MATERIALI DA TRASPORTARE
                  </Typography>
                  {servizio.materiali.map((materiale, idx) => (
                    <Box key={idx} ml={2} mb={1}>
                      <Typography variant="body2">
                        • <strong>{materiale.descrizione}</strong>
                        {materiale.quantita && ` - Quantità: ${materiale.quantita} ${materiale.unitaMisura || ''}`}
                        {materiale.peso && ` - Peso: ${materiale.peso} kg`}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}

              {/* Costi Previsti */}
              {includiCosti && servizio.costi && (
                <Box mb={2} bgcolor="#FFEBEE" p={1.5} borderRadius={1}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    💰 COSTI PREVISTI
                  </Typography>
                  <Table size="small">
                    <TableBody>
                      {servizio.costi.pedaggi > 0 && (
                        <TableRow>
                          <TableCell sx={{ border: 'none', py: 0.5 }}>Pedaggi:</TableCell>
                          <TableCell align="right" sx={{ border: 'none', py: 0.5 }}>
                            € {servizio.costi.pedaggi.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      )}
                      {servizio.costi.parcheggi > 0 && (
                        <TableRow>
                          <TableCell sx={{ border: 'none', py: 0.5 }}>Parcheggi:</TableCell>
                          <TableCell align="right" sx={{ border: 'none', py: 0.5 }}>
                            € {servizio.costi.parcheggi.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      )}
                      {servizio.costi.altri > 0 && (
                        <TableRow>
                          <TableCell sx={{ border: 'none', py: 0.5 }}>Altri:</TableCell>
                          <TableCell align="right" sx={{ border: 'none', py: 0.5 }}>
                            € {servizio.costi.altri.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Box>
              )}

              {/* Note */}
              {includiNote && servizio.note && (
                <Box bgcolor="#FFF3E0" p={1.5} borderRadius={1}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    📝 NOTE IMPORTANTI
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                    {servizio.note}
                  </Typography>
                </Box>
              )}

              {/* Spazio per annotazioni */}
              <Box mt={2} p={2} border="1px dashed #999" borderRadius={1}>
                <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                  SPAZIO PER ANNOTAZIONI AUTISTA:
                </Typography>
                <Box height="60px" />
              </Box>

              {/* Firma */}
              <Box mt={2} display="flex" justifyContent="space-between">
                <Box width="45%">
                  <Typography variant="caption" color="text.secondary">
                    Km Iniziali: _____________
                  </Typography>
                </Box>
                <Box width="45%">
                  <Typography variant="caption" color="text.secondary">
                    Km Finali: _____________
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Page break tra servizi */}
            {index < serviziOrdinati.length - 1 && (
              <Box sx={{ pageBreakAfter: 'always' }} />
            )}
          </Box>
        ))}

        {/* Footer finale */}
        {autistaSelezionato && serviziOrdinati.length > 0 && (
          <Box mt={4} pt={2} borderTop="2px solid #714B67">
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Firma Autista
                </Typography>
                <Box mt={1} height="40px" borderBottom="1px solid #999" />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Data e Ora
                </Typography>
                <Box mt={1} height="40px" borderBottom="1px solid #999" />
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>

      <style>
        {`
          @media print {
            .no-print {
              display: none !important;
            }
            .print-only {
              display: block !important;
            }
            @page {
              size: A4;
              margin: 15mm;
            }
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
          @media screen {
            .print-only {
              display: none;
            }
          }
        `}
      </style>
    </>
  );
};

export default FoglioLavoroGiornaliero;