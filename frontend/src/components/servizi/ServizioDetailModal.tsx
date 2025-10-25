// src/components/servizi/ServizioDetailModal.tsx
import React from 'react';
import {
  Box,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Divider,
  Grid,
  Chip,
  Paper,
  Table,
  TableBody,
  TableRow,
  TableCell,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Close as CloseIcon,
  DirectionsCar,
  Person,
  CalendarToday,
  AccessTime,
  LocalShipping,
  AttachMoney,
  Speed,
  Description,
  Place,
  Business,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { Servizio } from '../../types/Servizio';

interface ServizioDetailModalProps {
  servizio: Servizio;
  onClose: () => void;
}

const ServizioDetailModal: React.FC<ServizioDetailModalProps> = ({ servizio, onClose }) => {
  const getStatoColor = (stato: string) => {
    switch (stato) {
      case 'Programmato': return 'primary';
      case 'In corso': return 'warning';
      case 'Completato': return 'success';
      case 'Annullato': return 'error';
      case 'Posticipato': return 'default';
      default: return 'default';
    }
  };

  const getPrioritaColor = (priorita: string) => {
    switch (priorita) {
      case 'Bassa': return 'default';
      case 'Media': return 'primary';
      case 'Alta': return 'warning';
      case 'Urgente': return 'error';
      default: return 'default';
    }
  };

  const calculateTotalCost = () => {
    const costiBase = (servizio.costi?.pedaggi || 0) + 
                      (servizio.costi?.parcheggi || 0) + 
                      (servizio.costi?.altri || 0);
    const costoCarburante = servizio.carburante?.rifornimento?.effettuato 
      ? (servizio.carburante.rifornimento.costo || 0) 
      : 0;
    return costiBase + costoCarburante;
  };

  return (
    <>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5" component="div" gutterBottom>
              {servizio.titolo}
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
              <Chip 
                label={servizio.stato} 
                color={getStatoColor(servizio.stato) as any} 
                size="small" 
              />
              <Chip 
                label={servizio.priorita} 
                color={getPrioritaColor(servizio.priorita) as any} 
                size="small" 
              />
              <Chip 
                label={servizio.tipoServizio} 
                variant="outlined" 
                size="small" 
              />
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Grid container spacing={3}>
          {/* Sezione Autoveicolo e Autista */}
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DirectionsCar color="primary" /> Autoveicolo e Autista
              </Typography>
              <Grid container spacing={2} mt={1}>
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Autoveicolo
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {servizio.autoveicolo?.targa}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {servizio.autoveicolo?.marca} {servizio.autoveicolo?.modello}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Autista
                    </Typography>
                    <Typography variant="body1" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person fontSize="small" /> {servizio.autista}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Sezione Data e Orari */}
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarToday color="primary" /> Data e Orari
              </Typography>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell><strong>Data Inizio</strong></TableCell>
                    <TableCell>{dayjs(servizio.dataInizio).format('DD/MM/YYYY')}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Data Fine</strong></TableCell>
                    <TableCell>{dayjs(servizio.dataFine).format('DD/MM/YYYY')}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Orario</strong></TableCell>
                    <TableCell>
                      <AccessTime fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                      {servizio.oraInizio} - {servizio.oraFine}
                    </TableCell>
                  </TableRow>
                  {servizio.completato && servizio.dataCompletamento && (
                    <TableRow>
                      <TableCell><strong>Completato il</strong></TableCell>
                      <TableCell>{dayjs(servizio.dataCompletamento).format('DD/MM/YYYY HH:mm')}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>
          </Grid>

          {/* Sezione Costi */}
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachMoney color="primary" /> Costi
              </Typography>
              <Table size="small">
                <TableBody>
                  {servizio.costi && servizio.costi.pedaggi && servizio.costi.pedaggi > 0 && (
                    <TableRow>
                      <TableCell><strong>Pedaggi</strong></TableCell>
                      <TableCell align="right">€ {servizio.costi.pedaggi.toFixed(2)}</TableCell>
                    </TableRow>
                  )}
                  {servizio.costi && servizio.costi.parcheggi && servizio.costi.parcheggi > 0 && (
                    <TableRow>
                      <TableCell><strong>Parcheggi</strong></TableCell>
                      <TableCell align="right">€ {servizio.costi.parcheggi.toFixed(2)}</TableCell>
                    </TableRow>
                  )}
                  {servizio.costi && servizio.costi.altri && servizio.costi.altri > 0 && (
                    <TableRow>
                      <TableCell><strong>Altri</strong></TableCell>
                      <TableCell align="right">€ {servizio.costi.altri.toFixed(2)}</TableCell>
                    </TableRow>
                  )}
                  {servizio.carburante?.rifornimento?.effettuato && (
                    <TableRow>
                      <TableCell><strong>Carburante</strong></TableCell>
                      <TableCell align="right">€ {servizio.carburante.rifornimento.costo?.toFixed(2)}</TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell><strong>TOTALE</strong></TableCell>
                    <TableCell align="right">
                      <Typography variant="h6" color="primary">
                        € {calculateTotalCost().toFixed(2)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Paper>
          </Grid>

          {/* Luoghi */}
          {(servizio.luogoPartenza || servizio.luogoArrivo) && (
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Place color="primary" /> Luoghi
                </Typography>
                <Grid container spacing={2}>
                  {servizio.luogoPartenza && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Partenza
                      </Typography>
                      <Typography variant="body1">
                        {servizio.luogoPartenza.indirizzo}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {servizio.luogoPartenza.citta} ({servizio.luogoPartenza.provincia}) - {servizio.luogoPartenza.cap}
                      </Typography>
                    </Grid>
                  )}
                  {servizio.luogoArrivo && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Arrivo
                      </Typography>
                      <Typography variant="body1">
                        {servizio.luogoArrivo.indirizzo}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {servizio.luogoArrivo.citta} ({servizio.luogoArrivo.provincia}) - {servizio.luogoArrivo.cap}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Grid>
          )}

          {/* Cliente */}
          {servizio.cliente && (servizio.cliente.nome || servizio.cliente.telefono || servizio.cliente.email) && (
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Business color="primary" /> Cliente
                </Typography>
                <Table size="small">
                  <TableBody>
                    {servizio.cliente.nome && (
                      <TableRow>
                        <TableCell><strong>Nome</strong></TableCell>
                        <TableCell>{servizio.cliente.nome}</TableCell>
                      </TableRow>
                    )}
                    {servizio.cliente.telefono && (
                      <TableRow>
                        <TableCell><strong>Telefono</strong></TableCell>
                        <TableCell>{servizio.cliente.telefono}</TableCell>
                      </TableRow>
                    )}
                    {servizio.cliente.email && (
                      <TableRow>
                        <TableCell><strong>Email</strong></TableCell>
                        <TableCell>{servizio.cliente.email}</TableCell>
                      </TableRow>
                    )}
                    {servizio.cliente.riferimento && (
                      <TableRow>
                        <TableCell><strong>Riferimento</strong></TableCell>
                        <TableCell>{servizio.cliente.riferimento}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Paper>
            </Grid>
          )}

          {/* Chilometraggio */}
          {servizio.chilometraggio && servizio.chilometraggio.totale > 0 && (
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Speed color="primary" /> Chilometraggio
                </Typography>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell><strong>Iniziale</strong></TableCell>
                      <TableCell>{servizio.chilometraggio.iniziale} km</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Finale</strong></TableCell>
                      <TableCell>{servizio.chilometraggio.finale} km</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Percorsi</strong></TableCell>
                      <TableCell>
                        <Chip 
                          label={`${servizio.chilometraggio.totale} km`} 
                          color="primary" 
                          size="small" 
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Paper>
            </Grid>
          )}

          {/* Materiali */}
          {servizio.materiali && Array.isArray(servizio.materiali) && servizio.materiali.length > 0 && (
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocalShipping color="primary" /> Materiali Trasportati
                </Typography>
                <List dense>
                  {servizio.materiali?.map((materiale, index) => (
                    <ListItem key={index} divider={index < (servizio.materiali?.length || 0) - 1}>
                      <ListItemText
                        primary={materiale.descrizione}
                        secondary={
                          <>
                            {materiale.quantita && `Quantità: ${materiale.quantita} ${materiale.unitaMisura || ''}`}
                            {materiale.peso && ` • Peso: ${materiale.peso} kg`}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          )}

          {/* Descrizione */}
          {servizio.descrizione && (
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Description color="primary" /> Descrizione
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                  {servizio.descrizione}
                </Typography>
              </Paper>
            </Grid>
          )}

          {/* Note */}
          {servizio.note && (
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                  Note
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                  {servizio.note}
                </Typography>
              </Paper>
            </Grid>
          )}

          {/* Note Completamento */}
          {servizio.noteCompletamento && (
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.light', color: 'white' }}>
                <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                  Note di Completamento
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                  {servizio.noteCompletamento}
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </DialogContent>
    </>
  );
};

export default ServizioDetailModal;