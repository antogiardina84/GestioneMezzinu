// frontend/src/components/autisti/ScadenzeAlert.tsx
import React, { useState, useEffect } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
  Chip,
  Button,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  Phone as PhoneIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { autistiService } from '../../services/autistiService';

interface ScadenzaPatente {
  autista: {
    id: string;
    nomeCompleto: string;
    telefono?: string;
  };
  patenti: Array<{
    tipo: string;
    dataScadenza: string;
    numero?: string;
  }>;
}

interface ScadenzaQualifica {
  autista: {
    id: string;
    nomeCompleto: string;
    telefono?: string;
  };
  qualifiche: Array<{
    tipo: string;
    dataScadenza: string;
    numero?: string;
  }>;
}

const ScadenzeAlert: React.FC = () => {
  const [scadenzePatenti, setScadenzePatenti] = useState<ScadenzaPatente[]>([]);
  const [scadenzeQualifiche, setScadenzeQualifiche] = useState<ScadenzaQualifica[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [giorniAvviso] = useState(30);

  useEffect(() => {
    loadScadenze();
  }, []);

  const loadScadenze = async () => {
    try {
      setLoading(true);
      
      const [patentiResp, qualificheResp] = await Promise.all([
        autistiService.getScadenzePatenti(giorniAvviso),
        autistiService.getScadenzeQualifiche(giorniAvviso)
      ]);
      
      setScadenzePatenti(patentiResp.data || []);
      setScadenzeQualifiche(qualificheResp.data || []);
    } catch (err) {
      console.error('Errore caricamento scadenze:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getGiorniRimanenti = (dateString: string): number => {
    const oggi = new Date();
    const scadenza = new Date(dateString);
    const diffTime = scadenza.getTime() - oggi.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getSeverityColor = (giorni: number): 'error' | 'warning' | 'info' => {
    if (giorni <= 7) return 'error';
    if (giorni <= 15) return 'warning';
    return 'info';
  };

  const totalScadenze = scadenzePatenti.length + scadenzeQualifiche.length;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (totalScadenze === 0 || dismissed) {
    return null;
  }

  return (
    <Alert
      severity="warning"
      icon={<WarningIcon />}
      action={
        <Box display="flex" gap={1}>
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
            sx={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s'
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setDismissed(true)}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      }
      sx={{ mb: 2 }}
    >
      <AlertTitle sx={{ fontWeight: 600 }}>
        ⚠️ Attenzione: {totalScadenze} Scadenz{totalScadenze === 1 ? 'a' : 'e'} nei prossimi {giorniAvviso} giorni
      </AlertTitle>
      
      <Typography variant="body2" gutterBottom>
        {scadenzePatenti.length > 0 && `${scadenzePatenti.length} patente/i`}
        {scadenzePatenti.length > 0 && scadenzeQualifiche.length > 0 && ' e '}
        {scadenzeQualifiche.length > 0 && `${scadenzeQualifiche.length} qualifica/che`}
        {' '}in scadenza
      </Typography>

      <Collapse in={expanded}>
        <Box mt={2}>
          {/* Scadenze Patenti */}
          {scadenzePatenti.length > 0 && (
            <Box mb={2}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                📋 Patenti in Scadenza
              </Typography>
              <List dense>
                {scadenzePatenti.map((scadenza, idx) => (
                  <Box key={idx}>
                    <ListItem
                      sx={{
                        bgcolor: 'background.paper',
                        borderRadius: 1,
                        mb: 1
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                            <Typography variant="body2" fontWeight={500}>
                              {scadenza.autista.nomeCompleto}
                            </Typography>
                            {scadenza.autista.telefono && (
                              <Chip
                                icon={<PhoneIcon />}
                                label={scadenza.autista.telefono}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box mt={1}>
                            {scadenza.patenti.map((patente, pidx) => {
                              const giorni = getGiorniRimanenti(patente.dataScadenza);
                              return (
                                <Box
                                  key={pidx}
                                  display="flex"
                                  alignItems="center"
                                  gap={1}
                                  mt={0.5}
                                >
                                  <Chip
                                    label={patente.tipo}
                                    size="small"
                                    color={getSeverityColor(giorni)}
                                  />
                                  <Typography variant="caption" color="text.secondary">
                                    Scadenza: {formatDate(patente.dataScadenza)}
                                  </Typography>
                                  <Chip
                                    label={`${giorni} giorni`}
                                    size="small"
                                    color={getSeverityColor(giorni)}
                                    variant="outlined"
                                  />
                                  {patente.numero && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      fontFamily="monospace"
                                    >
                                      N° {patente.numero}
                                    </Typography>
                                  )}
                                </Box>
                              );
                            })}
                          </Box>
                        }
                      />
                    </ListItem>
                  </Box>
                ))}
              </List>
            </Box>
          )}

          {/* Scadenze Qualifiche */}
          {scadenzeQualifiche.length > 0 && (
            <Box>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                🎓 Qualifiche in Scadenza
              </Typography>
              <List dense>
                {scadenzeQualifiche.map((scadenza, idx) => (
                  <Box key={idx}>
                    <ListItem
                      sx={{
                        bgcolor: 'background.paper',
                        borderRadius: 1,
                        mb: 1
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                            <Typography variant="body2" fontWeight={500}>
                              {scadenza.autista.nomeCompleto}
                            </Typography>
                            {scadenza.autista.telefono && (
                              <Chip
                                icon={<PhoneIcon />}
                                label={scadenza.autista.telefono}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box mt={1}>
                            {scadenza.qualifiche.map((qualifica, qidx) => {
                              const giorni = getGiorniRimanenti(qualifica.dataScadenza);
                              return (
                                <Box
                                  key={qidx}
                                  display="flex"
                                  alignItems="center"
                                  gap={1}
                                  mt={0.5}
                                >
                                  <Chip
                                    label={qualifica.tipo}
                                    size="small"
                                    color={getSeverityColor(giorni)}
                                  />
                                  <Typography variant="caption" color="text.secondary">
                                    Scadenza: {formatDate(qualifica.dataScadenza)}
                                  </Typography>
                                  <Chip
                                    label={`${giorni} giorni`}
                                    size="small"
                                    color={getSeverityColor(giorni)}
                                    variant="outlined"
                                  />
                                </Box>
                              );
                            })}
                          </Box>
                        }
                      />
                    </ListItem>
                  </Box>
                ))}
              </List>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Azioni */}
          <Box display="flex" gap={1} justifyContent="flex-end">
            <Button
              size="small"
              onClick={loadScadenze}
              variant="outlined"
            >
              Aggiorna
            </Button>
            <Button
              size="small"
              onClick={() => setDismissed(true)}
              variant="text"
            >
              Nascondi
            </Button>
          </Box>
        </Box>
      </Collapse>
    </Alert>
  );
};

export default ScadenzeAlert;