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
  Divider,
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
  CalendarToday,
  Person,
  DirectionsCar,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/it';
import { serviziService } from '../../services/serviziService';
import { Servizio } from '../../types/Servizio';

interface FoglioLavoroGiornalieroProps {
  open: boolean;
  onClose: () => void;
  dataPreselezionata?: Dayjs;
}

const FoglioLavoroGiornaliero: React.FC<FoglioLavoroGiornalieroProps> = ({
  open,
  onClose,
  dataPreselezionata,
}) => {
  const [data, setData] = useState<Dayjs>(dataPreselezionata || dayjs());
  const [servizi, setServizi] = useState<Servizio[]>([]);
  const [autisti, setAutisti] = useState<string[]>([]);
  const [autistaSelezionato, setAutistaSelezionato] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [includiNote, setIncludiNote] = useState(true);
  const [includiMateriali, setIncludiMateriali] = useState(true);
  const [includiCliente, setIncludiCliente] = useState(true);
  const [includiCosti, setIncludiCosti] = useState(false);

  // Carica servizi quando cambia la data
  useEffect(() => {
    if (open && data) {
      loadServizi();
    }
  }, [open, data]);

  // Estrai lista autisti unici
  useEffect(() => {
    const autistiUnici = Array.from(
      new Set(
        servizi
          .filter(s => s.autista)
          .map(s => s.autista)
      )
    ).sort();
    setAutisti(autistiUnici);
    
    // Preseleziona primo autista se ce n'è solo uno
    if (autistiUnici.length === 1 && !autistaSelezionato) {
      setAutistaSelezionato(autistiUnici[0]);
    }
  }, [servizi]);

  const loadServizi = async () => {
    try {
      setLoading(true);
      const startOfDay = data.startOf('day').toISOString();
      const endOfDay = data.endOf('day').toISOString();
      
      const response = await serviziService.getAll({
        limit: 1000,
        dataInizio: startOfDay,
        dataFine: endOfDay,
        stato: 'Programmato,In corso', // Solo servizi attivi
      });
      
      const serviziDelGiorno = (response.data || []).filter(servizio => {
        const servizioDate = dayjs(servizio.dataInizio);
        return servizioDate.format('YYYY-MM-DD') === data.format('YYYY-MM-DD');
      });
      
      setServizi(serviziDelGiorno);
    } catch (error) {
      console.error('Errore caricamento servizi:', error);
      setServizi([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtra servizi per autista selezionato
  const serviziAutista = servizi.filter(s => s.autista === autistaSelezionato);

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

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
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
            <IconButton onClick={onClose} size="small">
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
                  label="Autista"
                  onChange={(e) => setAutistaSelezionato(e.target.value)}
                  disabled={loading || autisti.length === 0}
                >
                  {autisti.map((autista) => (
                    <MenuItem key={autista} value={autista}>
                      {autista}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {servizi.length === 0 && !loading && (
              <Grid item xs={12}>
                <Alert severity="info">
                  Nessun servizio programmato per questa data
                </Alert>
              </Grid>
            )}

            {autisti.length === 0 && servizi.length > 0 && (
              <Grid item xs={12}>
                <Alert severity="warning">
                  Nessun autista assegnato ai servizi di questa data
                </Alert>
              </Grid>
            )}

            {autistaSelezionato && serviziAutista.length === 0 && (
              <Grid item xs={12}>
                <Alert severity="info">
                  Nessun servizio assegnato a {autistaSelezionato} per questa data
                </Alert>
              </Grid>
            )}

            {autistaSelezionato && serviziAutista.length > 0 && (
              <Grid item xs={12}>
                <Alert severity="success">
                  {serviziAutista.length} servizio/i trovato/i per {autistaSelezionato}
                </Alert>
              </Grid>
            )}

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Opzioni Stampa
              </Typography>
              <Stack spacing={1}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includiNote}
                      onChange={(e) => setIncludiNote(e.target.checked)}
                    />
                  }
                  label="Includi note"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includiMateriali}
                      onChange={(e) => setIncludiMateriali(e.target.checked)}
                    />
                  }
                  label="Includi materiali"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includiCliente}
                      onChange={(e) => setIncludiCliente(e.target.checked)}
                    />
                  }
                  label="Includi dati cliente"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includiCosti}
                      onChange={(e) => setIncludiCosti(e.target.checked)}
                    />
                  }
                  label="Includi costi previsti"
                />
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={onClose}>Annulla</Button>
          {autisti.length > 1 && (
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handleStampaTuttiAutisti}
              disabled={loading || servizi.length === 0}
            >
              Stampa Tutti ({autisti.length} autisti)
            </Button>
          )}
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

      {/* Contenuto da stampare */}
      <Box className="print-only" sx={{ display: 'none' }}>
        {(autistaSelezionato === 'TUTTI' ? autisti : [autistaSelezionato]).map((autista, idx) => {
          const serviziPerAutista = servizi.filter(s => s.autista === autista);
          const serviziOrdinatiPerAutista = [...serviziPerAutista].sort((a, b) => 
            a.oraInizio.localeCompare(b.oraInizio)
          );

          if (serviziOrdinatiPerAutista.length === 0) return null;

          return (
            <Box
              key={autista}
              sx={{
                pageBreakAfter: idx < autisti.length - 1 ? 'always' : 'auto',
                padding: '20mm',
                '@media print': {
                  padding: '15mm',
                }
              }}
            >
              {/* Header Foglio Lavoro */}
              <Box mb={3}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                      FOGLIO DI LAVORO GIORNALIERO
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      {data.format('dddd, D MMMM YYYY').toUpperCase()}
                    </Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="body2" color="text.secondary">
                      Stampato il {dayjs().format('DD/MM/YYYY HH:mm')}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2, borderWidth: 2, borderColor: '#714B67' }} />

                {/* Info Autista */}
                <Box bgcolor="#F5F5F5" p={2} borderRadius={1} mb={2}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Person />
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            AUTISTA
                          </Typography>
                          <Typography variant="h6" fontWeight="bold">
                            {autista}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <DirectionsCar />
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            AUTOVEICOLO
                          </Typography>
                          <Typography variant="h6" fontWeight="bold">
                            {serviziOrdinatiPerAutista[0]?.autoveicolo?.targa || '-'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {serviziOrdinatiPerAutista[0]?.autoveicolo?.marca}{' '}
                            {serviziOrdinatiPerAutista[0]?.autoveicolo?.modello}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>

                {/* Riepilogo */}
                <Box bgcolor="#E3F2FD" p={2} borderRadius={1}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    RIEPILOGO GIORNATA
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">
                        Totale Servizi
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {serviziOrdinatiPerAutista.length}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">
                        Primo Servizio
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {serviziOrdinatiPerAutista[0]?.oraInizio || '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">
                        Ultimo Servizio
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {serviziOrdinatiPerAutista[serviziOrdinatiPerAutista.length - 1]?.oraFine || '-'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Box>

              {/* Lista Servizi */}
              {serviziOrdinatiPerAutista.map((servizio, index) => (
                <Box
                  key={servizio._id}
                  mb={3}
                  pb={3}
                  sx={{
                    pageBreakInside: 'avoid',
                    borderBottom: index < serviziOrdinatiPerAutista.length - 1 ? '1px solid #E0E0E0' : 'none',
                  }}
                >
                  {/* Header Servizio */}
                  <Box bgcolor="#714B67" color="white" p={1.5} borderRadius="4px 4px 0 0">
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6" fontWeight="bold">
                        SERVIZIO #{index + 1} - {servizio.oraInizio} - {servizio.oraFine}
                      </Typography>
                      <Chip
                        label={servizio.priorita}
                        sx={{
                          bgcolor: 'white',
                          color: '#714B67',
                          fontWeight: 'bold',
                        }}
                        size="small"
                      />
                    </Box>
                  </Box>

                  {/* Corpo Servizio */}
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: '0 0 4px 4px' }}>
                    {/* Titolo e Tipo */}
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {servizio.titolo}
                    </Typography>
                    <Chip
                      label={servizio.tipoServizio}
                      size="small"
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />

                    {/* Descrizione */}
                    {servizio.descrizione && (
                      <Box mb={2}>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                          Descrizione:
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                          {servizio.descrizione}
                        </Typography>
                      </Box>
                    )}

                    {/* Luoghi */}
                    {(servizio.luogoPartenza || servizio.luogoArrivo) && (
                      <Box mb={2}>
                        <Table size="small">
                          <TableBody>
                            {servizio.luogoPartenza && (
                              <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', width: '120px', border: 'none' }}>
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
                </Box>
              ))}

              {/* Footer */}
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
            </Box>
          );
        })}
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