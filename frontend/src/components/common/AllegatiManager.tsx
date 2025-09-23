// src/components/common/AllegatiManager.tsx - Componente con Drag & Drop
import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  Chip,
  LinearProgress,
  Card,
  CardContent,
} from '@mui/material';
import {
  CloudUpload,
  AttachFile,
  Delete,
  Visibility,
  Refresh,
  DragIndicator,
  FileUpload,
} from '@mui/icons-material';

interface Allegato {
  _id: string;
  nomeFile: string;
  percorsoFile: string;
  tipo: string;
  dataCaricamento: Date | string;
}

interface AllegatiManagerProps {
  allegati: Allegato[];
  onUpload: (files: FileList, tipo: string) => Promise<void>;
  onDelete: (allegatoId: string) => Promise<void>;
  onDownload?: (allegato: Allegato) => void;
  title?: string;
  tipiAllegati?: string[];
  readonly?: boolean;
}

const TIPI_ALLEGATI_DEFAULT = [
  'Libretto di circolazione',
  'Certificato di proprietà',
  'Polizza assicurazione',
  'Ricevuta bollo',
  'Certificato revisione',
  'Autorizzazione trasporto rifiuti',
  'Pass ZTL',
  'Contratto leasing/noleggio',
  'Fattura acquisto',
  'Manutenzione',
  'Altro'
];

