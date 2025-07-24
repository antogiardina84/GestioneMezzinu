// src/components/ren/RENDetailModal.tsx
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Button,
  Grid,
} from '@mui/material';
import {
  Close as CloseIcon,
  Assignment as AssignmentIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import 'dayjs/locale/it';
import { REN } from '../../types/REN';
import FileUploadComponent from '../common/FileUploadComponent';

interface RENDetailModalProps {
  ren: REN;
  onClose: () => void;
  onRefresh?: () => void;
}

const RENDetailModal: React.FC<RENDetailModalProps> = ({ 
  ren, 
  onClose,
  onRefresh
}) => {
  const formatDate = (date: string | Date) => {
    if (!date) return '-';
    return dayjs(date).format('DD/MM/YYYY');
  };

  const getScadenzaStatus = () => {
    const oggi = dayjs();
    const scadenza = dayjs(ren.dataScadenzaREN);
    const giorni = scadenza.diff(oggi, 'day');

    if (giorni < 0) {
      return { label: 'Scaduto', color: 'error' };
    } else if (giorni <= 90) {
      return { label: `Scade tra ${giorni} giorni`, color: 'error' };
    } else if (giorni <= 180) {
      return { label: `Scade tra ${giorni} giorni`, color: 'warning' };
    }
    return { label: 'Valido', color: 'success' };
  };

  const scadenzaStatus = getScadenzaStatus();

  return (
    <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssignmentIcon /> Dettaglio Iscrizione REN
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Typography variant="h6">{ren.numeroIscrizioneREN}</Typography>
        <Chip 
          label={scadenzaStatus.label} 
          color={scadenzaStatus.color as any} 
          size="medium"
        />
        <Chip 
          label={ren.tipologiaAttività} 
          color={ren.tipologiaAttività === 'Conto Terzi' ? 'primary' : 'secondary'}
          size="medium"
        />
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Informazioni generali */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom component="div">
              Informazioni Iscrizione
            </Typography>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell component="th" scope="row">Numero REN:</TableCell>
                  <TableCell>{ren.numeroIscrizioneREN}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">Data Iscrizione:</TableCell>
                  <TableCell>{formatDate(ren.dataIscrizioneREN)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">Data Scadenza:</TableCell>
                  <TableCell>
                    {formatDate(ren.dataScadenzaREN)}
                    <Chip 
                      size="small" 
                      label={scadenzaStatus.label} 
                      color={scadenzaStatus.color as any}
                      sx={{ ml: 1 }}
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom component="div">
              Informazioni Territoriali
            </Typography>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell component="th" scope="row">Regione:</TableCell>
                  <TableCell>{ren.regione}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">Provincia:</TableCell>
                  <TableCell>{ren.provincia}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">Tipologia:</TableCell>
                  <TableCell>
                    <Chip 
                      label={ren.tipologiaAttività} 
                      color={ren.tipologiaAttività === 'Conto Terzi' ? 'primary' : 'secondary'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
                {ren.numeroIscrizioneContoTerzi && (
                  <TableRow>
                    <TableCell component="th" scope="row">N. Iscrizione Conto Terzi:</TableCell>
                    <TableCell>{ren.numeroIscrizioneContoTerzi}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>

      {/* Sezione Allegati */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom component="div">
          Allegati
        </Typography>
        <FileUploadComponent 
          entityId={ren._id}
          entityType="ren"
          onSuccess={onRefresh || (() => {})}
          currentFiles={ren.allegati || []}
        />
      </Paper>

      {/* Note e azioni */}
      <Box sx={{ bgcolor: 'primary.light', p: 2, borderRadius: 1, mt: 3, mb: 3 }}>
        <Typography variant="caption" color="white" component="div" sx={{ display: 'block', mb: 1 }}>
          <strong>Ricorda:</strong>
        </Typography>
        <Typography variant="caption" color="white" component="div">
          • Il REN deve essere rinnovato annualmente<br />
          • La procedura di rinnovo va completata tramite il Portale del Trasporto<br />
          • È necessario pagare la quota annuale all'Albo degli autotrasportatori
        </Typography>
      </Box>
    </Paper>
  );
};

export default RENDetailModal;