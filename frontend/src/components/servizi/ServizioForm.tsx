// src/components/servizi/ServizioForm.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Divider,
  Autocomplete,
  IconButton,
  Alert,
  Tabs,
  Tab,
  Paper,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { Servizio, TipoServizio, StatoServizio, PrioritaServizio, Materiale, Chilometraggio, Carburante, Ricorrenza, Luogo, Cliente, Costi } from '../../types/Servizio';
import { serviziService } from '../../services/serviziService';
import { autoveicoliService } from '../../services/autoveicoliService';
import { autistiService } from '../../services/autistiService';
import { Autoveicolo } from '../../types/Autoveicolo';
import { AutistaListItem } from '../../types/Autista';

// Tipo per i dati del form - usa stringhe per autoveicolo e autista (IDs)
interface ServizioFormData {
  titolo: string;
  descrizione?: string;
  autoveicolo: string;
  autista: string;
  tipoServizio: TipoServizio;
  stato: StatoServizio;
  priorita: PrioritaServizio;
  dataInizio: Date;
  dataFine: Date;
  oraInizio: string;
  oraFine: string;
  luogoPartenza?: Luogo;
  luogoArrivo?: Luogo;
  cliente?: Cliente;
  materiali?: Materiale[];
  costi?: Costi;
  chilometraggio?: Chilometraggio;
  carburante?: Carburante;
  ricorrenza?: Ricorrenza;
  note?: string;
}

interface ServizioFormProps {
  servizio: Servizio | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index} style={{ paddingTop: 16 }}>
    {value === index && <Box>{children}</Box>}
  </div>
);

