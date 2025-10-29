// src/components/autoveicoli/AutoveicoloDetailModal.tsx - VERSIONE CORRETTA
import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Divider,
  IconButton,
  Alert,
} from '@mui/material';
import { Close as CloseIcon, CheckCircle, Cancel } from '@mui/icons-material';
import { Autoveicolo, getIntervalliRevisione, calcolaProssimaRevisione, isMotorVehicle } from '../../types/Autoveicolo';
import FileAttachmentViewer from '../common/FileAttachmentViewer';
import { autoveicoliService } from '../../services/autoveicoliService';

interface AutoveicoloDetailModalProps {
  autoveicolo: Autoveicolo;
  onClose: () => void;
  onRefresh?: () => void | Promise<void>;
}

const AutoveicoloDetailModal: React.FC<AutoveicoloDetailModalProps> = ({ autoveicolo, onClose, onRefresh }) => {
  
  // Funzione per formattare le date
  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return 'Non specificata';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('it-IT');
  };

  // Funzione per ottenere il chip dello stato
  const getStatusChip = (stato: string) => {
    const colors: Record<string, any> = {
      'Attivo': 'success',
      'Chiuso': 'default',
      'Venduto': 'info',
      'Demolito': 'error',
    };
    return <Chip label={stato} color={colors[stato] || 'default'} size="small" />;
  };

  // Funzione per verificare se il veicolo è un mezzo a motore
  const isMotor = isMotorVehicle(autoveicolo.tipoCarrozzeria);

  // Funzione per ottenere il chip del tipo di revisione
  const getRevisionTypeChip = () => {
    const intervalli = getIntervalliRevisione(autoveicolo.tipoCarrozzeria);
    
    if (intervalli.revisioniSuccessive === 1) {
      return <Chip label="Revisione Annuale" color="warning" size="small" />;
    } else {
      return <Chip label="Revisione Biennale" color="info" size="small" />;
    }
  };

  // Calcola la prossima revisione
  const prossimaRevisione = calcolaProssimaRevisione(autoveicolo);

  // Handler per eliminazione allegato
  const handleDeleteAllegato = async (allegatoId: string) => {
    try {
      await autoveicoliService.deleteAllegato(autoveicolo._id, allegatoId);
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Errore eliminazione allegato:', error);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 1000, mx: 'auto', maxHeight: '90vh', overflow: 'auto' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          {autoveicolo.marca} {autoveicolo.modello}
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Typography variant="h6">{autoveicolo.targa}</Typography>
        {getStatusChip(autoveicolo.stato)}
        {getRevisionTypeChip()}
        {autoveicolo.esenteBollo && (
          <Chip label="Esente Bollo" color="secondary" size="small" />
        )}
        {autoveicolo.passZTL && (
          <Chip label="Pass ZTL" color="primary" size="small" />
        )}
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3}>
        {/* SEZIONE 1: INFORMAZIONI GENERALI */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom component="div">
              Informazioni Generali
            </Typography>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell component="th" scope="row">Marca:</TableCell>
                  <TableCell>{autoveicolo.marca}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">Modello:</TableCell>
                  <TableCell>{autoveicolo.modello}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">Targa:</TableCell>
                  <TableCell>{autoveicolo.targa}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">Tipo Carrozzeria:</TableCell>
                  <TableCell>{autoveicolo.tipoCarrozzeria}</TableCell>
                </TableRow>
                {autoveicolo.telaio && (
                  <TableRow>
                    <TableCell component="th" scope="row">Telaio:</TableCell>
                    <TableCell>{autoveicolo.telaio}</TableCell>
                  </TableRow>
                )}
                {autoveicolo.autista && (
                  <TableRow>
                    <TableCell component="th" scope="row">Autista:</TableCell>
                    <TableCell>
                      {typeof autoveicolo.autista === 'object' && autoveicolo.autista !== null
                        ? `${(autoveicolo.autista as any).nome} ${(autoveicolo.autista as any).cognome}`
                        : autoveicolo.autista
                      }
                    </TableCell>
                  </TableRow>
                )}
                {autoveicolo.portataMax && (
                  <TableRow>
                    <TableCell component="th" scope="row">Portata Max:</TableCell>
                    <TableCell>{autoveicolo.portataMax} ton</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        {/* SEZIONE 2: CARATTERISTICHE TECNICHE */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom component="div">
              Caratteristiche Tecniche
            </Typography>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell component="th" scope="row">Cilindrata:</TableCell>
                  <TableCell>
                    {isMotor 
                      ? `${autoveicolo.cilindrata || 0} cc`
                      : 'N/A (Rimorchio/Semirimorchio)'
                    }
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">Potenza:</TableCell>
                  <TableCell>
                    {isMotor 
                      ? `${autoveicolo.kw || 0} kW`
                      : 'N/A (Rimorchio/Semirimorchio)'
                    }
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">Data Immatricolazione:</TableCell>
                  <TableCell>{formatDate(autoveicolo.dataImmatricolazione)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">Tipologia Acquisto:</TableCell>
                  <TableCell>
                    <Chip 
                      label={autoveicolo.tipologiaAcquisto} 
                      color={autoveicolo.tipologiaAcquisto === 'Proprietà' ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
                {autoveicolo.scadenzaTitoloProprietà && (
                  <TableRow>
                    <TableCell component="th" scope="row">Scadenza Titolo:</TableCell>
                    <TableCell>{formatDate(autoveicolo.scadenzaTitoloProprietà)}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        {/* SEZIONE 3: AUTORIZZAZIONI */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom component="div">
              Autorizzazioni
            </Typography>
            <Table size="small">
              <TableBody>
                {autoveicolo.autCat1 && (
                  <TableRow>
                    <TableCell component="th" scope="row">Aut. Cat. 1:</TableCell>
                    <TableCell>{autoveicolo.autCat1}</TableCell>
                  </TableRow>
                )}
                {autoveicolo.autCat2 && (
                  <TableRow>
                    <TableCell component="th" scope="row">Aut. Cat. 2:</TableCell>
                    <TableCell>{autoveicolo.autCat2}</TableCell>
                  </TableRow>
                )}
                {autoveicolo.autCat3 && (
                  <TableRow>
                    <TableCell component="th" scope="row">Aut. Cat. 3:</TableCell>
                    <TableCell>{autoveicolo.autCat3}</TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell component="th" scope="row">Pass ZTL:</TableCell>
                  <TableCell>
                    {autoveicolo.passZTL ? (
                      <CheckCircle color="success" fontSize="small" />
                    ) : (
                      <Cancel color="error" fontSize="small" />
                    )}
                  </TableCell>
                </TableRow>
                {autoveicolo.autRifiuti && autoveicolo.autRifiuti.length > 0 && (
                  <TableRow>
                    <TableCell component="th" scope="row">Aut. Rifiuti:</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {autoveicolo.autRifiuti.map((auth, index) => (
                          <Chip key={index} label={auth} size="small" color="primary" />
                        ))}
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        {/* SEZIONE 4: REVISIONI E BOLLO */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom component="div">
              Revisioni e Bollo
            </Typography>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell component="th" scope="row">Ultima Revisione:</TableCell>
                  <TableCell>{formatDate(autoveicolo.ultimaRevisione)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">Prossima Revisione:</TableCell>
                  <TableCell>{formatDate(prossimaRevisione)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">Stato Bollo:</TableCell>
                  <TableCell>
                    {autoveicolo.esenteBollo ? (
                      <Chip label="Esente" color="secondary" size="small" />
                    ) : (
                      <Chip label="Soggetto" color="primary" size="small" />
                    )}
                  </TableCell>
                </TableRow>
                {!autoveicolo.esenteBollo && (
                  <TableRow>
                    <TableCell component="th" scope="row">Scadenza Bollo:</TableCell>
                    <TableCell>{formatDate(autoveicolo.dataScadenzaBollo)}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        {/* SEZIONE 5: ASSICURAZIONE */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom component="div">
              Assicurazione
            </Typography>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell component="th" scope="row">Compagnia:</TableCell>
                  <TableCell>{autoveicolo.compagniaAssicurazione}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">Numero Polizza:</TableCell>
                  <TableCell>{autoveicolo.numeroPolizzaAssicurazione}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">Inizio Copertura:</TableCell>
                  <TableCell>{formatDate(autoveicolo.dataInizioAssicurazione)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">Scadenza Copertura:</TableCell>
                  <TableCell>{formatDate(autoveicolo.dataScadenzaAssicurazione)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        {/* SEZIONE 6: NOTE */}
        {autoveicolo.note && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom component="div">
                Note e Commenti
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {autoveicolo.note}
              </Typography>
            </Paper>
          </Grid>
        )}

        {/* SEZIONE 7: INFORMAZIONI SISTEMA */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom component="div">
              Informazioni Sistema
            </Typography>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell component="th" scope="row">Data Creazione:</TableCell>
                  <TableCell>{formatDate(autoveicolo.createdAt)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">Ultimo Aggiornamento:</TableCell>
                  <TableCell>{formatDate(autoveicolo.updatedAt)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">Stato:</TableCell>
                  <TableCell>{getStatusChip(autoveicolo.stato)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        {/* SEZIONE 8: DATI DEMOLIZIONE (se applicabile) */}
        {autoveicolo.stato === 'Demolito' && autoveicolo.datiDemolizione && (
          <Grid item xs={12}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom component="div">
                Dati Demolizione
              </Typography>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell component="th" scope="row">Demolitore:</TableCell>
                    <TableCell>{autoveicolo.datiDemolizione.datiDemolitore}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">Data Demolizione:</TableCell>
                    <TableCell>{formatDate(autoveicolo.datiDemolizione.dataDemolizione)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Alert>
          </Grid>
        )}

        {/* SEZIONE 9: ALLEGATI - VERSIONE CORRETTA CON VISUALIZZATORE */}
        <Grid item xs={12}>
          <FileAttachmentViewer 
            attachments={autoveicolo.allegati || []}
            canDelete={true}
            onDelete={handleDeleteAllegato}
            entityType="autoveicolo"
            entityId={autoveicolo._id}
            title={`Allegati (${autoveicolo.allegati?.length || 0})`}
            emptyMessage="Nessun allegato caricato per questo veicolo"
          />
        </Grid>

        {/* SEZIONE 10: ISCRIZIONI ANGA */}
        {autoveicolo.iscrizioneANGA && autoveicolo.iscrizioneANGA.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom component="div">
                Iscrizioni ANGA
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {autoveicolo.iscrizioneANGA.map((iscrizione, index) => (
                  <Chip 
                    key={index} 
                    label={iscrizione} 
                    size="small" 
                    color="info" 
                  />
                ))}
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default AutoveicoloDetailModal;