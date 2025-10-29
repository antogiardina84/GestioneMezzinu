// frontend/src/components/autisti/AutistaDetailModal.tsx
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Chip,
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { Autista } from '../../types/Autista';

interface AutistaDetailModalProps {
  open: boolean;
  onClose: () => void;
  autista: Autista;
  onEdit: () => void;
}

const AutistaDetailModal: React.FC<AutistaDetailModalProps> = ({
  open,
  onClose,
  autista,
  onEdit,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatoColor = (stato: string) => {
    switch (stato) {
      case 'Attivo': return 'success';
      case 'In Ferie': return 'info';
      case 'Malattia': return 'warning';
      case 'Sospeso': return 'error';
      case 'Cessato': return 'default';
      default: return 'default';
    }
  };

  const verificaScadenza = (dataScadenza: string): { scaduta: boolean; giorni: number } => {
    const oggi = new Date();
    const scadenza = new Date(dataScadenza);
    const diffTime = scadenza.getTime() - oggi.getTime();
    const giorni = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      scaduta: giorni < 0,
      giorni: Math.abs(giorni)
    };
  };

  const renderPatente = (patente: any, index: number) => {
    const scadenza = verificaScadenza(patente.dataScadenza);
    const isInScadenza = !scadenza.scaduta && scadenza.giorni <= 30;
    
    return (
      <Box
        key={index}
        sx={{
          p: 2,
          mb: 1,
          border: '1px solid',
          borderColor: scadenza.scaduta ? 'error.main' : isInScadenza ? 'warning.main' : 'divider',
          borderRadius: 1,
          bgcolor: scadenza.scaduta ? 'error.light' : isInScadenza ? 'warning.light' : 'background.paper',
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={2}>
            <Chip
              label={patente.tipo}
              color={patente.valida ? 'primary' : 'error'}
              size="small"
              sx={{ fontWeight: 600 }}
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Typography variant="caption" display="block" color="text.secondary">
              Numero
            </Typography>
            <Typography variant="body2" fontFamily="monospace">
              {patente.numero || 'N/D'}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Typography variant="caption" display="block" color="text.secondary">
              Scadenza
            </Typography>
            <Typography variant="body2">
              {formatDate(patente.dataScadenza)}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            {scadenza.scaduta ? (
              <Chip
                icon={<CancelIcon />}
                label="SCADUTA"
                color="error"
                size="small"
              />
            ) : isInScadenza ? (
              <Chip
                icon={<WarningIcon />}
                label={`${scadenza.giorni}gg`}
                color="warning"
                size="small"
              />
            ) : (
              <Chip
                icon={<CheckCircleIcon />}
                label="Valida"
                color="success"
                size="small"
              />
            )}
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5" fontWeight={600}>
              {autista.nome} {autista.cognome}
            </Typography>
            <Box display="flex" gap={1} mt={1}>
              <Chip
                label={autista.stato}
                color={getStatoColor(autista.stato)}
                size="small"
              />
              {autista.attivo ? (
                <Chip label="Attivo" color="success" size="small" variant="outlined" />
              ) : (
                <Chip label="Non Attivo" color="error" size="small" variant="outlined" />
              )}
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Dati Anagrafici */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom color="primary" fontWeight={500}>
            👤 Dati Anagrafici
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">
                Codice Fiscale
              </Typography>
              <Typography variant="body1" fontFamily="monospace" fontWeight={500}>
                {autista.codiceFiscale}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">
                Data di Nascita
              </Typography>
              <Typography variant="body1">
                {formatDate(autista.dataNascita)}
                {autista.eta && ` (${autista.eta} anni)`}
              </Typography>
            </Grid>
            
            {autista.luogoNascita && (
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Luogo di Nascita
                </Typography>
                <Typography variant="body1">{autista.luogoNascita}</Typography>
              </Grid>
            )}
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Indirizzo */}
        {autista.indirizzo && (autista.indirizzo.via || autista.indirizzo.citta) && (
          <>
            <Box mb={3}>
              <Typography variant="h6" gutterBottom color="primary" fontWeight={500}>
                <LocationIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                Indirizzo
              </Typography>
              <Typography variant="body1">
                {autista.indirizzo.via && `${autista.indirizzo.via}, `}
                {autista.indirizzo.cap && `${autista.indirizzo.cap} `}
                {autista.indirizzo.citta}
                {autista.indirizzo.provincia && ` (${autista.indirizzo.provincia})`}
              </Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
          </>
        )}

        {/* Contatti */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom color="primary" fontWeight={500}>
            📞 Contatti
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box display="flex" alignItems="center" gap={1}>
                <PhoneIcon fontSize="small" color="action" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Telefono
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {autista.contatti.telefono}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            {autista.contatti.email && (
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1}>
                  <EmailIcon fontSize="small" color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1">
                      {autista.contatti.email}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            )}
            
            {autista.contatti.telefonoEmergenza && (
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1}>
                  <WarningIcon fontSize="small" color="warning" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Telefono Emergenza
                    </Typography>
                    <Typography variant="body1">
                      {autista.contatti.telefonoEmergenza}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            )}
            
            {autista.contatti.contattoEmergenza && (
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Contatto Emergenza
                  </Typography>
                  <Typography variant="body1">
                    {autista.contatti.contattoEmergenza}
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Patenti */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom color="primary" fontWeight={500}>
            🚗 Patenti
          </Typography>
          
          {autista.patenti.length === 0 ? (
            <Alert severity="info">Nessuna patente registrata</Alert>
          ) : (
            autista.patenti.map((patente, index) => renderPatente(patente, index))
          )}
        </Box>

        {/* Qualifiche */}
        {autista.qualifiche && autista.qualifiche.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box mb={3}>
              <Typography variant="h6" gutterBottom color="primary" fontWeight={500}>
                🎓 Qualifiche
              </Typography>
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Numero</TableCell>
                      <TableCell>Scadenza</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {autista.qualifiche.map((qualifica, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Chip label={qualifica.tipo} size="small" />
                        </TableCell>
                        <TableCell>{qualifica.numero || 'N/D'}</TableCell>
                        <TableCell>
                          {qualifica.dataScadenza ? formatDate(qualifica.dataScadenza) : 'N/D'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Contratto */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom color="primary" fontWeight={500}>
            📄 Contratto
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">
                Tipo Contratto
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {autista.contratto.tipo}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">
                Orario Lavoro
              </Typography>
              <Typography variant="body1">
                {autista.contratto.orarioLavoro || 'N/D'}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">
                Data Assunzione
              </Typography>
              <Typography variant="body1">
                {formatDate(autista.contratto.dataAssunzione)}
              </Typography>
            </Grid>
            
            {autista.contratto.dataFineContratto && (
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Data Fine Contratto
                </Typography>
                <Typography variant="body1">
                  {formatDate(autista.contratto.dataFineContratto)}
                </Typography>
              </Grid>
            )}
            
            {autista.contratto.matricola && (
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Matricola
                </Typography>
                <Typography variant="body1" fontFamily="monospace">
                  {autista.contratto.matricola}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Disponibilità */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom color="primary" fontWeight={500}>
            📅 Disponibilità Settimanale
          </Typography>
          
          <Box display="flex" gap={1} flexWrap="wrap">
            {Object.entries(autista.disponibilita).map(([giorno, disponibile]) => (
              <Chip
                key={giorno}
                label={giorno.charAt(0).toUpperCase() + giorno.slice(1, 3)}
                color={disponibile ? 'success' : 'default'}
                variant={disponibile ? 'filled' : 'outlined'}
                size="small"
              />
            ))}
          </Box>
        </Box>

        {/* Note */}
        {autista.note && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box>
              <Typography variant="h6" gutterBottom color="primary" fontWeight={500}>
                📝 Note
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                {autista.note}
              </Typography>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Chiudi
        </Button>
        <Button
          onClick={onEdit}
          variant="contained"
          startIcon={<EditIcon />}
        >
          Modifica
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AutistaDetailModal;