import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  Typography,
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Autocomplete
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/it';

import { manutenzioniService } from '../../services/manutenzioniService';
import { autoveicoliService } from '../../services/autoveicoliService';
import { Manutenzione, Ricambio, TIPI_MANUTENZIONE, STATI_MANUTENZIONE, PRIORITA_MANUTENZIONE } from '../../types/Manutenzione';
import { Autoveicolo } from '../../types/Autoveicolo';

interface ManutenzioneModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  manutenzione: Manutenzione | null;
}

const ManutenzioneModal: React.FC<ManutenzioneModalProps> = ({
  open,
  onClose,
  onSave,
  manutenzione
}) => {
  const [formData, setFormData] = useState<Partial<Manutenzione>>({
    tipoManutenzione: 'Ordinaria',
    stato: 'Programmata',
    priorita: 'Media',
    costi: {
      manodopera: 0,
      ricambi: 0,
      altri: 0,
      iva: 22
    },
    ricambi: []
  });
  const [autoveicoli, setAutoveicoli] = useState<Autoveicolo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (open) {
      fetchAutoveicoli();
      if (manutenzione) {
        setFormData({
          ...manutenzione,
          dataProgrammata: manutenzione.dataProgrammata,
          dataEsecuzione: manutenzione.dataEsecuzione || undefined
        });
      } else {
        setFormData({
          tipoManutenzione: 'Ordinaria',
          stato: 'Programmata',
          priorita: 'Media',
          costi: {
            manodopera: 0,
            ricambi: 0,
            altri: 0,
            iva: 22
          },
          ricambi: []
        });
      }
    }
  }, [open, manutenzione]);

  const fetchAutoveicoli = async () => {
    try {
      const response = await autoveicoliService.getAll({ limit: 1000 });
      setAutoveicoli(response.data.filter(auto => auto.stato === 'Attivo'));
    } catch (err: any) {
      console.error('Errore caricamento autoveicoli:', err);
    }
  };

  const handleChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleAddRicambio = () => {
    const nuovoRicambio: Ricambio = {
      descrizione: '',
      quantita: 1,
      prezzoUnitario: 0
    };
    
    setFormData(prev => ({
      ...prev,
      ricambi: [...(prev.ricambi || []), nuovoRicambio]
    }));
  };

  const handleUpdateRicambio = (index: number, field: keyof Ricambio, value: any) => {
    setFormData(prev => ({
      ...prev,
      ricambi: prev.ricambi?.map((ricambio, i) => 
        i === index ? { ...ricambio, [field]: value } : ricambio
      )
    }));
  };

  const handleDeleteRicambio = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ricambi: prev.ricambi?.filter((_, i) => i !== index)
    }));
  };

  const calcolaCostoTotale = () => {
    if (!formData.costi) return 0;
    const subtotale = formData.costi.manodopera + formData.costi.ricambi + formData.costi.altri;
    const iva = subtotale * (formData.costi.iva / 100);
    return subtotale + iva;
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      // Validazioni base
      if (!formData.autoveicolo || !formData.descrizione || !formData.dataProgrammata) {
        setError('Compila tutti i campi obbligatori');
        return;
      }

      if (manutenzione) {
        await manutenzioniService.update(manutenzione._id, formData);
      } else {
        await manutenzioniService.create(formData);
      }

      onSave();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore durante il salvataggio');
      console.error('Errore:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="it">
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          {manutenzione ? 'Modifica Manutenzione' : 'Nuova Manutenzione'}
        </DialogTitle>
        
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Informazioni generali */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Informazioni Generali
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Autocomplete
                options={autoveicoli}
                getOptionLabel={(option) => `${option.targa} - ${option.marca} ${option.modello}`}
                value={autoveicoli.find(auto => 
                  auto._id === (typeof formData.autoveicolo === 'object' 
                    ? (formData.autoveicolo as any)?._id 
                    : formData.autoveicolo)
                ) || null}
                onChange={(_, newValue) => handleChange('autoveicolo', newValue?._id)}
                renderInput={(params) => (
                  <TextField {...params} label="Autoveicolo *" fullWidth />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo Manutenzione *</InputLabel>
                <Select
                  value={formData.tipoManutenzione || ''}
                  onChange={(e) => handleChange('tipoManutenzione', e.target.value)}
                  label="Tipo Manutenzione *"
                >
                  {TIPI_MANUTENZIONE.map(tipo => (
                    <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrizione *"
                multiline
                rows={3}
                value={formData.descrizione || ''}
                onChange={(e) => handleChange('descrizione', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <DatePicker
                label="Data Programmata *"
                value={formData.dataProgrammata ? dayjs(formData.dataProgrammata) : null}
                onChange={(date) => handleChange('dataProgrammata', date?.toDate())}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Stato</InputLabel>
                <Select
                  value={formData.stato || ''}
                  onChange={(e) => handleChange('stato', e.target.value)}
                  label="Stato"
                >
                  {STATI_MANUTENZIONE.map(stato => (
                    <MenuItem key={stato} value={stato}>{stato}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Priorità</InputLabel>
                <Select
                  value={formData.priorita || ''}
                  onChange={(e) => handleChange('priorita', e.target.value)}
                  label="Priorità"
                >
                  {PRIORITA_MANUTENZIONE.map(priorita => (
                    <MenuItem key={priorita} value={priorita}>{priorita}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {formData.stato === 'Completata' && (
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Data Esecuzione"
                  value={formData.dataEsecuzione ? dayjs(formData.dataEsecuzione) : null}
                  onChange={(date) => handleChange('dataEsecuzione', date?.toDate())}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
            )}

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Chilometraggio Programmato"
                type="number"
                value={formData.chilometraggioProgammato || ''}
                onChange={(e) => handleChange('chilometraggioProgammato', Number(e.target.value))}
              />
            </Grid>

            {formData.stato === 'Completata' && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Chilometraggio Esecuzione"
                  type="number"
                  value={formData.chilometraggioEsecuzione || ''}
                  onChange={(e) => handleChange('chilometraggioEsecuzione', Number(e.target.value))}
                />
              </Grid>
            )}

            {/* Fornitore */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Fornitore
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome Fornitore *"
                value={formData.fornitore?.nome || ''}
                onChange={(e) => handleChange('fornitore.nome', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefono"
                value={formData.fornitore?.telefono || ''}
                onChange={(e) => handleChange('fornitore.telefono', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.fornitore?.email || ''}
                onChange={(e) => handleChange('fornitore.email', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Partita IVA"
                value={formData.fornitore?.partitaIVA || ''}
                onChange={(e) => handleChange('fornitore.partitaIVA', e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Indirizzo"
                value={formData.fornitore?.indirizzo || ''}
                onChange={(e) => handleChange('fornitore.indirizzo', e.target.value)}
              />
            </Grid>

            {/* Costi */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Costi
              </Typography>
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Manodopera (€)"
                type="number"
                value={formData.costi?.manodopera || 0}
                onChange={(e) => handleChange('costi.manodopera', Number(e.target.value))}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Ricambi (€)"
                type="number"
                value={formData.costi?.ricambi || 0}
                onChange={(e) => handleChange('costi.ricambi', Number(e.target.value))}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Altri Costi (€)"
                type="number"
                value={formData.costi?.altri || 0}
                onChange={(e) => handleChange('costi.altri', Number(e.target.value))}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="IVA (%)"
                type="number"
                value={formData.costi?.iva || 22}
                onChange={(e) => handleChange('costi.iva', Number(e.target.value))}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1">
                  <strong>Costo Totale: {new Intl.NumberFormat('it-IT', {
                    style: 'currency',
                    currency: 'EUR'
                  }).format(calcolaCostoTotale())}</strong>
                </Typography>
              </Box>
            </Grid>

            {/* Ricambi */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Ricambi Utilizzati
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={handleAddRicambio}
                  size="small"
                >
                  Aggiungi Ricambio
                </Button>
              </Box>
              
              {formData.ricambi && formData.ricambi.length > 0 && (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Codice</TableCell>
                      <TableCell>Descrizione</TableCell>
                      <TableCell>Quantità</TableCell>
                      <TableCell>Prezzo Unitario</TableCell>
                      <TableCell>Totale</TableCell>
                      <TableCell>Azioni</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.ricambi.map((ricambio, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <TextField
                            size="small"
                            value={ricambio.codice || ''}
                            onChange={(e) => handleUpdateRicambio(index, 'codice', e.target.value)}
                            placeholder="Codice"
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={ricambio.descrizione}
                            onChange={(e) => handleUpdateRicambio(index, 'descrizione', e.target.value)}
                            placeholder="Descrizione *"
                            required
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={ricambio.quantita}
                            onChange={(e) => handleUpdateRicambio(index, 'quantita', Number(e.target.value))}
                            inputProps={{ min: 1 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={ricambio.prezzoUnitario}
                            onChange={(e) => handleUpdateRicambio(index, 'prezzoUnitario', Number(e.target.value))}
                            inputProps={{ min: 0, step: 0.01 }}
                          />
                        </TableCell>
                        <TableCell>
                          €{(ricambio.quantita * ricambio.prezzoUnitario).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteRicambio(index)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Grid>

            {/* Note */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Note"
                multiline
                rows={3}
                value={formData.note || ''}
                onChange={(e) => handleChange('note', e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Annulla
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={loading}
          >
            {loading && <CircularProgress size={20} sx={{ mr: 1 }} />}
            {manutenzione ? 'Aggiorna' : 'Crea'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default ManutenzioneModal;