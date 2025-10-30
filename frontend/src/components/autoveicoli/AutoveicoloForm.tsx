// src/components/autoveicoli/AutoveicoloForm.tsx - VERSIONE COMPLETA CORRETTA

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  Autocomplete,
  FormControlLabel,
  Checkbox,
  Chip,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/it';
import { autoveicoliService } from '../../services/autoveicoliService';
import { alboGestoriService } from '../../services/alboGestoriService';
import { autistiService } from '../../services/autistiService';
import { Autoveicolo, TUTTI_TIPI_CARROZZERIA } from '../../types/Autoveicolo';
import { AlboGestori } from '../../types/AlboGestori';
import { AutistaListItem } from '../../types/Autista';
import getDatePickerConfig from '../../config/datePickerConfig';

interface AutoveicoloFormProps {
  autoveicolo?: Autoveicolo | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const tipiCarrozzeria: Array<Autoveicolo['tipoCarrozzeria']> = [...TUTTI_TIPI_CARROZZERIA];
const tipologieAcquisto: Array<'Proprietà' | 'Leasing' | 'Noleggio'> = ['Proprietà', 'Leasing', 'Noleggio'];

const AutoveicoloForm: React.FC<AutoveicoloFormProps> = ({ autoveicolo, onSuccess, onCancel }) => {
  const [loading, setLoading] = React.useState(false);
  const [alboGestoriList, setAlboGestoriList] = React.useState<AlboGestori[]>([]);
  const [savedAutoveicoloId, setSavedAutoveicoloId] = React.useState<string | null>(null);

  // Stati autisti
  const [autistiList, setAutistiList] = React.useState<AutistaListItem[]>([]);
  const [selectedAutista, setSelectedAutista] = React.useState<AutistaListItem | null>(null);
  const [autistaId, setAutistaId] = React.useState<string>('');

  const datePickerConfig = getDatePickerConfig();

  // Carica Albo Gestori
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

  // Carica Autisti
  React.useEffect(() => {
    const loadAutisti = async () => {
      try {
        const data = await autistiService.getListaSemplice();
        setAutistiList(data);
      } catch (error) {
        console.error('Errore caricamento autisti:', error);
      }
    };
    loadAutisti();
  }, []);

  // Popola autista se in modifica
  React.useEffect(() => {
    if (autoveicolo && autoveicolo.autistaAssegnato) {
      if (typeof autoveicolo.autistaAssegnato === 'object') {
        const autista = autoveicolo.autistaAssegnato;
        setAutistaId(autista._id);
        setSelectedAutista({
          id: autista._id,
          value: autista._id,
          label: `${autista.nome} ${autista.cognome}`,
          nomeCompleto: `${autista.nome} ${autista.cognome}`,
          telefono: autista.contatti?.telefono
        });
      } else {
        setAutistaId(autoveicolo.autistaAssegnato);
        const found = autistiList.find(a => a.id === autoveicolo.autistaAssegnato);
        if (found) {
          setSelectedAutista(found);
        }
      }
    }
  }, [autoveicolo, autistiList]);

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

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues,
  });

  const esenteBollo = watch('esenteBollo');
  const passZTL = watch('passZTL');
  const tipologiaAcquisto = watch('tipologiaAcquisto');

  // Reset scadenza quando cambi a Proprietà
  React.useEffect(() => {
    if (tipologiaAcquisto === 'Proprietà') {
      setValue('scadenzaTitoloProprietà', null);
    }
  }, [tipologiaAcquisto, setValue]);

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);

      // Costruisco l'oggetto formattedData
      const formattedData: any = {
        marca: data.marca.trim(),
        modello: data.modello.trim(),
        cilindrata: data.cilindrata || 0,
        kw: data.kw || 0,
        targa: data.targa.trim().toUpperCase(),
        tipoCarrozzeria: data.tipoCarrozzeria,
        tipologiaAcquisto: data.tipologiaAcquisto,
        dataImmatricolazione: data.dataImmatricolazione ? data.dataImmatricolazione.toDate() : null,
        ultimaRevisione: data.ultimaRevisione ? data.ultimaRevisione.toDate() : null,
        esenteBollo: data.esenteBollo,
        compagniaAssicurazione: data.compagniaAssicurazione.trim(),
        numeroPolizzaAssicurazione: data.numeroPolizzaAssicurazione.trim(),
        dataInizioAssicurazione: data.dataInizioAssicurazione ? data.dataInizioAssicurazione.toDate() : null,
        dataScadenzaAssicurazione: data.dataScadenzaAssicurazione ? data.dataScadenzaAssicurazione.toDate() : null,
        telaio: data.telaio?.trim() || null,
        autistaAssegnato: autistaId || null,
        portataMax: data.portataMax || null,
        autCat1: data.autCat1?.trim() || null,
        autCat2: data.autCat2?.trim() || null,
        autCat3: data.autCat3?.trim() || null,
        passZTL: data.passZTL,
        autRifiuti: data.autRifiuti || [],
        note: data.note?.trim() || null,
        stato: data.stato
      };

      // Gestione scadenzaTitoloProprietà - ESPLICITAMENTE null per Proprietà
      if (data.tipologiaAcquisto !== 'Proprietà' && data.scadenzaTitoloProprietà) {
        formattedData.scadenzaTitoloProprietà = data.scadenzaTitoloProprietà.toDate();
      } else {
        formattedData.scadenzaTitoloProprietà = null;
      }

      // Gestione dataScadenzaBollo - solo se non esente
      if (!data.esenteBollo && data.dataScadenzaBollo) {
        formattedData.dataScadenzaBollo = data.dataScadenzaBollo.toDate();
      } else {
        formattedData.dataScadenzaBollo = null;
      }

      // Gestione dataScadenzaPassZTL - solo se ha pass ZTL
      if (data.passZTL && data.dataScadenzaPassZTL) {
        formattedData.dataScadenzaPassZTL = data.dataScadenzaPassZTL.toDate();
      } else {
        formattedData.dataScadenzaPassZTL = null;
      }

      console.log('📝 DATI DA SALVARE:', formattedData);

      if (autoveicolo?._id) {
        await autoveicoliService.update(autoveicolo._id, formattedData);
      } else {
        const response = await autoveicoliService.create(formattedData);
        setSavedAutoveicoloId(response._id);
      }

      onSuccess();
    } catch (err: any) {
      console.error('Errore salvataggio:', err);
      alert(err.response?.data?.message || 'Errore durante il salvataggio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="it" {...datePickerConfig}>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ p: 3 }}>
        
        {/* TITOLO */}
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          {autoveicolo ? 'Modifica Autoveicolo' : 'Nuovo Autoveicolo'}
        </Typography>

        {/* SEZIONE DATI GENERALI */}
        <Typography variant="h6" sx={{ mb: 2, mt: 3 }}>
          Dati Generali
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
                  required
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
                  required
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Controller
              name="tipoCarrozzeria"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  {...field}
                  options={tipiCarrozzeria}
                  onChange={(_, value) => field.onChange(value)}
                  renderInput={(params) => (
                    <TextField {...params} label="Tipo Carrozzeria" required />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name="cilindrata"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Cilindrata (cc)"
                  type="number"
                  fullWidth
                  inputProps={{ min: "0" }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name="kw"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Potenza (kW)"
                  type="number"
                  fullWidth
                  inputProps={{ min: "0" }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Controller
              name="tipologiaAcquisto"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  {...field}
                  options={tipologieAcquisto}
                  onChange={(_, value) => field.onChange(value)}
                  renderInput={(params) => (
                    <TextField {...params} label="Tipologia Acquisto" required />
                  )}
                />
              )}
            />
          </Grid>

          {/* Mostra scadenza solo se NON è Proprietà */}
          {tipologiaAcquisto !== 'Proprietà' && (
            <Grid item xs={12} md={3}>
              <Controller
                name="scadenzaTitoloProprietà"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    label={`Scadenza ${tipologiaAcquisto}`}
                    format="DD/MM/YYYY"
                    slotProps={{
                      textField: { 
                        fullWidth: true,
                        helperText: `Fine contratto ${tipologiaAcquisto.toLowerCase()}`
                      }
                    }}
                  />
                )}
              />
            </Grid>
          )}
        </Grid>

        {/* SEZIONE IDENTIFICAZIONE */}
        <Typography variant="h6" sx={{ mb: 2, mt: 3 }}>
          Identificazione
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Controller
              name="targa"
              control={control}
              rules={{ required: 'La targa è obbligatoria' }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Targa"
                  required
                  fullWidth
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
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
            <Autocomplete
              options={autistiList}
              getOptionLabel={(option) => option.label}
              value={selectedAutista}
              onChange={(_, newValue) => {
                setSelectedAutista(newValue);
                setAutistaId(newValue?.id || '');
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Autista Assegnato"
                  placeholder="Seleziona autista..."
                  helperText={
                    selectedAutista?.telefono 
                      ? `📱 ${selectedAutista.telefono}` 
                      : 'Opzionale - Lascia vuoto se non assegnato'
                  }
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {option.label}
                    </Typography>
                    {option.telefono && (
                      <Typography variant="caption" color="text.secondary">
                        📱 {option.telefono}
                      </Typography>
                    )}
                  </Box>
                </li>
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

        {/* SEZIONE DATE IMPORTANTI */}
        <Typography variant="h6" sx={{ mb: 2, mt: 3 }}>
          Date Importanti
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Controller
              name="dataImmatricolazione"
              control={control}
              render={({ field }) => (
                <DatePicker
                  {...field}
                  label="Data Immatricolazione"
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: { fullWidth: true }
                  }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Controller
              name="ultimaRevisione"
              control={control}
              render={({ field }) => (
                <DatePicker
                  {...field}
                  label="Ultima Revisione"
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: { fullWidth: true }
                  }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Controller
              name="esenteBollo"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      {...field}
                      checked={field.value}
                    />
                  }
                  label="Esente Bollo"
                />
              )}
            />
          </Grid>

          {!esenteBollo && (
            <Grid item xs={12} md={4}>
              <Controller
                name="dataScadenzaBollo"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    label="Scadenza Bollo"
                    format="DD/MM/YYYY"
                    slotProps={{
                      textField: { fullWidth: true }
                    }}
                  />
                )}
              />
            </Grid>
          )}
        </Grid>

        {/* SEZIONE ASSICURAZIONE */}
        <Typography variant="h6" sx={{ mb: 2, mt: 3 }}>
          Assicurazione
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Controller
              name="compagniaAssicurazione"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Compagnia Assicurazione"
                  fullWidth
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="numeroPolizzaAssicurazione"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Numero Polizza"
                  fullWidth
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="dataInizioAssicurazione"
              control={control}
              render={({ field }) => (
                <DatePicker
                  {...field}
                  label="Data Inizio Assicurazione"
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: { fullWidth: true }
                  }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="dataScadenzaAssicurazione"
              control={control}
              render={({ field }) => (
                <DatePicker
                  {...field}
                  label="Data Scadenza Assicurazione"
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: { fullWidth: true }
                  }}
                />
              )}
            />
          </Grid>
        </Grid>

        {/* SEZIONE AUTORIZZAZIONI */}
        <Typography variant="h6" sx={{ mb: 2, mt: 3 }}>
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
                  label="Autorizzazione Cat. 1"
                  fullWidth
                  helperText="Es: numero autorizzazione"
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
                  label="Autorizzazione Cat. 2"
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
                  label="Autorizzazione Cat. 3"
                  fullWidth
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Controller
              name="autRifiuti"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  {...field}
                  multiple
                  freeSolo
                  options={alboGestoriList.map(albo => albo.numeroIscrizioneAlbo)}
                  value={field.value || []}
                  onChange={(_, value) => field.onChange(value)}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option}
                        {...getTagProps({ index })}
                        key={index}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Autorizzazioni Rifiuti"
                      placeholder="Aggiungi numero iscrizione..."
                      helperText="Seleziona dall'Albo Gestori o inserisci manualmente"
                    />
                  )}
                />
              )}
            />
          </Grid>
        </Grid>

        {/* SEZIONE PASS ZTL */}
        <Typography variant="h6" sx={{ mb: 2, mt: 3 }}>
          Pass ZTL
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Controller
              name="passZTL"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      {...field}
                      checked={field.value}
                    />
                  }
                  label="Ha Pass ZTL"
                />
              )}
            />
          </Grid>

          {passZTL && (
            <Grid item xs={12} md={6}>
              <Controller
                name="dataScadenzaPassZTL"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    label="Scadenza Pass ZTL"
                    format="DD/MM/YYYY"
                    slotProps={{
                      textField: { fullWidth: true }
                    }}
                  />
                )}
              />
            </Grid>
          )}
        </Grid>

        {/* SEZIONE NOTE E STATO */}
        <Typography variant="h6" sx={{ mb: 2, mt: 3 }}>
          Altre Informazioni
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={8}>
            <Controller
              name="note"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Note"
                  multiline
                  rows={4}
                  fullWidth
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Controller
              name="stato"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  {...field}
                  options={['Attivo', 'Inattivo', 'In Manutenzione']}
                  onChange={(_, value) => field.onChange(value)}
                  renderInput={(params) => (
                    <TextField {...params} label="Stato" required />
                  )}
                />
              )}
            />
          </Grid>
        </Grid>

        {/* BUTTONS */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
          <Button onClick={onCancel} disabled={loading} variant="outlined">
            Annulla
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Salvataggio...' : (autoveicolo ? 'Aggiorna' : 'Crea')}
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default AutoveicoloForm;