// src/components/autoveicoli/AutoveicoloForm.tsx - VERSIONE AGGIORNATA CON NUOVI CAMPI
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
  Chip,
  FormHelperText,
  Grid,
  FormControlLabel,
  Checkbox,
  OutlinedInput,
  ListItemText,
  Switch,
  Divider,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/it';
import { autoveicoliService } from '../../services/autoveicoliService';
import { alboGestoriService } from '../../services/alboGestoriService';
import { Autoveicolo, TUTTI_TIPI_CARROZZERIA, getIntervalliRevisione, isMotorVehicle } from '../../types/Autoveicolo';
import { AlboGestori } from '../../types/AlboGestori';
// Importiamo il componente migliorato e la configurazione
import EnhancedDatePicker from '../common/EnhancedDatePicker';
import getDatePickerConfig from '../../config/datePickerConfig';

// Tipo per i dati del form che corrispondono al servizio
interface AutoveicoloFormData {
  marca: string;
  modello: string;
  cilindrata?: number;
  kw?: number;
  targa: string;
  tipoCarrozzeria: Autoveicolo['tipoCarrozzeria'];
  tipologiaAcquisto: 'Proprietà' | 'Leasing' | 'Noleggio';
  scadenzaTitoloProprietà?: string;
  dataImmatricolazione?: string;
  ultimaRevisione?: string;
  dataScadenzaBollo?: string;
  esenteBollo?: boolean;
  compagniaAssicurazione?: string;
  numeroPolizzaAssicurazione?: string;
  dataInizioAssicurazione?: string;
  dataScadenzaAssicurazione?: string;
  telaio?: string;
  autista?: string;
  portataMax?: number;
  autCat1?: string;
  autCat2?: string;
  autCat3?: string;
  passZTL?: boolean;
  autRifiuti?: string[];
  note?: string;
}

interface AutoveicoloFormProps {
  autoveicolo?: Autoveicolo | null;
  onSuccess: () => void;
  onCancel: () => void;
}

// Lista completa dei tipi di carrozzeria
const tipiCarrozzeria: Array<Autoveicolo['tipoCarrozzeria']> = [...TUTTI_TIPI_CARROZZERIA];
const tipologieAcquisto: Array<'Proprietà' | 'Leasing' | 'Noleggio'> = ['Proprietà', 'Leasing', 'Noleggio'];