const ServizioForm: React.FC<ServizioFormProps> = ({ servizio, onSuccess, onCancel }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [autoveicoli, setAutoveicoli] = useState<Autoveicolo[]>([]);
  const [autisti, setAutisti] = useState<AutistaListItem[]>([]);
  
  // Dati principali
  const [titolo, setTitolo] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [autoveicoloId, setAutoveicoloId] = useState<string>('');
  const [autistaId, setAutistaId] = useState<string>('');
  const [tipoServizio, setTipoServizio] = useState<TipoServizio>('Trasporto');
  const [stato, setStato] = useState<StatoServizio>('Programmato');
  const [priorita, setPriorita] = useState<PrioritaServizio>('Media');
  
  // Date e orari
  const [dataInizio, setDataInizio] = useState<any>(dayjs());
  const [dataFine, setDataFine] = useState<any>(dayjs());
  const [oraInizio, setOraInizio] = useState<any>(dayjs().hour(8).minute(0));
  const [oraFine, setOraFine] = useState<any>(dayjs().hour(17).minute(0));
  
  // Luoghi
  const [luogoPartenza, setLuogoPartenza] = useState({
    indirizzo: '',
    citta: '',
    provincia: '',
    cap: '',
  });
  const [luogoArrivo, setLuogoArrivo] = useState({
    indirizzo: '',
    citta: '',
    provincia: '',
    cap: '',
  });
  
  // Cliente
  const [cliente, setCliente] = useState({
    nome: '',
    telefono: '',
    email: '',
    riferimento: '',
  });
  
  // Materiali
  const [materiali, setMateriali] = useState<Materiale[]>([]);
  
  // Costi
  const [costi, setCosti] = useState({
    pedaggi: 0,
    parcheggi: 0,
    altri: 0,
  });

  // Chilometraggio
  const [chilometraggio, setChilometraggio] = useState<Chilometraggio>({
    iniziale: 0,
    finale: 0,
    totale: 0,
  });

  // Carburante
  const [carburante, setCarburante] = useState<Carburante>({
    iniziale: 0,
    finale: 0,
    rifornimento: {
      effettuato: false,
      quantita: 0,
      costo: 0,
      stazione: '',
    },
  });

  // Ricorrenza
  const [ricorrenza, setRicorrenza] = useState<Ricorrenza>({
    attiva: false,
    frequenza: 'Giornaliera',
    giornoSettimana: [],
    giornoMese: 1,
    dataFineRicorrenza: undefined,
  });
  
  // Note
  const [note, setNote] = useState('');

  // Carica autoveicoli e autisti
  useEffect(() => {
    const loadData = async () => {
      try {
        const [autoveicoliResponse, autistiResponse] = await Promise.all([
          autoveicoliService.getAll({ limit: 1000 }),
          autistiService.getListaSemplice()
        ]);
        setAutoveicoli(autoveicoliResponse.data || []);
        setAutisti(autistiResponse || []);
      } catch (error) {
        console.error('Errore caricamento dati:', error);
      }
    };
    loadData();
  }, []);

  // Popola form se in modifica
  useEffect(() => {
    if (servizio) {
      setTitolo(servizio.titolo || '');
      setDescrizione(servizio.descrizione || '');
      setAutoveicoloId(servizio.autoveicolo?._id || '');
      // autista è sempre una stringa nel backend
      setAutistaId(typeof servizio.autista === 'string' ? servizio.autista : '');
      setTipoServizio(servizio.tipoServizio);
      setStato(servizio.stato);
      setPriorita(servizio.priorita);
      
      setDataInizio(dayjs(servizio.dataInizio));
      setDataFine(dayjs(servizio.dataFine));
      setOraInizio(dayjs(`2000-01-01 ${servizio.oraInizio}`));
      setOraFine(dayjs(`2000-01-01 ${servizio.oraFine}`));
      
      if (servizio.luogoPartenza) {
        setLuogoPartenza({
          indirizzo: servizio.luogoPartenza.indirizzo || '',
          citta: servizio.luogoPartenza.citta || '',
          provincia: servizio.luogoPartenza.provincia || '',
          cap: servizio.luogoPartenza.cap || '',
        });
      }
      
      if (servizio.luogoArrivo) {
        setLuogoArrivo({
          indirizzo: servizio.luogoArrivo.indirizzo || '',
          citta: servizio.luogoArrivo.citta || '',
          provincia: servizio.luogoArrivo.provincia || '',
          cap: servizio.luogoArrivo.cap || '',
        });
      }
      
      if (servizio.cliente) {
        setCliente({
          nome: servizio.cliente.nome || '',
          telefono: servizio.cliente.telefono || '',
          email: servizio.cliente.email || '',
          riferimento: servizio.cliente.riferimento || '',
        });
      }
      
      if (servizio.materiali) {
        setMateriali(servizio.materiali);
      }
      
      if (servizio.costi) {
        setCosti({
          pedaggi: servizio.costi.pedaggi || 0,
          parcheggi: servizio.costi.parcheggi || 0,
          altri: servizio.costi.altri || 0,
        });
      }

      if (servizio.chilometraggio) {
        setChilometraggio({
          iniziale: servizio.chilometraggio.iniziale || 0,
          finale: servizio.chilometraggio.finale || 0,
          totale: servizio.chilometraggio.totale || 0,
        });
      }

      if (servizio.carburante) {
        setCarburante({
          iniziale: servizio.carburante.iniziale || 0,
          finale: servizio.carburante.finale || 0,
          rifornimento: servizio.carburante.rifornimento || {
            effettuato: false,
            quantita: 0,
            costo: 0,
            stazione: '',
          },
        });
      }

      if (servizio.ricorrenza) {
        setRicorrenza({
          attiva: servizio.ricorrenza.attiva || false,
          frequenza: servizio.ricorrenza.frequenza || 'Giornaliera',
          giornoSettimana: servizio.ricorrenza.giornoSettimana || [],
          giornoMese: servizio.ricorrenza.giornoMese || 1,
          dataFineRicorrenza: servizio.ricorrenza.dataFineRicorrenza || undefined,
        });
      }
      
      setNote(servizio.note || '');
    }
  }, [servizio]);

  const addMateriale = () => {
    setMateriali([
      ...materiali,
      { descrizione: '', quantita: 0, unitaMisura: 'kg', peso: 0, note: '' },
    ]);
  };

  const removeMateriale = (index: number) => {
    setMateriali(materiali.filter((_, i) => i !== index));
  };

  const updateMateriale = (index: number, field: keyof Materiale, value: any) => {
    const updated = materiali.map((m, i) =>
      i === index ? { ...m, [field]: value } : m
    );
    setMateriali(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data: ServizioFormData = {
        titolo,
        descrizione,
        autoveicolo: autoveicoloId,
        autista: autistaId,
        tipoServizio,
        stato,
        priorita,
        dataInizio: dataInizio.toDate(),
        dataFine: dataFine.toDate(),
        oraInizio: oraInizio.format('HH:mm'),
        oraFine: oraFine.format('HH:mm'),
        luogoPartenza,
        luogoArrivo,
        cliente,
        materiali,
        costi,
        chilometraggio,
        carburante,
        ricorrenza,
        note,
      };

      if (servizio) {
        await serviziService.update(servizio._id, data as any);
      } else {
        await serviziService.create(data as any);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Errore durante il salvataggio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {servizio ? 'Modifica Servizio' : 'Nuovo Servizio'}
          </Typography>
          <IconButton onClick={onCancel} disabled={loading}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Dati Principali" />
          <Tab label="Luoghi e Cliente" />
          <Tab label="Materiali e Costi" />
          <Tab label="Chilometraggio" />
        </Tabs>
      </Box>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* TAB 1: DATI PRINCIPALI */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Titolo Servizio"
                value={titolo}
                onChange={(e) => setTitolo(e.target.value)}
                autoFocus
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Descrizione"
                value={descrizione}
                onChange={(e) => setDescrizione(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Autoveicolo</InputLabel>
                <Select
                  value={autoveicoloId}
                  onChange={(e) => setAutoveicoloId(e.target.value)}
                  label="Autoveicolo"
                >
                  {autoveicoli.map((auto) => (
                    <MenuItem key={auto._id} value={auto._id}>
                      {auto.targa} - {auto.marca} {auto.modello}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <Autocomplete
                value={autisti.find(a => a.id === autistaId) || null}
                onChange={(_, newValue) => setAutistaId(newValue?.id || '')}
                options={autisti}
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField {...params} label="Autista" required />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Tipo Servizio</InputLabel>
                <Select
                  value={tipoServizio}
                  onChange={(e) => setTipoServizio(e.target.value as TipoServizio)}
                  label="Tipo Servizio"
                >
                  <MenuItem value="Trasporto">Trasporto</MenuItem>
                  <MenuItem value="Raccolta">Raccolta</MenuItem>
                  <MenuItem value="Consegna">Consegna</MenuItem>
                  <MenuItem value="Manutenzione">Manutenzione</MenuItem>
                  <MenuItem value="Ispezione">Ispezione</MenuItem>
                  <MenuItem value="Altro">Altro</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Stato</InputLabel>
                <Select
                  value={stato}
                  onChange={(e) => setStato(e.target.value as StatoServizio)}
                  label="Stato"
                >
                  <MenuItem value="Programmato">Programmato</MenuItem>
                  <MenuItem value="In corso">In corso</MenuItem>
                  <MenuItem value="Completato">Completato</MenuItem>
                  <MenuItem value="Annullato">Annullato</MenuItem>
                  <MenuItem value="Posticipato">Posticipato</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Priorità</InputLabel>
                <Select
                  value={priorita}
                  onChange={(e) => setPriorita(e.target.value as PrioritaServizio)}
                  label="Priorità"
                >
                  <MenuItem value="Bassa">Bassa</MenuItem>
                  <MenuItem value="Media">Media</MenuItem>
                  <MenuItem value="Alta">Alta</MenuItem>
                  <MenuItem value="Urgente">Urgente</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <DatePicker
                label="Data Inizio"
                value={dataInizio}
                onChange={(newValue) => setDataInizio(newValue)}
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <DatePicker
                label="Data Fine"
                value={dataFine}
                onChange={(newValue) => setDataFine(newValue)}
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TimePicker
                label="Ora Inizio"
                value={oraInizio}
                onChange={(newValue) => setOraInizio(newValue)}
                slotProps={{ textField: { fullWidth: true, required: true } }}
                ampm={false}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TimePicker
                label="Ora Fine"
                value={oraFine}
                onChange={(newValue) => setOraFine(newValue)}
                slotProps={{ textField: { fullWidth: true, required: true } }}
                ampm={false}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* TAB 2: LUOGHI E CLIENTE */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Luogo di Partenza
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Indirizzo"
                value={luogoPartenza.indirizzo}
                onChange={(e) => setLuogoPartenza({ ...luogoPartenza, indirizzo: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Città"
                value={luogoPartenza.citta}
                onChange={(e) => setLuogoPartenza({ ...luogoPartenza, citta: e.target.value })}
              />
            </Grid>
            <Grid item xs={6} md={1}>
              <TextField
                fullWidth
                label="Prov."
                value={luogoPartenza.provincia}
                onChange={(e) => setLuogoPartenza({ ...luogoPartenza, provincia: e.target.value })}
              />
            </Grid>
            <Grid item xs={6} md={1}>
              <TextField
                fullWidth
                label="CAP"
                value={luogoPartenza.cap}
                onChange={(e) => setLuogoPartenza({ ...luogoPartenza, cap: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} mt={2}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Luogo di Arrivo
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Indirizzo"
                value={luogoArrivo.indirizzo}
                onChange={(e) => setLuogoArrivo({ ...luogoArrivo, indirizzo: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Città"
                value={luogoArrivo.citta}
                onChange={(e) => setLuogoArrivo({ ...luogoArrivo, citta: e.target.value })}
              />
            </Grid>
            <Grid item xs={6} md={1}>
              <TextField
                fullWidth
                label="Prov."
                value={luogoArrivo.provincia}
                onChange={(e) => setLuogoArrivo({ ...luogoArrivo, provincia: e.target.value })}
              />
            </Grid>
            <Grid item xs={6} md={1}>
              <TextField
                fullWidth
                label="CAP"
                value={luogoArrivo.cap}
                onChange={(e) => setLuogoArrivo({ ...luogoArrivo, cap: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} mt={2}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Informazioni Cliente
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome Cliente"
                value={cliente.nome}
                onChange={(e) => setCliente({ ...cliente, nome: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefono"
                value={cliente.telefono}
                onChange={(e) => setCliente({ ...cliente, telefono: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="email"
                label="Email"
                value={cliente.email}
                onChange={(e) => setCliente({ ...cliente, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Riferimento"
                value={cliente.riferimento}
                onChange={(e) => setCliente({ ...cliente, riferimento: e.target.value })}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* TAB 3: MATERIALI E COSTI */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Materiali Trasportati
              </Typography>
            </Grid>

            {materiali.map((materiale, index) => (
              <Grid item xs={12} key={index}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={5}>
                      <TextField
                        fullWidth
                        label="Descrizione"
                        value={materiale.descrizione}
                        onChange={(e) => updateMateriale(index, 'descrizione', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={6} md={2}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Quantità"
                        value={materiale.quantita || 0}
                        onChange={(e) => updateMateriale(index, 'quantita', parseFloat(e.target.value) || 0)}
                      />
                    </Grid>
                    <Grid item xs={6} md={2}>
                      <TextField
                        fullWidth
                        label="Unità"
                        value={materiale.unitaMisura || 'kg'}
                        onChange={(e) => updateMateriale(index, 'unitaMisura', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={10} md={3}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Peso (kg)"
                        value={materiale.peso || 0}
                        onChange={(e) => updateMateriale(index, 'peso', parseFloat(e.target.value) || 0)}
                      />
                    </Grid>
                    <Grid item xs={2} md={1} display="flex" alignItems="center">
                      <IconButton
                        color="error"
                        onClick={() => removeMateriale(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            ))}

            <Grid item xs={12}>
              <Button
                variant="outlined"
                onClick={addMateriale}
                sx={{ mt: 1 }}
              >
                + Aggiungi Materiale
              </Button>
            </Grid>

            <Grid item xs={12} mt={2}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Costi
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Pedaggi (€)"
                value={costi.pedaggi}
                onChange={(e) => setCosti({ ...costi, pedaggi: parseFloat(e.target.value) || 0 })}
                inputProps={{ step: 0.01, min: 0 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Parcheggi (€)"
                value={costi.parcheggi}
                onChange={(e) => setCosti({ ...costi, parcheggi: parseFloat(e.target.value) || 0 })}
                inputProps={{ step: 0.01, min: 0 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Altri costi (€)"
                value={costi.altri}
                onChange={(e) => setCosti({ ...costi, altri: parseFloat(e.target.value) || 0 })}
                inputProps={{ step: 0.01, min: 0 }}
              />
            </Grid>
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'primary.light', color: 'white' }}>
                <Typography variant="h6">
                  Totale Costi: € {(costi.pedaggi + costi.parcheggi + costi.altri).toFixed(2)}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* TAB 4: CHILOMETRAGGIO E CARBURANTE */}
        <TabPanel value={activeTab} index={3}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Chilometraggio
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Chilometraggio Iniziale (km)"
                value={chilometraggio?.iniziale || 0}
                onChange={(e) => setChilometraggio({ ...chilometraggio, iniziale: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Chilometraggio Finale (km)"
                value={chilometraggio?.finale || 0}
                onChange={(e) => setChilometraggio({ ...chilometraggio, finale: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Totale (km)"
                value={(chilometraggio?.finale || 0) - (chilometraggio?.iniziale || 0)}
                disabled
              />
            </Grid>

            <Grid item xs={12} mt={2}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Carburante
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Livello Iniziale (%)"
                value={carburante?.iniziale || 0}
                onChange={(e) => setCarburante({ ...carburante, iniziale: parseFloat(e.target.value) || 0 })}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Livello Finale (%)"
                value={carburante?.finale || 0}
                onChange={(e) => setCarburante({ ...carburante, finale: parseFloat(e.target.value) || 0 })}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={carburante?.rifornimento?.effettuato || false} 
                    onChange={(e) => setCarburante({
                      ...carburante,
                      rifornimento: {
                        effettuato: e.target.checked,
                        quantita: carburante.rifornimento?.quantita,
                        costo: carburante.rifornimento?.costo,
                        stazione: carburante.rifornimento?.stazione,
                      }
                    })}
                  />
                }
                label="Rifornimento Effettuato"
              />
            </Grid>

            {carburante?.rifornimento?.effettuato && (
              <>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Quantità (L)"
                    value={carburante?.rifornimento?.quantita || 0}
                    onChange={(e) => setCarburante({
                      ...carburante,
                      rifornimento: {
                        effettuato: true,
                        quantita: parseFloat(e.target.value) || 0,
                        costo: carburante.rifornimento?.costo,
                        stazione: carburante.rifornimento?.stazione,
                      }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Costo (€)"
                    value={carburante?.rifornimento?.costo || 0}
                    onChange={(e) => setCarburante({
                      ...carburante,
                      rifornimento: {
                        effettuato: true,
                        quantita: carburante.rifornimento?.quantita,
                        costo: parseFloat(e.target.value) || 0,
                        stazione: carburante.rifornimento?.stazione,
                      }
                    })}
                    inputProps={{ step: 0.01, min: 0 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Stazione"
                    value={carburante?.rifornimento?.stazione || ''}
                    onChange={(e) => setCarburante({
                      ...carburante,
                      rifornimento: {
                        effettuato: true,
                        quantita: carburante.rifornimento?.quantita,
                        costo: carburante.rifornimento?.costo,
                        stazione: e.target.value,
                      }
                    })}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12} mt={2}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </Grid>
          </Grid>
        </TabPanel>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onCancel} disabled={loading}>
          Annulla
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          startIcon={<SaveIcon />}
        >
          {loading ? 'Salvataggio...' : 'Salva'}
        </Button>
      </DialogActions>
    </form>
  );
};

export default ServizioForm;