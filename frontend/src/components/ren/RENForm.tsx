// src/components/ren/RENForm.tsx
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Typography,
  Alert,
  Grid
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/it';
import { renService } from '../../services/renService';
import { REN } from '../../types/REN';
import EnhancedDatePicker from '../common/EnhancedDatePicker';
import getDatePickerConfig from '../../config/datePickerConfig';

interface RENFormProps {
  ren?: REN | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const regioni = [
  'Abruzzo', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna',
  'Friuli-Venezia Giulia', 'Lazio', 'Liguria', 'Lombardia', 'Marche',
  'Molise', 'Piemonte', 'Puglia', 'Sardegna', 'Sicilia', 'Toscana',
  'Trentino-Alto Adige', 'Umbria', 'Valle d\'Aosta', 'Veneto'
];

const tipologieAttività = ['Conto Proprio', 'Conto Terzi'];

const RENForm: React.FC<RENFormProps> = ({ ren, onSuccess, onCancel }) => {
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [province, setProvince] = useState<string[]>([]);

    // Otteniamo la configurazione del DatePicker
  const datePickerConfig = getDatePickerConfig();

  const defaultValues = {
    numeroIscrizioneREN: ren?.numeroIscrizioneREN || '',
    dataIscrizioneREN: ren?.dataIscrizioneREN ? dayjs(ren.dataIscrizioneREN) : null,
    dataScadenzaREN: ren?.dataScadenzaREN ? dayjs(ren.dataScadenzaREN) : null,
    regione: ren?.regione || '',
    provincia: ren?.provincia || '',
    tipologiaAttività: ren?.tipologiaAttività || 'Conto Terzi',
    numeroIscrizioneContoTerzi: ren?.numeroIscrizioneContoTerzi || '',
  };

  const { control, handleSubmit, watch, setValue } = useForm({
    defaultValues,
  });

  const watchedRegione = watch('regione');
  const watchedTipologia = watch('tipologiaAttività');

  useEffect(() => {
    const fetchProvince = async () => {
      if (watchedRegione) {
        try {
          console.log(`Fetching provinces for region: ${watchedRegione}`);
          const response = await renService.getProvince(watchedRegione);
          console.log('Province response:', response);
          setProvince(response.data || []);
          
          // Reset provincia if it's a new entry
          if (!ren) {
            setValue('provincia', '');
          }
        } catch (error) {
          console.error('Errore nel caricamento province:', error);
          // Fallback con province mock in caso di errore
          const mockProvinces: Record<string, string[]> = {
            'Sicilia': ['Catania', 'Palermo', 'Messina', 'Siracusa', 'Trapani', 'Agrigento', 'Caltanissetta', 'Enna', 'Ragusa'],
            'Lombardia': ['Milano', 'Brescia', 'Bergamo', 'Como', 'Varese'],
            'Lazio': ['Roma', 'Frosinone', 'Latina', 'Rieti', 'Viterbo'],
          };
          setProvince(mockProvinces[watchedRegione] || []);
        }
      }
    };

    fetchProvince();
  }, [watchedRegione, setValue, ren]);

  const onSubmit = async (data: any) => {
    console.log('Form data submitted:', data);
    try {
      setError('');
      setLoading(true);

      // Convert dates to ISO format strings
      const formattedData: Partial<REN> = {
        ...data,
        dataIscrizioneREN: data.dataIscrizioneREN?.toISOString(),
        dataScadenzaREN: data.dataScadenzaREN?.toISOString(),
      };

      console.log('Formatted data to send:', formattedData);

      let result;
      if (ren?._id) {
        console.log(`Updating REN with ID: ${ren._id}`);
        result = await renService.update(ren._id, formattedData);
        console.log('Update result:', result);
      } else {
        console.log('Creating new REN');
        result = await renService.create(formattedData);
        console.log('Create result:', result);
      }

      console.log('API call successful');
      onSuccess();
    } catch (err: any) {
      console.error('Error submitting REN form:', err);
      if (err.response) {
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
      }
      setError(err.response?.data?.error || 'Errore durante il salvataggio');
    } finally {
      setLoading(false);
    }
  };

  const calculateScadenza = (dataIscrizione: any) => {
    if (!dataIscrizione) return null;
    return dayjs(dataIscrizione).add(1, 'year');
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="it">
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {ren ? 'Modifica Iscrizione REN' : 'Nuova Iscrizione REN'}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            {/* Numero Iscrizione REN */}
            <Grid item xs={12} md={6}>
              <Controller
                name="numeroIscrizioneREN"
                control={control}
                rules={{ required: 'Il numero di iscrizione REN è obbligatorio' }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Numero Iscrizione REN"
                    fullWidth
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>

            {/* Data Iscrizione */}
            <Grid item xs={12} md={6}>
              <Controller
                name="dataIscrizioneREN"
                control={control}
                rules={{ required: 'La data di iscrizione è obbligatoria' }}
                render={({ field: { onChange, value }, fieldState }) => (
                  <EnhancedDatePicker
                    label="Data Iscrizione REN"
                    value={value}
                    onChange={(newValue) => {
                      onChange(newValue);
                      if (newValue) {
                        const scadenza = calculateScadenza(newValue);
                        if (scadenza) {
                          setValue('dataScadenzaREN', scadenza);
                        }
                      }
                    }}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    {...datePickerConfig}
                  />
                )}
              />
            </Grid>


            {/* Data Scadenza */}
           <Grid item xs={12} md={6}>
              <Controller
                name="dataScadenzaREN"
                control={control}
                rules={{ required: 'La data di scadenza è obbligatoria' }}
                render={({ field: { onChange, value }, fieldState }) => (
                  <EnhancedDatePicker
                    label="Data Scadenza REN"
                    value={value}
                    onChange={onChange}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message || 'Automaticamente calcolata (+1 anno)'}
                    {...datePickerConfig}
                  />
                )}
              />
            </Grid>


            {/* Regione */}
            <Grid item xs={12} md={6}>
              <Controller
                name="regione"
                control={control}
                rules={{ required: 'La regione è obbligatoria' }}
                render={({ field, fieldState }) => (
                  <FormControl fullWidth error={!!fieldState.error}>
                    <InputLabel>Regione</InputLabel>
                    <Select {...field} label="Regione">
                      {regioni.map((reg) => (
                        <MenuItem key={reg} value={reg}>
                          {reg}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            {/* Provincia */}
            <Grid item xs={12} md={6}>
              <Controller
                name="provincia"
                control={control}
                rules={{ required: 'La provincia è obbligatoria' }}
                render={({ field, fieldState }) => (
                  <FormControl fullWidth error={!!fieldState.error}>
                    <InputLabel>Provincia</InputLabel>
                    <Select 
                      {...field} 
                      label="Provincia"
                      disabled={!watchedRegione || province.length === 0}
                    >
                      {province.map((prov) => (
                        <MenuItem key={prov} value={prov}>
                          {prov}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            {/* Tipologia Attività */}
            <Grid item xs={12} md={6}>
              <Controller
                name="tipologiaAttività"
                control={control}
                rules={{ required: 'La tipologia di attività è obbligatoria' }}
                render={({ field, fieldState }) => (
                  <FormControl fullWidth error={!!fieldState.error}>
                    <InputLabel>Tipologia Attività</InputLabel>
                    <Select {...field} label="Tipologia Attività">
                      {tipologieAttività.map((tip) => (
                        <MenuItem key={tip} value={tip}>
                          {tip}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            {/* Numero Iscrizione Conto Terzi (condizionale) */}
            {watchedTipologia === 'Conto Terzi' && (
              <Grid item xs={12} md={6}>
                <Controller
                  name="numeroIscrizioneContoTerzi"
                  control={control}
                  rules={{ 
                    required: watchedTipologia === 'Conto Terzi' ? 'Il numero di iscrizione conto terzi è obbligatorio' : false 
                  }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Numero Iscrizione Conto Terzi"
                      fullWidth
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
            )}

            {/* Note e informazioni aggiuntive */}
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="caption">
                  <strong>Informazioni importanti:</strong>
                  <br />
                  • Il REN deve essere rinnovato annualmente
                  <br />
                  • La procedura di rinnovo deve essere completata tramite il Portale del Trasporto
                  <br />
                  • Per il rinnovo è necessario pagare la quota annuale all'Albo degli autotrasportatori
                </Typography>
              </Alert>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button onClick={onCancel} disabled={loading}>
              Annulla
            </Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Salvando...' : 'Salva'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </LocalizationProvider>
  );
};

export default RENForm;