const AutoveicoloForm: React.FC<AutoveicoloFormProps> = ({ autoveicolo, onSuccess, onCancel }) => {
  const [error, setError] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);
  const [alboGestoriList, setAlboGestoriList] = React.useState<AlboGestori[]>([]);

  // Otteniamo la configurazione del DatePicker
  const datePickerConfig = getDatePickerConfig();

  // Carica la lista degli Albo Gestori per il campo Aut. Rifiuti
  React.useEffect(() => {
    const loadAlboGestori = async () => {
      try {
        const response = await alboGestoriService.getAll();
        setAlboGestoriList(response.data);
      } catch (error) {
        console.error('Errore nel caricamento Albo Gestori:', error);
      }
    };
    loadAlboGestori();
  }, []);

  // Valori di default del form con i nuovi campi
  const defaultValues = {
    marca: autoveicolo?.marca || '',
    modello: autoveicolo?.modello || '',
    cilindrata: autoveicolo?.cilindrata || '',
    kw: autoveicolo?.kw || '',
    targa: autoveicolo?.targa || '',
    tipoCarrozzeria: autoveicolo?.tipoCarrozzeria || 'Van',
    tipologiaAcquisto: autoveicolo?.tipologiaAcquisto || 'Proprietà',
    scadenzaTitoloProprietà: autoveicolo?.scadenzaTitoloProprietà ? dayjs(autoveicolo.scadenzaTitoloProprietà) : null,
    dataImmatricolazione: autoveicolo?.dataImmatricolazione ? dayjs(autoveicolo.dataImmatricolazione) : null,
    ultimaRevisione: autoveicolo?.ultimaRevisione ? dayjs(autoveicolo.ultimaRevisione) : null,
    dataScadenzaBollo: autoveicolo?.dataScadenzaBollo ? dayjs(autoveicolo.dataScadenzaBollo) : null,
    esenteBollo: autoveicolo?.esenteBollo || false,
    compagniaAssicurazione: autoveicolo?.compagniaAssicurazione || '',
    numeroPolizzaAssicurazione: autoveicolo?.numeroPolizzaAssicurazione || '',
    dataInizioAssicurazione: autoveicolo?.dataInizioAssicurazione ? dayjs(autoveicolo.dataInizioAssicurazione) : null,
    dataScadenzaAssicurazione: autoveicolo?.dataScadenzaAssicurazione ? dayjs(autoveicolo.dataScadenzaAssicurazione) : null,
    // NUOVI CAMPI
    telaio: autoveicolo?.telaio || '',
    autista: autoveicolo?.autista || '',
    portataMax: autoveicolo?.portataMax || '',
    autCat1: autoveicolo?.autCat1 || '',
    autCat2: autoveicolo?.autCat2 || '',
    autCat3: autoveicolo?.autCat3 || '',
    passZTL: autoveicolo?.passZTL || false,
    autRifiuti: autoveicolo?.autRifiuti || [],
    note: autoveicolo?.note || '',
  };

  const { control, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues,
  });

  // Debug per vedere gli errori di validazione
  React.useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log('⚠️ Errori di validazione form:', errors);
    }
  }, [errors]);

  const tipologiaAcquisto = watch('tipologiaAcquisto');
  const tipoCarrozzeria = watch('tipoCarrozzeria');
  const esenteBollo = watch('esenteBollo');

  // Funzione per ottenere informazioni sulla revisione
  const getRevisionInfo = (tipo: Autoveicolo['tipoCarrozzeria']) => {
    const intervalli = getIntervalliRevisione(tipo);
    
    if (intervalli.revisioniSuccessive === 1) {
      return {
        tipo: 'Annuale',
        descrizione: 'Prima revisione dopo 1 anno, poi ogni anno',
        color: 'warning' as const
      };
    } else {
      return {
        tipo: 'Quadriennale/Biennale',
        descrizione: 'Prima revisione dopo 4 anni, poi ogni 2 anni',
        color: 'info' as const
      };
    }
  };

  const onSubmit = async (data: any) => {
    console.log('🚀 onSubmit chiamata con data:', data);
    
    try {
      setError('');
      setLoading(true);
      console.log('✅ setLoading(true) eseguito');

      const formattedData: Partial<AutoveicoloFormData> = {
        ...data,
        // CORREZIONE IMPORTANTE: Gestione corretta cilindrata e kw per rimorchi
        cilindrata: isMotorVehicle(data.tipoCarrozzeria) ? Number(data.cilindrata) || 0 : 0,
        kw: isMotorVehicle(data.tipoCarrozzeria) ? Number(data.kw) || 0 : 0,
        portataMax: data.portataMax ? Number(data.portataMax) : undefined,
        dataImmatricolazione: data.dataImmatricolazione?.toISOString(),
        ultimaRevisione: data.ultimaRevisione?.toISOString(),
        // Gestione corretta del bollo: se esente, non impostare la data
        dataScadenzaBollo: data.esenteBollo ? undefined : data.dataScadenzaBollo?.toISOString(),
        dataInizioAssicurazione: data.dataInizioAssicurazione?.toISOString(),
        dataScadenzaAssicurazione: data.dataScadenzaAssicurazione?.toISOString(),
        scadenzaTitoloProprietà: data.scadenzaTitoloProprietà?.toISOString(),
      };

      console.log('📦 formattedData preparato:', formattedData);

      if (autoveicolo?._id) {
        console.log('🔄 Aggiornamento autoveicolo esistente:', autoveicolo._id);
        await autoveicoliService.update(autoveicolo._id, formattedData);
      } else {
        console.log('➕ Creazione nuovo autoveicolo');
        await autoveicoliService.create(formattedData);
      }

      console.log('✅ Operazione completata con successo');
      onSuccess();
    } catch (err: any) {
      console.error('❌ Errore durante il salvataggio:', err);
      console.error('❌ Dettagli errore:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(err.response?.data?.error || err.message || 'Errore durante il salvataggio');
    } finally {
      console.log('🏁 setLoading(false) eseguito');
      setLoading(false);
    }
  };

  const revisionInfo = getRevisionInfo(tipoCarrozzeria);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="it">
      <Paper elevation={3} sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="h6" gutterBottom>
          {autoveicolo ? 'Modifica Autoveicolo' : 'Nuovo Autoveicolo'}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
          {/* Debug info */}
          {process.env.NODE_ENV === 'development' && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="caption" component="div">
                Debug: Tipo carrozzeria = {tipoCarrozzeria}, È veicolo a motore = {isMotorVehicle(tipoCarrozzeria) ? 'Sì' : 'No'}
              </Typography>
              {Object.keys(errors).length > 0 && (
                <Typography variant="caption" component="div" color="error">
                  Errori validazione: {Object.keys(errors).join(', ')}
                </Typography>
              )}
            </Alert>
          )}

          {/* SEZIONE 1: INFORMAZIONI GENERALI */}
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
            Informazioni Generali
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Campo marca */}
            <Grid item xs={12} md={4}>
              <Controller
                name="marca"
                control={control}
                rules={{ required: 'La marca è obbligatoria' }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Marca"
                    fullWidth
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>

            {/* Campo modello */}
            <Grid item xs={12} md={4}>
              <Controller
                name="modello"
                control={control}
                rules={{ required: 'Il modello è obbligatorio' }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Modello"
                    fullWidth
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>

            {/* Campo targa */}
            <Grid item xs={12} md={4}>
              <Controller
                name="targa"
                control={control}
                rules={{ required: 'La targa è obbligatoria' }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Targa"
                    fullWidth
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    inputProps={{ style: { textTransform: 'uppercase' } }}
                  />
                )}
              />
            </Grid>

            {/* Campo telaio - NUOVO */}
            <Grid item xs={12} md={4}>
              <Controller
                name="telaio"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Telaio"
                    fullWidth
                  />
                )}
              />
            </Grid>

            {/* Campo autista - NUOVO */}
            <Grid item xs={12} md={4}>
              <Controller
                name="autista"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Autista"
                    fullWidth
                  />
                )}
              />
            </Grid>

            {/* Campo portata max - NUOVO */}
            <Grid item xs={12} md={4}>
              <Controller
                name="portataMax"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Portata Max (ton)"
                    type="number"
                    fullWidth
                    inputProps={{ step: "0.1", min: "0" }}
                  />
                )}
              />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 3 }} />

          {/* SEZIONE 2: CARATTERISTICHE TECNICHE */}
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
            Caratteristiche Tecniche
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Campo tipoCarrozzeria */}
            <Grid item xs={12} md={6}>
              <Controller
                name="tipoCarrozzeria"
                control={control}
                rules={{ required: 'Il tipo di carrozzeria è obbligatorio' }}
                render={({ field, fieldState }) => (
                  <FormControl fullWidth error={!!fieldState.error}>
                    <InputLabel>Tipo Carrozzeria</InputLabel>
                    <Select
                      {...field}
                      label="Tipo Carrozzeria"
                    >
                      {tipiCarrozzeria.map((tipo) => (
                        <MenuItem key={tipo} value={tipo}>
                          {tipo}
                        </MenuItem>
                      ))}
                    </Select>
                    {fieldState.error && <FormHelperText>{fieldState.error.message}</FormHelperText>}
                  </FormControl>
                )}
              />
            </Grid>

            {/* Chip informativo revisione */}
            <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center' }}>
              {revisionInfo && (
                <Chip
                  label={`${revisionInfo.tipo} - ${revisionInfo.descrizione}`}
                  color={revisionInfo.color}
                  sx={{ height: 'auto', p: 1, '& .MuiChip-label': { whiteSpace: 'normal', textAlign: 'center' } }}
                />
              )}
            </Grid>

            {/* Campo cilindrata - CONDIZIONALE CORRETTO */}
            <Grid item xs={12} md={6}>
              <Controller
                name="cilindrata"
                control={control}
                rules={{ 
                  required: isMotorVehicle(tipoCarrozzeria) ? 'La cilindrata è obbligatoria per i veicoli a motore' : false,
                  min: isMotorVehicle(tipoCarrozzeria) ? { value: 1, message: 'La cilindrata deve essere maggiore di 0' } : undefined
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label={isMotorVehicle(tipoCarrozzeria) ? "Cilindrata (cc)" : "Cilindrata (Non applicabile)"}
                    type="number"
                    fullWidth
                    disabled={!isMotorVehicle(tipoCarrozzeria)}
                    value={isMotorVehicle(tipoCarrozzeria) ? field.value : ''}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message || (!isMotorVehicle(tipoCarrozzeria) ? "Non necessario per rimorchi/semirimorchi" : "")}
                  />
                )}
              />
            </Grid>

            {/* Campo kw - CONDIZIONALE CORRETTO */}
            <Grid item xs={12} md={6}>
              <Controller
                name="kw"
                control={control}
                rules={{ 
                  required: isMotorVehicle(tipoCarrozzeria) ? 'I Kw sono obbligatori per i veicoli a motore' : false,
                  min: isMotorVehicle(tipoCarrozzeria) ? { value: 1, message: 'I Kw devono essere maggiori di 0' } : undefined
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label={isMotorVehicle(tipoCarrozzeria) ? "Potenza (Kw)" : "Potenza (Non applicabile)"}
                    type="number"
                    fullWidth
                    disabled={!isMotorVehicle(tipoCarrozzeria)}
                    value={isMotorVehicle(tipoCarrozzeria) ? field.value : ''}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message || (!isMotorVehicle(tipoCarrozzeria) ? "Non necessario per rimorchi/semirimorchi" : "")}
                  />
                )}
              />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 3 }} />

          {/* SEZIONE 3: AUTORIZZAZIONI - NUOVA */}
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
            Autorizzazioni
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Campo Aut Cat.1 - NUOVO */}
            <Grid item xs={12} md={4}>
              <Controller
                name="autCat1"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Aut. Cat. 1"
                    fullWidth
                  />
                )}
              />
            </Grid>

            {/* Campo Aut Cat.2 - NUOVO */}
            <Grid item xs={12} md={4}>
              <Controller
                name="autCat2"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Aut. Cat. 2"
                    fullWidth
                  />
                )}
              />
            </Grid>

            {/* Campo Aut Cat.3 - NUOVO */}
            <Grid item xs={12} md={4}>
              <Controller
                name="autCat3"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Aut. Cat. 3"
                    fullWidth
                  />
                )}
              />
            </Grid>

            {/* Campo Pass ZTL - NUOVO */}
            <Grid item xs={12} md={6}>
              <Controller
                name="passZTL"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={field.onChange}
                        color="primary"
                      />
                    }
                    label="Pass ZTL"
                  />
                )}
              />
            </Grid>

            {/* Campo Aut. Rifiuti - NUOVO */}
            <Grid item xs={12} md={6}>
              <Controller
                name="autRifiuti"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Aut. Rifiuti</InputLabel>
                    <Select
                      {...field}
                      multiple
                      input={<OutlinedInput label="Aut. Rifiuti" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(selected as string[]).map((value) => {
                            const albo = alboGestoriList.find(a => a._id === value);
                            return (
                              <Chip key={value} label={albo?.numeroIscrizioneAlbo || value} size="small" />
                            );
                          })}
                        </Box>
                      )}
                    >
                      {alboGestoriList.map((albo) => (
                        <MenuItem key={albo._id} value={albo._id}>
                          <Checkbox checked={field.value.indexOf(albo._id) > -1} />
                          <ListItemText primary={`${albo.numeroIscrizioneAlbo} - Cat.${albo.categoria} Cl.${albo.classe}`} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 3 }} />

          {/* SEZIONE 4: PROPRIETÀ E ACQUISTO */}
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
            Proprietà e Acquisto
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Campo tipologiaAcquisto */}
            <Grid item xs={12} md={6}>
              <Controller
                name="tipologiaAcquisto"
                control={control}
                rules={{ required: 'La tipologia di acquisto è obbligatoria' }}
                render={({ field, fieldState }) => (
                  <FormControl fullWidth error={!!fieldState.error}>
                    <InputLabel>Tipologia Acquisto</InputLabel>
                    <Select
                      {...field}
                      label="Tipologia Acquisto"
                    >
                      {tipologieAcquisto.map((tipo) => (
                        <MenuItem key={tipo} value={tipo}>
                          {tipo}
                        </MenuItem>
                      ))}
                    </Select>
                    {fieldState.error && <FormHelperText>{fieldState.error.message}</FormHelperText>}
                  </FormControl>
                )}
              />
            </Grid>

            {/* Data Immatricolazione */}
            <Grid item xs={12} md={6}>
              <Controller
                name="dataImmatricolazione"
                control={control}
                rules={{ required: 'La data di immatricolazione è obbligatoria' }}
                render={({ field, fieldState }) => (
                  <EnhancedDatePicker
                    {...field}
                    label="Data Immatricolazione"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        ...datePickerConfig.slotProps?.textField,
                      },
                    }}
                    {...datePickerConfig}
                  />
                )}
              />
            </Grid>

            {/* Scadenza Titolo Proprietà - condizionale */}
            {['Leasing', 'Noleggio'].includes(tipologiaAcquisto) && (
              <Grid item xs={12} md={6}>
                <Controller
                  name="scadenzaTitoloProprietà"
                  control={control}
                  rules={{ 
                    required: ['Leasing', 'Noleggio'].includes(tipologiaAcquisto) ? 'La scadenza del titolo di proprietà è obbligatoria per Leasing/Noleggio' : false
                  }}
                  render={({ field, fieldState }) => (
                    <EnhancedDatePicker
                      {...field}
                      label="Scadenza Titolo Proprietà"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          ...datePickerConfig.slotProps?.textField,
                        },
                      }}
                      {...datePickerConfig}
                    />
                  )}
                />
              </Grid>
            )}
          </Grid>

          <Divider sx={{ mb: 3 }} />

          {/* SEZIONE 5: REVISIONI E BOLLO */}
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
            Revisioni e Bollo
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Ultima Revisione */}
            <Grid item xs={12} md={6}>
              <Controller
                name="ultimaRevisione"
                control={control}
                render={({ field }) => (
                  <EnhancedDatePicker
                    {...field}
                    label="Ultima Revisione"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        ...datePickerConfig.slotProps?.textField,
                      },
                    }}
                    {...datePickerConfig}
                  />
                )}
              />
            </Grid>

            {/* Switch Esente Bollo - NUOVO */}
            <Grid item xs={12} md={6}>
              <Controller
                name="esenteBollo"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={field.onChange}
                        color="primary"
                      />
                    }
                    label="Esente Bollo"
                    sx={{ mt: 2 }}
                  />
                )}
              />
            </Grid>

            {/* Scadenza Bollo - condizionale in base all'esenzione */}
            {!esenteBollo && (
              <Grid item xs={12} md={6}>
                <Controller
                  name="dataScadenzaBollo"
                  control={control}
                  rules={{ 
                    required: !esenteBollo ? 'La data di scadenza del bollo è obbligatoria' : false
                  }}
                  render={({ field, fieldState }) => (
                    <EnhancedDatePicker
                      {...field}
                      label="Scadenza Bollo"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          ...datePickerConfig.slotProps?.textField,
                        },
                      }}
                      {...datePickerConfig}
                    />
                  )}
                />
              </Grid>
            )}
          </Grid>

          <Divider sx={{ mb: 3 }} />

          {/* SEZIONE 6: ASSICURAZIONE */}
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
            Assicurazione
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Compagnia Assicurazione */}
            <Grid item xs={12} md={6}>
              <Controller
                name="compagniaAssicurazione"
                control={control}
                rules={{ required: 'La compagnia di assicurazione è obbligatoria' }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Compagnia Assicurazione"
                    fullWidth
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>

            {/* Numero Polizza */}
            <Grid item xs={12} md={6}>
              <Controller
                name="numeroPolizzaAssicurazione"
                control={control}
                rules={{ required: 'Il numero di polizza è obbligatorio' }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Numero Polizza"
                    fullWidth
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>

            {/* Data Inizio Assicurazione */}
            <Grid item xs={12} md={6}>
              <Controller
                name="dataInizioAssicurazione"
                control={control}
                rules={{ required: 'La data di inizio assicurazione è obbligatoria' }}
                render={({ field, fieldState }) => (
                  <EnhancedDatePicker
                    {...field}
                    label="Inizio Assicurazione"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        ...datePickerConfig.slotProps?.textField,
                      },
                    }}
                    {...datePickerConfig}
                  />
                )}
              />
            </Grid>

            {/* Data Scadenza Assicurazione */}
            <Grid item xs={12} md={6}>
              <Controller
                name="dataScadenzaAssicurazione"
                control={control}
                rules={{ required: 'La data di scadenza assicurazione è obbligatoria' }}
                render={({ field, fieldState }) => (
                  <EnhancedDatePicker
                    {...field}
                    label="Scadenza Assicurazione"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        ...datePickerConfig.slotProps?.textField,
                      },
                    }}
                    {...datePickerConfig}
                  />
                )}
              />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 3 }} />

          {/* SEZIONE 7: NOTE - NUOVA */}
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
            Note e Commenti
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Campo Note - NUOVO */}
            <Grid item xs={12}>
              <Controller
                name="note"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Note"
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Inserisci eventuali note o commenti sul veicolo..."
                  />
                )}
              />
            </Grid>
          </Grid>

          {/* Pulsanti di azione */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
            <Button 
              variant="outlined" 
              onClick={onCancel}
              disabled={loading}
            >
              Annulla
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading}
            >
              {loading ? 'Salvando...' : (autoveicolo ? 'Aggiorna' : 'Salva')}
            </Button>
          </Box>
        </Box>
      </Paper>
    </LocalizationProvider>
  );
};

export default AutoveicoloForm;