// src/components/autoveicoli/AutoveicoloForm.tsx - CON INTEGRAZIONE AUTISTI
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  Autocomplete,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/it';
import { autoveicoliService } from '../../services/autoveicoliService';
import { alboGestoriService } from '../../services/alboGestoriService';
import { autistiService } from '../../services/autistiService'; // ← AGGIUNTO
import { Autoveicolo, TUTTI_TIPI_CARROZZERIA } from '../../types/Autoveicolo';
import { AlboGestori } from '../../types/AlboGestori';
import { AutistaListItem } from '../../types/Autista'; // ← AGGIUNTO
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

  // ← STATI AUTISTI AGGIUNTI
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

  // ← CARICA AUTISTI
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

  // ← POPOLA AUTISTA SE IN MODIFICA
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
        // Cerca l'autista nella lista
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
    // ← RIMOSSO: autista: autoveicolo?.autista || '',
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

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues,
  });

  // ... resto del codice rimane uguale fino al campo autista ...

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);

      const formattedData = {
        marca: data.marca.trim(),
        modello: data.modello.trim(),
        cilindrata: data.cilindrata || 0,
        kw: data.kw || 0,
        targa: data.targa.trim().toUpperCase(),
        tipoCarrozzeria: data.tipoCarrozzeria,
        tipologiaAcquisto: data.tipologiaAcquisto,
        scadenzaTitoloProprietà: data.scadenzaTitoloProprietà ? data.scadenzaTitoloProprietà.toDate() : undefined,
        dataImmatricolazione: data.dataImmatricolazione.toDate(),
        ultimaRevisione: data.ultimaRevisione ? data.ultimaRevisione.toDate() : undefined,
        dataScadenzaBollo: !data.esenteBollo && data.dataScadenzaBollo ? data.dataScadenzaBollo.toDate() : undefined,
        esenteBollo: data.esenteBollo,
        compagniaAssicurazione: data.compagniaAssicurazione.trim(),
        numeroPolizzaAssicurazione: data.numeroPolizzaAssicurazione.trim(),
        dataInizioAssicurazione: data.dataInizioAssicurazione.toDate(),
        dataScadenzaAssicurazione: data.dataScadenzaAssicurazione.toDate(),
        telaio: data.telaio?.trim() || undefined,
        autistaAssegnato: autistaId || null, // ← MODIFICATO: usa autistaId invece di data.autista
        portataMax: data.portataMax || undefined,
        autCat1: data.autCat1?.trim() || undefined,
        autCat2: data.autCat2?.trim() || undefined,
        autCat3: data.autCat3?.trim() || undefined,
        passZTL: data.passZTL,
        dataScadenzaPassZTL: data.passZTL && data.dataScadenzaPassZTL ? data.dataScadenzaPassZTL.toDate() : undefined,
        autRifiuti: data.autRifiuti,
        note: data.note?.trim() || undefined,
        stato: data.stato
      };

      if (autoveicolo?._id) {
        await autoveicoliService.update(autoveicolo._id, formattedData);
      } else {
        const response = await autoveicoliService.create(formattedData);
        setSavedAutoveicoloId(response._id);
      }

      onSuccess();
    } catch (err: any) {
      console.error('Errore salvataggio:', err);
    } finally {
      setLoading(false);
    }
  };

  // ... resto del codice JSX rimane uguale fino alla sezione Targa/Telaio/Autista ...

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="it" {...datePickerConfig}>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ p: 3 }}>
        {/* ... tutto il resto del form prima della sezione Targa/Telaio/Autista ... */}

        {/* SEZIONE TARGA, TELAIO, AUTISTA, PORTATA */}
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

          {/* ← SOSTITUITO TEXTFIELD CON AUTOCOMPLETE */}
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

        {/* ... resto del form rimane uguale ... */}

        {/* BUTTONS */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
          <Button onClick={onCancel} disabled={loading}>
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