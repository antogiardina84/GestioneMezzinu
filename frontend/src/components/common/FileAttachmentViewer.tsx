// src/components/common/FileAttachmentViewer.tsx
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

// Interfaccia per gli allegati
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
  baseUrl?: string;
  canDelete?: boolean;
  onDelete?: (attachmentId: string) => Promise<void>;
  emptyMessage?: string;
}

const FileAttachmentViewer: React.FC<FileAttachmentViewerProps> = ({
  attachments,
  title = "Allegati",
  baseUrl = 'http://192.168.1.253:5555',
  canDelete = false,
  onDelete,
  emptyMessage = "Nessun allegato caricato"
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

  // FUNZIONE CORRETTA per normalizzare i percorsi
  const getFileUrl = (percorsoFile: string) => {
    console.log('🔧 Percorso originale:', percorsoFile);
    
    if (!percorsoFile) {
      console.error('❌ Percorso file vuoto');
      return '';
    }
    
    // STEP 1: Normalizza i separatori di percorso (sostituisce TUTTI i \ con /)
    let normalizedPath = percorsoFile.replace(/\\/g, '/');
    console.log('🔧 Dopo sostituzione backslash:', normalizedPath);
    
    // STEP 2: Se il percorso non inizia con 'uploads/', aggiungilo
    if (!normalizedPath.startsWith('uploads/')) {
      // Cerca la parte "uploads" nel percorso e prendi tutto da lì
      const uploadsIndex = normalizedPath.indexOf('uploads');
      if (uploadsIndex > 0) {
        normalizedPath = normalizedPath.substring(uploadsIndex);
        console.log('🔧 Estratto da uploads index:', normalizedPath);
      } else if (!normalizedPath.includes('uploads')) {
        // Se non trova "uploads" affatto, assumiamo che sia un percorso relativo
        normalizedPath = `uploads/${normalizedPath}`;
        console.log('🔧 Aggiunto prefisso uploads:', normalizedPath);
      }
    }
    
    // STEP 3: DOPPIO CONTROLLO - rimuovi eventuali backslash rimasti
    normalizedPath = normalizedPath.replace(/\\/g, '/');
    
    // STEP 4: Rimuovi doppie slash (eccetto dopo http:)
    normalizedPath = normalizedPath.replace(/([^:])\/\/+/g, '$1/');
    
    const finalUrl = `${baseUrl}/${normalizedPath}`;
    console.log('✅ URL finale generato:', finalUrl);
    
    return finalUrl;
  };

  const handleView = (attachment: Attachment) => {
    const extension = attachment.nomeFile.split('.').pop()?.toLowerCase();
    const fileUrl = getFileUrl(attachment.percorsoFile);
    
    console.log('👁️ Apertura file:', {
      nome: attachment.nomeFile,
      percorsoOriginale: attachment.percorsoFile,
      urlGenerato: fileUrl,
      extension: extension
    });
    
    if (extension === 'pdf') {
      // Per i PDF, prova sempre ad aprire in una nuova finestra
      console.log('📄 Apertura PDF in nuova finestra');
      const pdfWindow = window.open(fileUrl, '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes');
      
      if (!pdfWindow) {
        console.warn('⚠️ Popup bloccato, provo metodo alternativo');
        // Se il popup è bloccato, usa il metodo di download
        handleDownload(attachment);
      } else {
        console.log('✅ PDF aperto in nuova finestra');
      }
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      // Per le immagini, prova prima il dialog, poi fallback
      try {
        setSelectedFile(attachment);
        setViewerOpen(true);
        console.log('🖼️ Immagine aperta nel dialog');
      } catch (error) {
        console.log('🔄 Errore dialog, apertura in nuova finestra');
        window.open(fileUrl, '_blank');
      }
    } else {
      // Per altri tipi di file, forza il download
      console.log('📁 File non visualizzabile, avvio download');
      handleDownload(attachment);
    }
  };
  const handleCloseViewer = () => {
    setViewerOpen(false);
    setSelectedFile(null);
  };


  const handleDownload = (attachment: Attachment) => {
    const url = getFileUrl(attachment.percorsoFile);
    console.log('💾 Download file:', {
      nome: attachment.nomeFile,
      percorsoOriginale: attachment.percorsoFile,
      urlGenerato: url
    });
    
    try {
      // Metodo 1: Usa window.open per aprire in nuova finestra
      const newWindow = window.open(url, '_blank');
      
      // Se window.open funziona
      if (newWindow) {
        console.log('✅ File aperto in nuova finestra');
        
        // Per forzare il download invece della visualizzazione, 
        // aggiungi un timeout per modificare la location
        setTimeout(() => {
          try {
            newWindow.location.href = url + '?download=1';
          } catch (e) {
            console.log('Info: Impossibile modificare location (normale per sicurezza)');
          }
        }, 1000);
      } else {
        // Fallback: Crea un link di download temporaneo
        console.log('🔄 Fallback: window.open bloccato, uso createElement');
        const link = document.createElement('a');
        link.href = url;
        link.download = attachment.nomeFile;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        
        // Aggiungi al DOM temporaneamente
        document.body.appendChild(link);
        
        // Simula il click
        link.click();
        
        // Rimuovi il link dopo un breve delay
        setTimeout(() => {
          document.body.removeChild(link);
        }, 100);
        
        console.log('✅ Download avviato tramite createElement');
      }
      
    } catch (error) {
      console.error('❌ Errore durante download:', error);
      
      // Ultimo tentativo: redirect diretto
      try {
        window.location.href = url;
        console.log('🔄 Tentativo redirect diretto');
      } catch (redirectError) {
        console.error('❌ Anche il redirect è fallito:', redirectError);
        alert(`Impossibile aprire il file. URL: ${url}\n\nCopia questo link e aprilo manualmente nel browser.`);
      }
    }
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
    const url = getFileUrl(attachment.percorsoFile);
    const extension = attachment.nomeFile.split('.').pop()?.toLowerCase();
    
    console.log('🖼️ Rendering preview:', {
      nome: attachment.nomeFile,
      percorsoOriginale: attachment.percorsoFile,
      urlGenerato: url,
      extension: extension
    });
    
    switch(extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <img 
              src={url} 
              alt={attachment.nomeFile} 
              style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }} 
              onLoad={() => console.log('✅ Immagine caricata con successo')}
              onError={(e) => {
                console.error('❌ Errore caricamento immagine:', e);
                const target = e.target as HTMLImageElement;
                // Prova un percorso alternativo semplificato
                const altPath = `${baseUrl}/uploads/${attachment.percorsoFile.split(/[/\\]/).pop()}`;
                console.log('🔄 Tentativo percorso alternativo:', altPath);
                if (target.src !== altPath) {
                  target.src = altPath;
                }
              }}
            />
          </Box>
        );
      default:
        return (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" component="div" gutterBottom>
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
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                  <Box component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label={attachment.tipo} size="small" color="info" />
                    <Typography variant="caption" component="span">
                      Caricato il: {formatDate(attachment.dataCaricamento)}
                    </Typography>
                    {/* DEBUG INFO - rimuovi in produzione */}
                    {process.env.NODE_ENV === 'development' && (
                      <Typography variant="caption" component="span" color="text.secondary">
                        Path: {attachment.percorsoFile}
                      </Typography>
                    )}
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

      {/* Dialog di visualizzazione del file */}
      <Dialog 
        open={viewerOpen} 
        onClose={handleCloseViewer}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedFile?.nomeFile}
          <IconButton
            onClick={handleCloseViewer}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <DeleteIcon />
          </IconButton>
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

      {/* Dialog di conferma eliminazione */}
      <Dialog open={deleteConfirmOpen} onClose={handleCancelDelete}>
        <DialogTitle>Conferma eliminazione</DialogTitle>
        <DialogContent>
          <Typography component="div">
            Sei sicuro di voler eliminare l'allegato "{selectedFile?.nomeFile}"?
          </Typography>
          <Typography variant="caption" color="error" component="div">
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