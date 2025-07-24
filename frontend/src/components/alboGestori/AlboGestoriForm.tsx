// src/components/alboGestori/AlboGestoriForm.tsx
import React from 'react';
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
import { alboGestoriService } from '../../services/alboGestoriService'; // CORRETTO: importazione riabilitata
import { AlboGestori } from '../../types/AlboGestori';
import EnhancedDatePicker from '../common/EnhancedDatePicker';
import getDatePickerConfig from '../../config/datePickerConfig';

// Disabilita temporaneamente il controllo dei tipi per questo file
// @ts-nocheck

interface AlboGestoriFormProps {
  alboGestore?: AlboGestori | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const categorie = ['1', '4', '5', '8', '9', '10'];
const classi = ['A', 'B', 'C', 'D', 'E', 'F'];

const AlboGestoriForm: React.FC<AlboGestoriFormProps> = ({ alboGestore, onSuccess, onCancel }) => {
  const [error, setError] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);

  // Otteniamo la configurazione del DatePicker
  const datePickerConfig = getDatePickerConfig();

  const defaultValues = {
    numeroIscrizioneAlbo: alboGestore?.numeroIscrizioneAlbo || '',
    categoria: alboGestore?.categoria || '4',
    classe: alboGestore?.classe || 'B',
    dataIscrizione: alboGestore?.dataIscrizione ? dayjs(alboGestore.dataIscrizione) : null,
    dataScadenzaIscrizione: alboGestore?.dataScadenzaIscrizione ? dayjs(alboGestore.dataScadenzaIscrizione) : null,
  };

  const { control, handleSubmit, setValue } = useForm({
    defaultValues,
  });

  const onSubmit = async (data: any) => {
    try {
      console.log('🔵 Form inviato con dati raw:', data);
      setError('');
      setLoading(true);

      const formattedData: Partial<AlboGestori> = {
        ...data,
        dataIscrizione: data.dataIscrizione?.toISOString(),
        dataScadenzaIscrizione: data.dataScadenzaIscrizione?.toISOString(),
      };
      
      console.log('📦 Dati formattati prima dell\'invio:', formattedData);

      let response;
      if (alboGestore?._id) {
        console.log(`⏳ Aggiornamento Albo Gestori con ID: ${alboGestore._id}`);
        response = await alboGestoriService.update(alboGestore._id, formattedData);
        console.log('✅ Aggiornamento completato:', response);
      } else {
        console.log('⏳ Creazione nuovo Albo Gestori');
        response = await alboGestoriService.create(formattedData);
        console.log('✅ Creazione completata:', response);
      }

      console.log('🎉 Operazione completata con successo');
      onSuccess();
    } catch (err: any) {
      console.error('❌ ERRORE durante il salvataggio:', err);
      if (err.response) {
        console.error('Dettagli risposta errore:', {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data
        });
      }
      setError(err.response?.data?.error || 'Errore durante il salvataggio');
    } finally {
      setLoading(false);
    }
  };

  const calculateScadenza = (dataIscrizione: any) => {
    if (!dataIscrizione) return null;
    return dayjs(dataIscrizione).add(5, 'year');
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="it">
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {alboGestore ? 'Modifica Iscrizione Albo Gestori' : 'Nuova Iscrizione Albo Gestori'}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            {/* Numero Iscrizione */}
            <Grid item xs={12} md={6}>
              <Controller
                name="numeroIscrizioneAlbo"
                control={control}
                rules={{ required: 'Il numero di iscrizione è obbligatorio' }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Numero Iscrizione Albo"
                    fullWidth
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>

            {/* Categoria */}
            <Grid item xs={12} md={3}>
              <Controller
                name="categoria"
                control={control}
                rules={{ required: 'La categoria è obbligatoria' }}
                render={({ field, fieldState }) => (
                  <FormControl fullWidth error={!!fieldState.error}>
                    <InputLabel>Categoria</InputLabel>
                    <Select {...field} label="Categoria">
                      {categorie.map((cat) => (
                        <MenuItem key={cat} value={cat}>
                          {cat}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            {/* Classe */}
            <Grid item xs={12} md={3}>
              <Controller
                name="classe"
                control={control}
                rules={{ required: 'La classe è obbligatoria' }}
                render={({ field, fieldState }) => (
                  <FormControl fullWidth error={!!fieldState.error}>
                    <InputLabel>Classe</InputLabel>
                    <Select {...field} label="Classe">
                      {classi.map((cls) => (
                        <MenuItem key={cls} value={cls}>
                          {cls}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            {/* Data Iscrizione */}
           <Grid item xs={12} md={6}>
              <Controller
                name="dataIscrizione"
                control={control}
                rules={{ required: 'La data di iscrizione è obbligatoria' }}
                render={({ field: { onChange, value }, fieldState }) => (
                  <EnhancedDatePicker
                    label="Data Iscrizione"
                    value={value}
                    onChange={(newValue) => {
                      onChange(newValue);
                      // Calcola automaticamente la data di scadenza (+5 anni)
                      if (newValue) {
                        const scadenza = calculateScadenza(newValue);
                        if (scadenza) {
                          setValue('dataScadenzaIscrizione', scadenza);
                        }
                      }
                    }}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>

            {/* Data Scadenza */}
            <Grid item xs={12} md={6}>
              <Controller
                name="dataScadenzaIscrizione"
                control={control}
                rules={{ required: 'La data di scadenza è obbligatoria' }}
                render={({ field: { onChange, value }, fieldState }) => (
                  <EnhancedDatePicker
                    label="Data Scadenza Iscrizione"
                    value={value}
                    onChange={onChange}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message || 'Automaticamente calcolata (+5 anni)'}
                    {...datePickerConfig}
                  />
                )}
              />
            </Grid>

            {/* Note e informazioni aggiuntive */}
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="caption">
                  <strong>Informazioni importanti:</strong>
                  <br />
                  • L'iscrizione ha validità quinquennale (5 anni)
                  <br />
                  • Il rinnovo deve essere richiesto 5 mesi prima della scadenza
                  <br />
                  • Per le imprese categoria 2 bis, la validità è decennale (10 anni)
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

export default AlboGestoriForm;