const ACCEPTED_FORMATS = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const AllegatiManager: React.FC<AllegatiManagerProps> = ({
  allegati,
  onUpload,
  onDelete,
  onDownload,
  title = 'Allegati',
  tipiAllegati = TIPI_ALLEGATI_DEFAULT,
  readonly = false
}) => {
  const [showUploadDialog, setShowUploadDialog] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [selectedFiles, setSelectedFiles] = React.useState<FileList | null>(null);
  const [tipoAllegato, setTipoAllegato] = React.useState('');
  const [uploadError, setUploadError] = React.useState('');
  const [isDragOver, setIsDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Formatta data
  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return 'Data non disponibile';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('it-IT');
  };

  // Valida files
  const validateFiles = (files: FileList): string | null => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Controllo dimensione
      if (file.size > MAX_FILE_SIZE) {
        return `Il file "${file.name}" supera la dimensione massima di 10MB`;
      }
      
      // Controllo formato
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ACCEPTED_FORMATS.split(',').includes(extension)) {
        return `Il file "${file.name}" ha un formato non supportato`;
      }
    }
    return null;
  };

  // Gestione drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const error = validateFiles(files);
      if (error) {
        setUploadError(error);
        setShowUploadDialog(true);
      } else {
        setSelectedFiles(files);
        setUploadError('');
        setShowUploadDialog(true);
      }
    }
  };

  // Gestione selezione file
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const error = validateFiles(files);
      if (error) {
        setUploadError(error);
      } else {
        setSelectedFiles(files);
        setUploadError('');
      }
    }
  };

  // Gestione upload allegati
  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0 || !tipoAllegato) {
      setUploadError('Seleziona almeno un file e specifica il tipo');
      return;
    }

    try {
      setUploading(true);
      setUploadError('');
      
      await onUpload(selectedFiles, tipoAllegato);
      
      // Reset form
      setShowUploadDialog(false);
      setSelectedFiles(null);
      setTipoAllegato('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Errore upload allegati:', error);
      setUploadError(error.response?.data?.error || error.message || 'Errore durante l\'upload');
    } finally {
      setUploading(false);
    }
  };

  // Gestione eliminazione allegato
  const handleDelete = async (allegatoId: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo allegato?')) {
      try {
        await onDelete(allegatoId);
      } catch (error) {
        console.error('Errore eliminazione allegato:', error);
      }
    }
  };

  // Gestione download/visualizzazione
  const handleDownloadOrView = (allegato: Allegato) => {
    if (onDownload) {
      onDownload(allegato);
    } else {
      // Fallback: prova a costruire l'URL di download
      const downloadUrl = `/api/autoveicoli/allegati/${allegato._id}/download`;
      window.open(downloadUrl, '_blank');
    }
  };

  // Calcola dimensione totale
  const getTotalSize = () => {
    if (!selectedFiles) return '';
    const totalBytes = Array.from(selectedFiles).reduce((sum, file) => sum + file.size, 0);
    const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);
    return `${totalMB} MB`;
  };

  // Formatta dimensione file
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle1" fontWeight="bold" component="div">
          {title} ({allegati?.length || 0})
        </Typography>
        {!readonly && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<CloudUpload />}
            onClick={() => setShowUploadDialog(true)}
          >
            Carica Allegato
          </Button>
        )}
      </Box>
      
      {allegati && allegati.length > 0 ? (
        <List dense>
          {allegati.map((allegato, index) => (
            <ListItem key={allegato._id || index} divider>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <AttachFile fontSize="small" />
                    <Typography variant="body2" fontWeight="medium">
                      {allegato.nomeFile}
                    </Typography>
                    <Chip 
                      label={allegato.tipo} 
                      size="small" 
                      variant="outlined" 
                      color="primary"
                    />
                  </Box>
                }
                secondary={`Caricato il ${formatDate(allegato.dataCaricamento)}`}
              />
              <ListItemSecondaryAction>
                <IconButton
                  size="small"
                  onClick={() => handleDownloadOrView(allegato)}
                  title="Visualizza/Download"
                >
                  <Visibility />
                </IconButton>
                {!readonly && (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(allegato._id)}
                    title="Elimina"
                  >
                    <Delete />
                  </IconButton>
                )}
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      ) : (
        <Alert severity="info" sx={{ mt: 1 }}>
          {readonly ? 'Nessun allegato presente' : 'Nessun allegato caricato. Clicca su "Carica Allegato" per aggiungerne uno.'}
        </Alert>
      )}

      {/* DIALOG UPLOAD ALLEGATI CON DRAG & DROP */}
      <Dialog 
        open={showUploadDialog} 
        onClose={() => setShowUploadDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <FileUpload />
            Carica Nuovo Allegato
          </Box>
        </DialogTitle>
        <DialogContent>
          {uploadError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {uploadError}
            </Alert>
          )}
          
          {uploading && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                Caricamento in corso...
              </Typography>
              <LinearProgress />
            </Box>
          )}
          
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Tipo Allegato</InputLabel>
            <Select
              value={tipoAllegato}
              onChange={(e) => setTipoAllegato(e.target.value)}
              label="Tipo Allegato"
              disabled={uploading}
            >
              {tipiAllegati.map((tipo) => (
                <MenuItem key={tipo} value={tipo}>
                  {tipo}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* ZONA DRAG & DROP */}
          <Card
            sx={{
              mb: 2,
              border: isDragOver ? '2px dashed #1976d2' : '2px dashed #ccc',
              bgcolor: isDragOver ? 'action.hover' : 'background.paper',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                border: '2px dashed #1976d2',
                bgcolor: 'action.hover',
              }
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Box sx={{ mb: 2 }}>
                <DragIndicator sx={{ fontSize: 48, color: 'text.secondary' }} />
              </Box>
              <Typography variant="h6" gutterBottom>
                Trascina i file qui o clicca per selezionare
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Puoi caricare più file contemporaneamente
              </Typography>
              <Button
                variant="contained"
                startIcon={<AttachFile />}
                sx={{ mt: 2 }}
                disabled={uploading}
              >
                Seleziona File
              </Button>
            </CardContent>
          </Card>

          {/* INPUT FILE NASCOSTO */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_FORMATS}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            disabled={uploading}
          />

          {/* ANTEPRIMA FILE SELEZIONATI */}
          {selectedFiles && selectedFiles.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                File selezionati ({selectedFiles.length}) - {getTotalSize()}:
              </Typography>
              <Paper sx={{ p: 2, maxHeight: 300, overflow: 'auto', bgcolor: 'grey.50' }}>
                <List dense>
                  {Array.from(selectedFiles).map((file, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <AttachFile fontSize="small" />
                            <Typography variant="body2" fontWeight="medium">
                              {file.name}
                            </Typography>
                            <Chip 
                              label={file.type || 'Tipo sconosciuto'} 
                              size="small" 
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={`${formatFileSize(file.size)} - Modificato: ${new Date(file.lastModified).toLocaleDateString('it-IT')}`}
                      />
                      {file.size > MAX_FILE_SIZE && (
                        <Chip 
                          label="Troppo grande" 
                          size="small" 
                          color="error"
                        />
                      )}
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Box>
          )}

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Formati supportati:</strong> PDF, JPG, PNG, DOC, DOCX, XLS, XLSX, TXT<br />
              <strong>Dimensione massima per file:</strong> 10 MB<br />
              <strong>Upload multiplo:</strong> Puoi selezionare o trascinare più file contemporaneamente
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUploadDialog(false)} disabled={uploading}>
            Annulla
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={uploading || !selectedFiles || !tipoAllegato}
            startIcon={uploading ? <Refresh /> : <CloudUpload />}
          >
            {uploading ? 'Caricamento...' : `Carica ${selectedFiles?.length || 0} file`}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default AllegatiManager;