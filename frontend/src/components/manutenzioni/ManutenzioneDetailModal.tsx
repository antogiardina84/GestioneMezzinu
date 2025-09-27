// src/components/manutenzioni/ManutenzioneDetailModal.tsx - VERSIONE CORRETTA
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Edit,
  AttachFile,
  Download,
  Delete,
  Build,
  Schedule,
  CheckCircle,
  Cancel,
  Pause
} from '@mui/icons-material';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/it';

import { Manutenzione } from '../../types/Manutenzione';
import FileUploadComponent from '../common/FileUploadComponent';

// Setup dayjs
dayjs.extend(relativeTime);
dayjs.locale('it');

interface ManutenzioneDetailModalProps {
  open: boolean;
  onClose: () => void;
  manutenzione: Manutenzione | null;
  onEdit: () => void;
  onRefresh: () => void;
}

const ManutenzioneDetailModal: React.FC<ManutenzioneDetailModalProps> = ({
  open,
  onClose,
  manutenzione,
  onEdit,
  onRefresh
}) => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  if (!manutenzione) return null;

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return '-';
    return dayjs(date).format('DD MMMM YYYY');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const calcolaCostoTotale = (): number => {
    const subtotale = manutenzione.costi.manodopera + manutenzione.costi.ricambi + manutenzione.costi.altri;
    const iva = subtotale * (manutenzione.costi.iva / 100);
    return subtotale + iva;
  };

  const calcolaTotaleRicambi = (): number => {
    return manutenzione.ricambi.reduce((sum, ricambio) => 
      sum + (ricambio.quantita * ricambio.prezzoUnitario), 0
    );
  };

  const getStatoIcon = (stato: string) => {
    const icons = {
      'Programmata': <Schedule color="info" />,
      'In corso': <Build color="warning" />,
      'Completata': <CheckCircle color="success" />,
      'Annullata': <Cancel color="error" />,
      'Rimandata': <Pause color="disabled" />
    };
    return icons[stato as keyof typeof icons];
  };

  const getPrioritaColor = (priorita: string) => {
    const colors = {
      'Bassa': 'default' as const,
      'Media': 'info' as const,
      'Alta': 'warning' as const,
      'Urgente': 'error' as const
    };
    return colors[priorita as keyof typeof colors];
  };

  const handleDownloadAllegato = (allegato: any) => {
    // Implementazione download allegato
    const link = document.createElement('a');
    link.href = `/api/files/${allegato.percorsoFile}`;
    link.download = allegato.nomeFile;
    link.click();
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">
              Dettagli Manutenzione
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              {manutenzione.autoveicolo.targa} - {manutenzione.autoveicolo.marca} {manutenzione.autoveicolo.modello}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {getStatoIcon(manutenzione.stato)}
            <Chip
              label={manutenzione.priorita}
              color={getPrioritaColor(manutenzione.priorita)}
              size="small"
            />
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Informazioni Generali */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Informazioni Generali
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Tipo:</Typography>
                    <Typography variant="body2">{manutenzione.tipoManutenzione}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Stato:</Typography>
                    <Chip label={manutenzione.stato} size="small" />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Priorità:</Typography>
                    <Chip 
                      label={manutenzione.priorita} 
                      color={getPrioritaColor(manutenzione.priorita)}
                      size="small" 
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Data Programmata:</Typography>
                    <Typography variant="body2">{formatDate(manutenzione.dataProgrammata)}</Typography>
                  </Box>
                  {manutenzione.dataEsecuzione && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Data Esecuzione:</Typography>
                      <Typography variant="body2">{formatDate(manutenzione.dataEsecuzione)}</Typography>
                    </Box>
                  )}
                  {manutenzione.chilometraggioProgammato && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Km Programmati:</Typography>
                      <Typography variant="body2">{manutenzione.chilometraggioProgammato.toLocaleString()} km</Typography>
                    </Box>
                  )}
                  {manutenzione.chilometraggioEsecuzione && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Km Esecuzione:</Typography>
                      <Typography variant="body2">{manutenzione.chilometraggioEsecuzione.toLocaleString()} km</Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* Fornitore */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Fornitore
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Nome:</Typography>
                    <Typography variant="body2">{manutenzione.fornitore.nome}</Typography>
                  </Box>
                  {manutenzione.fornitore.telefono && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Telefono:</Typography>
                      <Typography variant="body2">{manutenzione.fornitore.telefono}</Typography>
                    </Box>
                  )}
                  {manutenzione.fornitore.email && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Email:</Typography>
                      <Typography variant="body2">{manutenzione.fornitore.email}</Typography>
                    </Box>
                  )}
                  {manutenzione.fornitore.partitaIVA && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">P.IVA:</Typography>
                      <Typography variant="body2">{manutenzione.fornitore.partitaIVA}</Typography>
                    </Box>
                  )}
                  {manutenzione.fornitore.indirizzo && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Indirizzo:</Typography>
                      <Typography variant="body2">{manutenzione.fornitore.indirizzo}</Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* Descrizione */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Descrizione
                </Typography>
                <Typography variant="body2">{manutenzione.descrizione}</Typography>
              </Paper>
            </Grid>

            {/* Costi */}
            {manutenzione.stato === 'Completata' && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Riepilogo Costi
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">Manodopera</Typography>
                        <Typography variant="h6" color="primary">
                          {formatCurrency(manutenzione.costi.manodopera)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">Ricambi</Typography>
                        <Typography variant="h6" color="primary">
                          {formatCurrency(manutenzione.costi.ricambi)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">Altri Costi</Typography>
                        <Typography variant="h6" color="primary">
                          {formatCurrency(manutenzione.costi.altri)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">Totale (IVA {manutenzione.costi.iva}%)</Typography>
                        <Typography variant="h6" color="success.main">
                          {formatCurrency(calcolaCostoTotale())}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            )}

            {/* Ricambi */}
            {manutenzione.ricambi && manutenzione.ricambi.length > 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Ricambi Utilizzati
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Codice</TableCell>
                          <TableCell>Descrizione</TableCell>
                          <TableCell align="center">Quantità</TableCell>
                          <TableCell align="right">Prezzo Unitario</TableCell>
                          <TableCell align="right">Totale</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {manutenzione.ricambi.map((ricambio, index) => (
                          <TableRow key={index}>
                            <TableCell>{ricambio.codice || '-'}</TableCell>
                            <TableCell>{ricambio.descrizione}</TableCell>
                            <TableCell align="center">{ricambio.quantita}</TableCell>
                            <TableCell align="right">{formatCurrency(ricambio.prezzoUnitario)}</TableCell>
                            <TableCell align="right">
                              {formatCurrency(ricambio.quantita * ricambio.prezzoUnitario)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={4}>
                            <Typography variant="body2" fontWeight="bold">Totale Ricambi:</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold">
                              {formatCurrency(calcolaTotaleRicambi())}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            )}

            {/* Note */}
            {manutenzione.note && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Note
                  </Typography>
                  <Typography variant="body2">{manutenzione.note}</Typography>
                </Paper>
              </Grid>
            )}

            {/* Prossima Scadenza */}
            {manutenzione.prossimaScadenza && (
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2" fontWeight="bold">
                    Prossima Manutenzione Programmata:
                  </Typography>
                  <Typography variant="body2">
                    {manutenzione.prossimaScadenza.descrizione}
                    {manutenzione.prossimaScadenza.data && ` - Data: ${formatDate(manutenzione.prossimaScadenza.data)}`}
                    {manutenzione.prossimaScadenza.chilometraggio && ` - Km: ${manutenzione.prossimaScadenza.chilometraggio.toLocaleString()}`}
                  </Typography>
                </Alert>
              </Grid>
            )}

            {/* Allegati */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Allegati ({manutenzione.allegati.length})
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AttachFile />}
                    onClick={() => setUploadDialogOpen(true)}
                    size="small"
                  >
                    Carica Allegati
                  </Button>
                </Box>
                
                {manutenzione.allegati.length > 0 ? (
                  <List>
                    {manutenzione.allegati.map((allegato) => (
                      <ListItem key={allegato._id} divider>
                        <ListItemIcon>
                          <AttachFile />
                        </ListItemIcon>
                        <ListItemText
                          primary={allegato.nomeFile}
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                Tipo: {allegato.tipo}
                              </Typography>
                              <Typography variant="caption" display="block">
                                Caricato: {formatDate(allegato.dataCaricamento)}
                              </Typography>
                            </Box>
                          }
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Scarica">
                            <IconButton size="small" onClick={() => handleDownloadAllegato(allegato)}>
                              <Download />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Elimina">
                            <IconButton size="small" color="error">
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    Nessun allegato presente
                  </Typography>
                )}
              </Paper>
            </Grid>

            {/* Metadati */}
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary" display="block">
                Creato: {formatDate(manutenzione.createdAt)}
                {manutenzione.createdBy && ` da ${manutenzione.createdBy.nome}`}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Ultimo aggiornamento: {formatDate(manutenzione.updatedAt)}
                {manutenzione.updatedBy && ` da ${manutenzione.updatedBy.nome}`}
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>
            Chiudi
          </Button>
          <Button 
            onClick={onEdit} 
            variant="contained"
            startIcon={<Edit />}
          >
            Modifica
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog caricamento allegati separato */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Carica Allegati Manutenzione</DialogTitle>
        <DialogContent>
          <FileUploadComponent
            entityId={manutenzione._id}
            entityType="manutenzioni"
            onSuccess={() => {
              setUploadDialogOpen(false);
              onRefresh();
            }}
            currentFiles={manutenzione.allegati}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>
            Chiudi
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ManutenzioneDetailModal;