// src/components/autoveicoli/AutoveicoloForm.tsx - VERSIONE COMPLETA CON PASS ZTL
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
import EnhancedDatePicker from '../common/EnhancedDatePicker';
import AllegatiManager from '../common/AllegatiManager';
import getDatePickerConfig from '../../config/datePickerConfig';

interface AutoveicoloFormProps {
  autoveicolo?: Autoveicolo | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const tipiCarrozzeria: Array<Autoveicolo['tipoCarrozzeria']> = [...TUTTI_TIPI_CARROZZERIA];
const tipologieAcquisto: Array<'Proprietà' | 'Leasing' | 'Noleggio'> = ['Proprietà', 'Leasing', 'Noleggio'];

const AutoveicoloForm: React.FC<AutoveicoloFormProps> = ({ autoveicolo, onSuccess, onCancel }) => {
  const [error, setError] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);
  const [alboGestoriList, setAlboGestoriList] = React.useState<AlboGestori[]>([]);
  const [savedAutoveicoloId, setSavedAutoveicoloId] = React.useState<string | null>(null);

  const datePickerConfig = getDatePickerConfig();

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
    telaio: autoveicolo?.telaio || '',
    autista: autoveicolo?.autista || '',
    portataMax: autoveicolo?.portataMax || '',
    autCat1: autoveicolo?.autCat1 || '',
    autCat2: autoveicolo?.autCat2 || '',
    autCat3: autoveicolo?.autCat3 || '',
    passZTL: autoveicolo?.passZTL || false,
    dataScadenzaPassZTL: autoveicolo?.dataScadenzaPassZTL ? dayjs(autoveicolo.dataScadenzaPassZTL) : null,
    autRifiuti: autoveicolo?.autRifiuti || [],
    note: autoveicolo?.note || '',
    stato: autoveicolo?.stato || 'Attivo',
  };

  const { control, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues,
  });

  React.useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log('⚠️ Errori di validazione form:', errors);
    }
  }, [errors]);

  const tipologiaAcquisto = watch('tipologiaAcquisto');
  const tipoCarrozzeria = watch('tipoCarrozzeria');
  const esenteBollo = watch('esenteBollo');
  const statoVeicolo = watch('stato');
  const passZTL = watch('passZTL');

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

      const formattedData: Partial<Autoveicolo> = {
        ...data,
        cilindrata: isMotorVehicle(data.tipoCarrozzeria) ? Number(data.cilindrata) || 0 : 0,
        kw: isMotorVehicle(data.tipoCarrozzeria) ? Number(data.kw) || 0 : 0,
        portataMax: data.portataMax ? Number(data.portataMax) : undefined,
        dataImmatricolazione: data.dataImmatricolazione?.toISOString(),
        ultimaRevisione: data.ultimaRevisione?.toISOString(),
        dataScadenzaBollo: data.esenteBollo ? undefined : data.dataScadenzaBollo?.toISOString(),
        dataInizioAssicurazione: data.dataInizioAssicurazione?.toISOString(),
        dataScadenzaAssicurazione: data.dataScadenzaAssicurazione?.toISOString(),
        scadenzaTitoloProprietà: data.scadenzaTitoloProprietà?.toISOString(),
        dataScadenzaPassZTL: data.passZTL && data.dataScadenzaPassZTL ? data.dataScadenzaPassZTL.toISOString() : undefined,
      };

      if (autoveicolo?._id) {
        await autoveicoliService.update(autoveicolo._id, formattedData as any);
        setSavedAutoveicoloId(autoveicolo._id);
      } else {
        const newAutoveicolo = await autoveicoliService.create(formattedData as any);
        setSavedAutoveicoloId(newAutoveicolo._id);
      }

      if (autoveicolo?._id) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('❌ Errore durante il salvataggio:', err);
      setError(err.response?.data?.error || err.message || 'Errore durante il salvataggio');
    } finally {
      setLoading(false);
    }
  };

  const revisionInfo = getRevisionInfo(tipoCarrozzeria);

  const handleUploadAllegati = async (files: FileList, tipo: string) => {
    const targetId = autoveicolo?._id || savedAutoveicoloId;
    if (!targetId) {
      throw new Error('Salva prima l\'autoveicolo per poter caricare allegati');
    }
    await autoveicoliService.uploadAllegati(targetId, files, tipo);
  };

  const handleDeleteAllegato = async (allegatoId: string) => {
    const targetId = autoveicolo?._id || savedAutoveicoloId;
    if (!targetId) return;
    await autoveicoliService.deleteAllegato(targetId, allegatoId);
  };

  const getStatoColor = (stato: string) => {
    switch (stato) {
      case 'Attivo': return 'success';
      case 'Veicolo Guasto': return 'warning';
      case 'Chiuso': return 'default';
      case 'Venduto': return 'info';
      case 'Demolito': return 'error';
      default: return 'default';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="it">
      <Paper elevation={3} sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="h6" gutterBottom>
          {autoveicolo ? 'Modifica Autoveicolo' : 'Nuovo Autoveicolo'}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
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

          {/* SEZIONE 2: STATO VEICOLO */}
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
            Stato Veicolo
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Controller
                name="stato"
                control={control}
                rules={{ required: 'Lo stato è obbligatorio' }}
                render={({ field, fieldState }) => (
                  <FormControl fullWidth error={!!fieldState.error}>
                    <InputLabel>Stato Veicolo</InputLabel>
                    <Select
                      {...field}
                      label="Stato Veicolo"
                    >
                      <MenuItem value="Attivo">Attivo</MenuItem>
                      <MenuItem value="Veicolo Guasto">Veicolo Guasto</MenuItem>
                      <MenuItem value="Chiuso">Chiuso</MenuItem>
                      <MenuItem value="Venduto">Venduto</MenuItem>
                      <MenuItem value="Demolito">Demolito</MenuItem>
                    </Select>
                    {fieldState.error && <FormHelperText>{fieldState.error.message}</FormHelperText>}
                  </FormControl>
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center' }}>
              <Chip
                label={statoVeicolo}
                color={getStatoColor(statoVeicolo) as any}
                sx={{ height: 'auto', p: 1 }}
              />
              {statoVeicolo === 'Veicolo Guasto' && (
                <Alert severity="warning" sx={{ ml: 2, flex: 1 }}>
                  <Typography variant="caption">
                    ⚠️ Gli alert per scadenze sono sospesi per veicoli guasti
                  </Typography>
                </Alert>
              )}
            </Grid>
          </Grid>

          <Divider sx={{ mb: 3 }} />

          {/* SEZIONE 3: CARATTERISTICHE TECNICHE */}
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
            Caratteristiche Tecniche
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
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

            <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center' }}>
              {revisionInfo && (
                <Chip
                  label={`${revisionInfo.tipo} - ${revisionInfo.descrizione}`}
                  color={revisionInfo.color}
                  sx={{ height: 'auto', p: 1, '& .MuiChip-label': { whiteSpace: 'normal', textAlign: 'center' } }}
                />
              )}
            </Grid>

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

          {/* SEZIONE 4: AUTORIZZAZIONI */}
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
            Autorizzazioni
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
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

            {/* PASS ZTL SECTION */}
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

            {passZTL && (
              <Grid item xs={12} md={6}>
                <Controller
                  name="dataScadenzaPassZTL"
                  control={control}
                  rules={{
                    required: passZTL ? 'La data di scadenza del Pass ZTL è obbligatoria quando il Pass ZTL è attivo' : false
                  }}
                  render={({ field, fieldState }) => (
                    <EnhancedDatePicker
                      {...field}
                      label="Scadenza Pass ZTL"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message || 'Inserisci la data di scadenza del Pass ZTL'}
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

            <Grid item xs={12}>
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
                          <ListItemText primary={`${albo.numeroIscrizioneAlbo} - Cat. ${albo.categoria} Classe ${albo.classe}`} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 3 }} />

          {/* SEZIONE 5: PROPRIETÀ E ACQUISTO */}
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
            Proprietà e Acquisto
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
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

          {/* SEZIONE 6: REVISIONI E BOLLO */}
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
            Revisioni e Bollo
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
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

          {/* SEZIONE 7: ASSICURAZIONE */}
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
            Assicurazione
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
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

          {/* SEZIONE 8: NOTE */}
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
            Note e Commenti
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
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

          <Divider sx={{ mb: 3 }} />

          {/* SEZIONE 9: ALLEGATI */}
          {(autoveicolo?._id || savedAutoveicoloId) && (
            <>
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                Allegati
              </Typography>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12}>
                  <AllegatiManager
                    allegati={autoveicolo?.allegati || []}
                    onUpload={handleUploadAllegati}
                    onDelete={handleDeleteAllegato}
                    title="Documenti Autoveicolo"
                  />
                </Grid>
              </Grid>

              <Divider sx={{ mb: 3 }} />
            </>
          )}

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
            
            {savedAutoveicoloId && !autoveicolo?._id && (
              <Button 
                variant="contained"
                color="success"
                onClick={onSuccess}
                sx={{ ml: 1 }}
              >
                Completa
              </Button>
            )}
          </Box>
          
          {savedAutoveicoloId && !autoveicolo?._id && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Autoveicolo salvato con successo! 
                Ora puoi caricare eventuali allegati o cliccare "Completa" per tornare alla lista.
              </Typography>
            </Alert>
          )}
        </Box>
      </Paper>
    </LocalizationProvider>
  );
};

export default AutoveicoloForm;