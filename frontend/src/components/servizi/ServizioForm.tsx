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
  Chip,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import { Servizio, TipoServizio, StatoServizio, PrioritaServizio, Materiale } from '../../types/Servizio';
import { serviziService } from '../../services/serviziService';
import { autoveicoliService } from '../../services/autoveicoliService';
import { Autoveicolo } from '../../types/Autoveicolo';

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
  
  // Dati principali
  const [titolo, setTitolo] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [autoveicoloId, setAutoveicoloId] = useState('');
  const [autista, setAutista] = useState('');
  const [tipoServizio, setTipoServizio] = useState<TipoServizio>('Trasporto');
  const [stato, setStato] = useState<StatoServizio>('Programmato');
  const [priorita, setPriorita] = useState<PrioritaServizio>('Media');
  
  // Date e orari
  const [dataInizio, setDataInizio] = useState<Dayjs | null>(dayjs());
  const [dataFine, setDataFine] = useState<Dayjs | null>(dayjs());
  const [oraInizio, setOraInizio] = useState<Dayjs | null>(dayjs().hour(8).minute(0));
  const [oraFine, setOraFine] = useState<Dayjs | null>(dayjs().hour(17).minute(0));
  
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
  
  // Note
  const [note, setNote] = useState('');

  // Carica autoveicoli
  useEffect(() => {
    const loadAutoveicoli = async () => {
      try {
        const response = await autoveicoliService.getAll({ limit: 1000 });
        setAutoveicoli(response.data || []);
      } catch (error) {
        console.error('Errore caricamento autoveicoli:', error);
      }
    };
    loadAutoveicoli();
  }, []);

  // Popola form se in modifica
  useEffect(() => {
    if (servizio) {
      setTitolo(servizio.titolo || '');
      setDescrizione(servizio.descrizione || '');
      setAutoveicoloId(servizio.autoveicolo?._id || '');
      setAutista(servizio.autista || '');
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
      
      setNote(servizio.note || '');
    }
  }, [servizio]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validazione
    if (!titolo.trim()) {
      setError('Il titolo è obbligatorio');
      return;
    }
    if (!autoveicoloId) {
      setError('Seleziona un autoveicolo');
      return;
    }
    if (!autista.trim()) {
      setError('L\'autista è obbligatorio');
      return;
    }
    if (!dataInizio || !dataFine) {
      setError('Le date sono obbligatorie');
      return;
    }
    if (!oraInizio || !oraFine) {
      setError('Gli orari sono obbligatori');
      return;
    }

    const dati: Partial<Servizio> = {
      titolo: titolo.trim(),
      descrizione: descrizione.trim(),
      autoveicolo: autoveicoloId as any,
      autista: autista.trim(),
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
      note: note.trim(),
    };

    try {
      setLoading(true);
      
      if (servizio?._id) {
        await serviziService.update(servizio._id, dati);
      } else {
        await serviziService.create(dati);
      }
      
      onSuccess();
    } catch (error: any) {
      console.error('Errore salvataggio servizio:', error);
      setError(error.response?.data?.error || 'Errore durante il salvataggio');
    } finally {
      setLoading(false);
    }
  };

  const addMateriale = () => {
    setMateriali([...materiali, {
      descrizione: '',
      quantita: 0,
      unitaMisura: 'kg',
      peso: 0,
      note: '',
    }]);
  };

  const removeMateriale = (index: number) => {
    setMateriali(materiali.filter((_, i) => i !== index));
  };

  const updateMateriale = (index: number, field: keyof Materiale, value: any) => {
    const newMateriali = [...materiali];
    newMateriali[index] = { ...newMateriali[index], [field]: value };
    setMateriali(newMateriali);
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {servizio ? 'Modifica Servizio' : 'Nuovo Servizio'}
          </Typography>
          <IconButton onClick={onCancel} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
          <Tab label="Dati Principali" />
          <Tab label="Luoghi e Cliente" />
          <Tab label="Materiali e Costi" />
        </Tabs>

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
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Descrizione"
                value={descrizione}
                onChange={(e) => setDescrizione(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Autocomplete
                options={autoveicoli}
                getOptionLabel={(option) => `${option.targa} - ${option.marca} ${option.modello}`}
                value={autoveicoli.find(a => a._id === autoveicoloId) || null}
                onChange={(_, newValue) => {
                  setAutoveicoloId(newValue?._id || '');
                  if (newValue?.autista) {
                    setAutista(newValue.autista);
                  }
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Autoveicolo *" required />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Autista"
                value={autista}
                onChange={(e) => setAutista(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Tipo Servizio</InputLabel>
                <Select
                  value={tipoServizio}
                  label="Tipo Servizio"
                  onChange={(e) => setTipoServizio(e.target.value as TipoServizio)}
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
              <FormControl fullWidth required>
                <InputLabel>Priorità</InputLabel>
                <Select
                  value={priorita}
                  label="Priorità"
                  onChange={(e) => setPriorita(e.target.value as PrioritaServizio)}
                >
                  <MenuItem value="Bassa">Bassa</MenuItem>
                  <MenuItem value="Media">Media</MenuItem>
                  <MenuItem value="Alta">Alta</MenuItem>
                  <MenuItem value="Urgente">Urgente</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Stato</InputLabel>
                <Select
                  value={stato}
                  label="Stato"
                  onChange={(e) => setStato(e.target.value as StatoServizio)}
                >
                  <MenuItem value="Programmato">Programmato</MenuItem>
                  <MenuItem value="In corso">In corso</MenuItem>
                  <MenuItem value="Completato">Completato</MenuItem>
                  <MenuItem value="Annullato">Annullato</MenuItem>
                  <MenuItem value="Posticipato">Posticipato</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <DatePicker
                label="Data Inizio *"
                value={dataInizio}
                onChange={(newValue) => setDataInizio(newValue)}
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <DatePicker
                label="Data Fine *"
                value={dataFine}
                onChange={(newValue) => setDataFine(newValue)}
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TimePicker
                label="Ora Inizio *"
                value={oraInizio}
                onChange={(newValue) => setOraInizio(newValue)}
                ampm={false}
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TimePicker
                label="Ora Fine *"
                value={oraFine}
                onChange={(newValue) => setOraFine(newValue)}
                ampm={false}
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
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
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Città"
                value={luogoPartenza.citta}
                onChange={(e) => setLuogoPartenza({ ...luogoPartenza, citta: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Provincia"
                value={luogoPartenza.provincia}
                onChange={(e) => setLuogoPartenza({ ...luogoPartenza, provincia: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
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
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Città"
                value={luogoArrivo.citta}
                onChange={(e) => setLuogoArrivo({ ...luogoArrivo, citta: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Provincia"
                value={luogoArrivo.provincia}
                onChange={(e) => setLuogoArrivo({ ...luogoArrivo, provincia: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="CAP"
                value={luogoArrivo.cap}
                onChange={(e) => setLuogoArrivo({ ...luogoArrivo, cap: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} mt={2}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Dati Cliente
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
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Materiali Trasportati
                </Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={addMateriale}
                >
                  Aggiungi Materiale
                </Button>
              </Box>
            </Grid>

            {materiali.map((materiale, index) => (
              <Grid item xs={12} key={index}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
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
                        value={materiale.quantita}
                        onChange={(e) => updateMateriale(index, 'quantita', parseFloat(e.target.value) || 0)}
                      />
                    </Grid>
                    <Grid item xs={6} md={2}>
                      <TextField
                        fullWidth
                        label="Unità"
                        value={materiale.unitaMisura}
                        onChange={(e) => updateMateriale(index, 'unitaMisura', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={10} md={3}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Peso (kg)"
                        value={materiale.peso}
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