// src/components/common/FileAttachmentViewer.tsx - VERSIONE FINALE CORRETTA
import React, { useState } from 'react';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Paper,
  Divider,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  InsertDriveFile as FileIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Description as DocIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  FolderOpen as FolderIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import API_CONFIG from '../../config/apiConfig';

export interface Attachment {
  _id: string;
  nomeFile: string;
  percorsoFile: string;
  tipo: string;
  dataCaricamento: Date | string;
}

interface FileAttachmentViewerProps {
  attachments: Attachment[];
  title?: string;
  canDelete?: boolean;
  onDelete?: (attachmentId: string) => Promise<void>;
  emptyMessage?: string;
  entityType?: 'autoveicolo' | 'alboGestori' | 'ren';
  entityId?: string;
}

const FileAttachmentViewer: React.FC<FileAttachmentViewerProps> = ({
  attachments,
  title = "Allegati",
  canDelete = false,
  onDelete,
  emptyMessage = "Nessun allegato caricato",
  entityType = 'autoveicolo',
  entityId
}) => {
  const [selectedFile, setSelectedFile] = useState<Attachment | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch(extension) {
      case 'pdf':
        return <PdfIcon color="error" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <ImageIcon color="primary" />;
      case 'doc':
      case 'docx':
        return <DocIcon color="primary" />;
      case 'xls':
      case 'xlsx':
        return <DocIcon color="success" />;
      default:
        return <FileIcon />;
    }
  };

  const formatDate = (date: string | Date) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy', { locale: it });
  };

  // Funzione per costruire l'URL del file STATICO
const buildStaticFileUrl = (percorsoFile: string): string => {
  if (!percorsoFile) return '';
  
  // Normalizza il percorso
  let normalizedPath = percorsoFile.replace(/\\/g, '/');
  
  // Assicurati che inizi con 'uploads/'
  if (!normalizedPath.startsWith('uploads/')) {
    const uploadsIndex = normalizedPath.indexOf('uploads/');
    if (uploadsIndex >= 0) {
      normalizedPath = normalizedPath.substring(uploadsIndex);
    } else {
      normalizedPath = `uploads/${normalizedPath}`;
    }
  }
  
  // Costruisci l'URL SENZA /api/
  const baseUrl = API_CONFIG.baseURL.replace(/\/$/, '');
  const finalUrl = `${baseUrl}/${normalizedPath}`;
  
  console.log('🔗 buildStaticFileUrl:', percorsoFile, '->', finalUrl);
  return finalUrl;
};

  const handleView = (attachment: Attachment) => {
    const extension = attachment.nomeFile.split('.').pop()?.toLowerCase();
    
    if (extension === 'pdf' || ['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      setSelectedFile(attachment);
      setViewerOpen(true);
    } else {
      handleDownload(attachment);
    }
  };

  const handleCloseViewer = () => {
    setViewerOpen(false);
    setSelectedFile(null);
  };

  const handleDownload = (attachment: Attachment) => {
    if (!entityId) {
      console.error('Entity ID non fornito');
      return;
    }

    // Usa la rotta API di download
    const baseUrl = API_CONFIG.baseURL.replace(/\/$/, '');
    const apiPath = `/api/${entityType === 'autoveicolo' ? 'autoveicoli' : entityType === 'alboGestori' ? 'albo-gestori' : 'ren'}/${entityId}/allegati/${attachment._id}/download`;
    const downloadUrl = `${baseUrl}${apiPath}`;
    
    console.log('Download URL:', downloadUrl);
    window.open(downloadUrl, '_blank');
  };

  const handleDeleteClick = (attachment: Attachment) => {
    setSelectedFile(attachment);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedFile || !onDelete) return;
    
    try {
      setLoading(true);
      await onDelete(selectedFile._id);
      setDeleteConfirmOpen(false);
      setSelectedFile(null);
    } catch (error) {
      console.error('Errore eliminazione allegato:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setSelectedFile(null);
  };

  const renderFilePreview = (attachment: Attachment) => {
    const fileUrl = buildStaticFileUrl(attachment.percorsoFile);
    const extension = attachment.nomeFile.split('.').pop()?.toLowerCase();
    
    console.log('Preview URL:', fileUrl);
    
    switch(extension) {
      case 'pdf':
        return (
          <Box sx={{ height: '600px', width: '100%' }}>
            <iframe 
              src={fileUrl} 
              style={{ width: '100%', height: '100%', border: 'none' }}
              title={attachment.nomeFile}
            />
          </Box>
        );
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <img 
              src={fileUrl} 
              alt={attachment.nomeFile} 
              style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }} 
            />
          </Box>
        );
      default:
        return (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" gutterBottom>
              Questo tipo di file non può essere visualizzato direttamente.
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<DownloadIcon />} 
              onClick={() => handleDownload(attachment)}
              sx={{ mt: 2 }}
            >
              Scarica il file
            </Button>
          </Box>
        );
    }
  };

  const isViewable = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return ['pdf', 'jpg', 'jpeg', 'png', 'gif'].includes(extension || '');
  };

  return (
    <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FolderIcon /> {title} ({attachments?.length || 0})
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      {attachments && attachments.length > 0 ? (
        <List dense>
          {attachments.map((attachment) => (
            <ListItem key={attachment._id} divider>
              <ListItemIcon>
                {getFileIcon(attachment.nomeFile)}
              </ListItemIcon>
              <ListItemText
                primary={attachment.nomeFile}
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label={attachment.tipo} size="small" color="info" />
                    <Typography variant="caption">
                      Caricato il: {formatDate(attachment.dataCaricamento)}
                    </Typography>
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <Box sx={{ display: 'flex' }}>
                  {isViewable(attachment.nomeFile) && (
                    <Tooltip title="Visualizza">
                      <IconButton edge="end" onClick={() => handleView(attachment)}>
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Scarica">
                    <IconButton edge="end" onClick={() => handleDownload(attachment)}>
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                  {canDelete && onDelete && (
                    <Tooltip title="Elimina">
                      <IconButton edge="end" color="error" onClick={() => handleDeleteClick(attachment)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography color="textSecondary" align="center" sx={{ py: 2 }}>
          {emptyMessage}
        </Typography>
      )}

      <Dialog 
        open={viewerOpen} 
        onClose={handleCloseViewer}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {selectedFile?.nomeFile}
        </DialogTitle>
        <DialogContent dividers>
          {selectedFile && renderFilePreview(selectedFile)}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewer}>Chiudi</Button>
          <Button 
            onClick={() => selectedFile && handleDownload(selectedFile)} 
            startIcon={<DownloadIcon />}
            variant="contained"
          >
            Scarica
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onClose={handleCancelDelete}>
        <DialogTitle>Conferma eliminazione</DialogTitle>
        <DialogContent>
          <Typography>
            Sei sicuro di voler eliminare l'allegato "{selectedFile?.nomeFile}"?
          </Typography>
          <Typography variant="caption" color="error">
            Questa azione non può essere annullata.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} disabled={loading}>Annulla</Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Elimina'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default FileAttachmentViewer;