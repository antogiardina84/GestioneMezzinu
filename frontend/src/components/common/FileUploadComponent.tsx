// src/components/common/FileUploadComponent.tsx
import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  AddCircleOutline as AddIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import FileAttachmentViewer, { Attachment } from './FileAttachmentViewer';
import { autoveicoliService } from '../../services/autoveicoliService';
import { alboGestoriService } from '../../services/alboGestoriService';
import { renService } from '../../services/renService';
import { manutenzioniService } from '../../services/manutenzioniService';

interface FileUploadComponentProps {
  entityId: string;
  entityType: 'autoveicolo' | 'alboGestori' | 'ren' | 'manutenzioni'; // AGGIUNTO manutenzioni
  onSuccess: () => void;
  currentFiles?: Attachment[];
  allowedTypes?: string[];
  maxFileSize?: number;
  maxFiles?: number;
}

const FileUploadComponent: React.FC<FileUploadComponentProps> = ({
  entityId,
  entityType,
  onSuccess,
  currentFiles = [],
  allowedTypes = [
    'image/jpeg', 
    'image/png', 
    'image/gif',
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
    'application/vnd.ms-excel', 
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain'
  ],
  maxFileSize = 10, // 10MB default
  maxFiles = 10
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [fileType, setFileType] = useState<string>('Altro');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Opzioni per i tipi di documento in base all'entità
  const getFileTypeOptions = () => {
    switch (entityType) {
      case 'autoveicolo':
        return [
          'Carta Circolazione',
          'Ricevute Pagamenti',
          'Contratti',
          'Libretto Manutenzioni',
          'Certificato Assicurazione',
          'Documenti Revisione',
          'Altro'
        ];
      case 'alboGestori':
        return [
          'Iscrizione',
          'Rinnovo',
          'Autorizzazione',
          'Certificato',
          'Altro'
        ];
      case 'ren':
        return [
          'Iscrizione',
          'Attestato',
          'Rinnovo',
          'Licenza',
          'Altro'
        ];
      case 'manutenzioni':  // AGGIUNTO
        return [
          'Fattura',
          'Preventivo',
          'Ricevuta',
          'Foto Prima',
          'Foto Dopo',
          'Scheda Tecnica',
          'Garanzia',
          'Altro'
        ];
      default:
        return ['Altro'];
    }
  };

  // Determinare quale servizio usare in base al tipo di entità
  const getUploadService = () => {
    switch (entityType) {
      case 'autoveicolo':
        return autoveicoliService;
      case 'alboGestori':
        return alboGestoriService;
      case 'ren':
        return renService;
      case 'manutenzioni':  // AGGIUNTO
        return manutenzioniService;
      default:
        throw new Error('Tipo di entità non supportato');
    }
  };

  // Validazione dei file
  const validateFiles = (files: FileList): string | null => {
    const fileArray = Array.from(files);
    
    // Controlla il numero massimo di file
    if (fileArray.length > maxFiles) {
      return `Massimo ${maxFiles} file consentiti`;
    }

    // Controlla ogni file
    for (const file of fileArray) {
      // Controlla il tipo
      if (!allowedTypes.includes(file.type)) {
        return `Tipo di file non supportato: ${file.name}`;
      }
      
      // Controlla la dimensione
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxFileSize) {
        return `File troppo grande: ${file.name} (${fileSizeMB.toFixed(2)}MB > ${maxFileSize}MB)`;
      }
    }

    return null;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const validationError = validateFiles(event.target.files);
      
      if (validationError) {
        setError(validationError);
        setSelectedFiles([]);
        // Reset del campo input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setError('');
        setSelectedFiles(Array.from(event.target.files));
      }
    } else {
      setSelectedFiles([]);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Seleziona almeno un file da caricare');
      return;
    }

    try {
      setUploadProgress(true);
      setError('');
      
      console.log('Uploading files:', {
        entityId,
        entityType,
        fileCount: selectedFiles.length,
        fileType
      });

      // Converti l'array di File in FileList per compatibilità
      const dt = new DataTransfer();
      selectedFiles.forEach(file => dt.items.add(file));
      const fileList = dt.files;

      const service = getUploadService();
      await service.uploadAllegati(entityId, fileList, fileType);
      
      setSuccess(true);
      setSelectedFiles([]);
      setFileType('Altro');
      
      // Reset del campo input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Notifica il componente padre del successo
      onSuccess();
      
      // Chiudi il dialog dopo un breve delay per mostrare il messaggio di successo
      setTimeout(() => {
        setDialogOpen(false);
        setSuccess(false);
      }, 1500);
      
    } catch (err: any) {
      console.error('Errore durante il caricamento dei file:', err);
      setError(err.response?.data?.message || err.message || 'Errore durante il caricamento dei file');
    } finally {
      setUploadProgress(false);
    }
  };

  const handleDeleteFile = async (allegatoId: string) => {
    try {
      console.log('Deleting file:', { entityId, allegatoId, entityType });
      
      const service = getUploadService();
      await service.deleteAllegato(entityId, allegatoId);
      
      console.log('File deleted successfully');
      onSuccess();
    } catch (err: any) {
      console.error('Errore durante l\'eliminazione del file:', err);
      setError(err.response?.data?.message || err.message || 'Errore durante l\'eliminazione del file');
    }
  };

  const handleOpenDialog = () => {
    setDialogOpen(true);
    setSuccess(false);
    setError('');
    setSelectedFiles([]);
    setFileType('Altro');
    
    // Reset del campo input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedFiles([]);
    setError('');
    setSuccess(false);
    
    // Reset del campo input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    
    // Se non ci sono più file, reset del campo input
    if (newFiles.length === 0 && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Converti le estensioni in formato leggibile
  const getReadableFileTypes = () => {
    const extensions = allowedTypes.map(type => {
      switch (type) {
        case 'image/jpeg': return 'JPG';
        case 'image/png': return 'PNG';
        case 'image/gif': return 'GIF';
        case 'application/pdf': return 'PDF';
        case 'application/msword': return 'DOC';
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': return 'DOCX';
        case 'application/vnd.ms-excel': return 'XLS';
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': return 'XLSX';
        case 'text/csv': return 'CSV';
        case 'text/plain': return 'TXT';
        default: return type.split('/')[1]?.toUpperCase() || 'UNKNOWN';
      }
    });
    return extensions.join(', ');
  };

  return (
    <>
      <Box>
        {/* Visualizzatore allegati esistenti */}
        <FileAttachmentViewer 
          attachments={currentFiles}
          canDelete={true}
          onDelete={handleDeleteFile}
          title={`Allegati (${currentFiles.length})`}
        />
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
          fullWidth
          sx={{ mt: 2 }}
        >
          Carica Nuovo Allegato
        </Button>
      </Box>

      {/* Dialog per upload file */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Carica Nuovi Allegati
          <Typography variant="caption" display="block" color="text.secondary">
            Massimo {maxFiles} file, {maxFileSize}MB per file
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ p: 1 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>File caricati con successo!</Alert>}

            {uploadProgress && (
              <Box sx={{ mb: 2 }}>
                <LinearProgress />
                <Typography variant="caption" color="text.secondary">
                  Caricamento in corso...
                </Typography>
              </Box>
            )}

            <Paper 
              elevation={0} 
              sx={{ 
                p: 4, 
                border: '2px dashed #ccc', 
                textAlign: 'center',
                mb: 3,
                bgcolor: '#f9f9f9',
                '&:hover': {
                  bgcolor: '#f0f0f0',
                  borderColor: '#999'
                }
              }}
            >
              <input
                ref={fileInputRef}
                accept={allowedTypes.join(',')}
                style={{ display: 'none' }}
                id="file-upload"
                type="file"
                multiple
                onChange={handleFileChange}
                disabled={uploadProgress}
              />
              <label htmlFor="file-upload">
                <Button
                  component="span"
                  variant="contained"
                  color="primary"
                  startIcon={<UploadIcon />}
                  disabled={uploadProgress}
                  size="large"
                >
                  Seleziona File
                </Button>
              </label>

              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                Formati supportati: {getReadableFileTypes()}
              </Typography>
              <Typography variant="caption" color="textSecondary" display="block">
                Dimensione massima per file: {maxFileSize}MB
              </Typography>
            </Paper>

            {/* Lista file selezionati */}
            {selectedFiles.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  File selezionati ({selectedFiles.length})
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedFiles.map((file, index) => (
                    <Chip
                      key={index}
                      label={`${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB)`}
                      onDelete={() => removeFile(index)}
                      deleteIcon={<CloseIcon />}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>

                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Tipo di documento</InputLabel>
                  <Select
                    value={fileType}
                    label="Tipo di documento"
                    onChange={(e) => setFileType(e.target.value)}
                    disabled={uploadProgress}
                  >
                    {getFileTypeOptions().map(option => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={uploadProgress}>
            Chiudi
          </Button>
          <Button
            onClick={handleUpload}
            color="primary"
            variant="contained"
            disabled={selectedFiles.length === 0 || uploadProgress}
            startIcon={uploadProgress ? <CircularProgress size={20} /> : <UploadIcon />}
          >
            {uploadProgress ? 'Caricamento...' : `Carica ${selectedFiles.length} file`}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FileUploadComponent;