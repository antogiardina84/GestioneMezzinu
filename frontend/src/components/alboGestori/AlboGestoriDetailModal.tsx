// src/components/alboGestori/AlboGestoriDetailModal.tsx
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
} from '@mui/material';
import {
  Close as CloseIcon,
  Receipt as ReceiptIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import 'dayjs/locale/it';
import { AlboGestori } from '../../types/AlboGestori';
import { alboGestoriService } from '../../services/alboGestoriService';
import FileUploadComponent from '../common/FileUploadComponent';

interface AlboGestoriDetailModalProps {
  alboGestore: AlboGestori;
  onClose: () => void;
  onRefresh?: () => void;
}

const AlboGestoriDetailModal: React.FC<AlboGestoriDetailModalProps> = ({ 
  alboGestore, 
  onClose,
  onRefresh
}) => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const formatDate = (date: string | Date) => {
    if (!date) return '-';
    return dayjs(date).format('DD/MM/YYYY');
  };

  const getScadenzaStatus = () => {
    const oggi = dayjs();
    const scadenza = dayjs(alboGestore.dataScadenzaIscrizione);
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

  const handleUploadDialogOpen = () => {
    setUploadDialogOpen(true);
  };

  const handleUploadDialogClose = () => {
    setUploadDialogOpen(false);
  };

  const handleUpload = async (files: FileList, fileType: string) => {
    await alboGestoriService.uploadAllegati(alboGestore._id, files, fileType);
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleDeleteAllegato = async (allegatoId: string) => {
    try {
      await alboGestoriService.deleteAllegato(alboGestore._id, allegatoId);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Errore eliminazione allegato:', error);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReceiptIcon /> Dettaglio Iscrizione Albo Gestori
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Typography variant="h6">{alboGestore.numeroIscrizioneAlbo}</Typography>
        <Chip 
          label={scadenzaStatus.label} 
          color={scadenzaStatus.color as any} 
          size="medium"
        />
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Informazioni generali */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Informazioni Iscrizione
        </Typography>
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell component="th" scope="row">Numero Iscrizione:</TableCell>
              <TableCell>{alboGestore.numeroIscrizioneAlbo}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell component="th" scope="row">Categoria:</TableCell>
              <TableCell>{alboGestore.categoria}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell component="th" scope="row">Classe:</TableCell>
              <TableCell>{alboGestore.classe}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell component="th" scope="row">Data Iscrizione:</TableCell>
              <TableCell>{formatDate(alboGestore.dataIscrizione)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell component="th" scope="row">Data Scadenza:</TableCell>
              <TableCell>
                {formatDate(alboGestore.dataScadenzaIscrizione)}
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

      {/* Sezione Allegati */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom component="div">
          Allegati
        </Typography>
        <FileUploadComponent 
          entityId={alboGestore._id}
          entityType="alboGestori"
          onSuccess={onRefresh || (() => {})}
          currentFiles={alboGestore.allegati || []}
        />
      </Paper>

      {/* Note e azioni */}
      <Box sx={{ bgcolor: 'primary.light', p: 2, borderRadius: 1, mt: 3, mb: 3 }}>
        <Typography variant="caption" color="white" component="div" sx={{ display: 'block', mb: 1 }}>
          <strong>Ricorda:</strong>
        </Typography>
        <Typography variant="caption" color="white" component="div">
          • L'iscrizione deve essere rinnovata ogni 5 anni<br />
          • La domanda di rinnovo deve essere presentata 5 mesi prima della scadenza<br />
          • Per le imprese categoria 2 bis, la validità è di 10 anni
        </Typography>
      </Box>
    </Paper>
  );
};

export default AlboGestoriDetailModal;