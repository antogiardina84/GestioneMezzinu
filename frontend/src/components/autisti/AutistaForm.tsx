// frontend/src/components/autisti/AutistaForm.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  Divider,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  FormControlLabel,
  Switch,
  Alert,
  Autocomplete,
  InputAdornment,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/it';
import { Autista, AutistaFormData, Patente, Qualifica } from '../../types/Autista';
import { autistiService } from '../../services/autistiService';
import { autoveicoliService } from '../../services/autoveicoliService';

dayjs.locale('it');

interface AutistaFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  autista?: Autista | null;
  editMode?: boolean;
}

const steps = ['Anagrafica', 'Patenti & Qualifiche', 'Contratto & Disponibilità'];

const AutistaForm: React.FC<AutistaFormProps> = ({
  open,
  onClose,
  onSuccess,
  autista,
  editMode = false,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [veicoli, setVeicoli] = useState<any[]>([]);

  // Form state
  const [formData, setFormData] = useState<AutistaFormData>({
    nome: '',
    cognome: '',
    codiceFiscale: '',
    dataNascita: '',
    luogoNascita: '',
    indirizzo: {
      via: '',
      citta: '',
      provincia: '',
      cap: '',
    },
    contatti: {
      telefono: '',
      email: '',
      telefonoEmergenza: '',
      contattoEmergenza: '',
    },
    patenti: [],
    qualifiche: [],
    contratto: {
      tipo: 'Tempo Indeterminato',
      dataAssunzione: dayjs().format('YYYY-MM-DD'),
      orarioLavoro: 'Full-time',
    },
    veicoliAbilitati: [],
    categorieVeicoli: [],
    stato: 'Attivo',
    disponibilita: {
      lunedi: true,
      martedi: true,
      mercoledi: true,
      giovedi: true,
      venerdi: true,
      sabato: false,
      domenica: false,
    },
    note: '',
    attivo: true,
  });

  // Carica dati iniziali
  useEffect(() => {
    if (open) {
      loadVeicoli();
      if (editMode && autista) {
        // Popola form con dati autista esistente
        setFormData({
          nome: autista.nome,
          cognome: autista.cognome,
          codiceFiscale: autista.codiceFiscale,
          dataNascita: autista.dataNascita,
          luogoNascita: autista.luogoNascita || '',
          indirizzo: autista.indirizzo || {
            via: '',
            citta: '',
            provincia: '',
            cap: '',
          },
          contatti: autista.contatti,
          patenti: autista.patenti || [],
          qualifiche: autista.qualifiche || [],
          contratto: autista.contratto,
          veicoliAbilitati: autista.veicoliAbilitati || [],
          categorieVeicoli: autista.categorieVeicoli || [],
          stato: autista.stato,
          disponibilita: autista.disponibilita,
          note: autista.note || '',
          attivo: autista.attivo,
        });
      }
    }
  }, [open, autista, editMode]);

  const loadVeicoli = async () => {
    try {
      const response = await autoveicoliService.getAll({ limit: 1000 });
      setVeicoli(response.data);
    } catch (err) {
      console.error('Errore caricamento veicoli:', err);
    }
  };

  const handleNext = () => {
    // Validazione step corrente
    if (activeStep === 0 && !validateAnagrafica()) return;
    if (activeStep === 1 && !validatePatenti()) return;
    
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const validateAnagrafica = (): boolean => {
    if (!formData.nome.trim()) {
      setError('Il nome è obbligatorio');
      return false;
    }
    if (!formData.cognome.trim()) {
      setError('Il cognome è obbligatorio');
      return false;
    }
    if (!formData.codiceFiscale.trim()) {
      setError('Il codice fiscale è obbligatorio');
      return false;
    }
    if (!/^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/i.test(formData.codiceFiscale)) {
      setError('Codice fiscale non valido');
      return false;
    }
    if (!formData.dataNascita) {
      setError('La data di nascita è obbligatoria');
      return false;
    }
    if (!formData.contatti.telefono.trim()) {
      setError('Il telefono è obbligatorio');
      return false;
    }
    setError(null);
    return true;
  };

  const validatePatenti = (): boolean => {
    if (formData.patenti.length === 0) {
      setError('Aggiungere almeno una patente');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      if (editMode && autista) {
        await autistiService.update(autista._id, formData);
      } else {
        await autistiService.create(formData);
      }

      onSuccess();
    } catch (err: any) {
      console.error('Errore salvataggio autista:', err);
      setError(err.response?.data?.message || 'Errore durante il salvataggio');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedInputChange = (parent: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...(prev as any)[parent],
        [field]: value,
      },
    }));
  };

  // Gestione Patenti
  const addPatente = () => {
    const nuovaPatente: Patente = {
      tipo: 'B',
      dataScadenza: dayjs().add(10, 'years').format('YYYY-MM-DD'),
      valida: true,
    };
    setFormData((prev) => ({
      ...prev,
      patenti: [...prev.patenti, nuovaPatente],
    }));
  };

  const updatePatente = (index: number, field: keyof Patente, value: any) => {
    setFormData((prev) => ({
      ...prev,
      patenti: prev.patenti.map((patente, idx) =>
        idx === index ? { ...patente, [field]: value } : patente
      ),
    }));
  };

  const removePatente = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      patenti: prev.patenti.filter((_, idx) => idx !== index),
    }));
  };

  // Gestione Qualifiche
  const addQualifica = () => {
    const nuovaQualifica: Qualifica = {
      tipo: 'CQC Merci',
      dataScadenza: dayjs().add(5, 'years').format('YYYY-MM-DD'),
    };
    setFormData((prev) => ({
      ...prev,
      qualifiche: [...(prev.qualifiche || []), nuovaQualifica],
    }));
  };

  const updateQualifica = (index: number, field: keyof Qualifica, value: any) => {
    setFormData((prev) => ({
      ...prev,
      qualifiche: (prev.qualifiche || []).map((qualifica, idx) =>
        idx === index ? { ...qualifica, [field]: value } : qualifica
      ),
    }));
  };

  const removeQualifica = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      qualifiche: (prev.qualifiche || []).filter((_, idx) => idx !== index),
    }));
  };

  // Render Steps
  const renderAnagrafica = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
        Dati Anagrafici
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            label="Nome"
            value={formData.nome}
            onChange={(e) => handleInputChange('nome', e.target.value)}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            label="Cognome"
            value={formData.cognome}
            onChange={(e) => handleInputChange('cognome', e.target.value)}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            label="Codice Fiscale"
            value={formData.codiceFiscale}
            onChange={(e) => handleInputChange('codiceFiscale', e.target.value.toUpperCase())}
            inputProps={{ maxLength: 16 }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="it">
            <DatePicker
              label="Data di Nascita *"
              value={formData.dataNascita ? dayjs(formData.dataNascita) : null}
              onChange={(date: Dayjs | null) => {
                if (date) handleInputChange('dataNascita', date.format('YYYY-MM-DD'));
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                },
              }}
            />
          </LocalizationProvider>
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Luogo di Nascita"
            value={formData.luogoNascita}
            onChange={(e) => handleInputChange('luogoNascita', e.target.value)}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 1 }}>
            <Chip label="Indirizzo" size="small" />
          </Divider>
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Via"
            value={formData.indirizzo?.via || ''}
            onChange={(e) => handleNestedInputChange('indirizzo', 'via', e.target.value)}
          />
        </Grid>
        
        <Grid item xs={12} sm={5}>
          <TextField
            fullWidth
            label="Città"
            value={formData.indirizzo?.citta || ''}
            onChange={(e) => handleNestedInputChange('indirizzo', 'citta', e.target.value)}
          />
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Provincia"
            value={formData.indirizzo?.provincia || ''}
            onChange={(e) => handleNestedInputChange('indirizzo', 'provincia', e.target.value)}
            inputProps={{ maxLength: 2 }}
          />
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            label="CAP"
            value={formData.indirizzo?.cap || ''}
            onChange={(e) => handleNestedInputChange('indirizzo', 'cap', e.target.value)}
            inputProps={{ maxLength: 5 }}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 1 }}>
            <Chip label="Contatti" size="small" />
          </Divider>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            label="Telefono"
            value={formData.contatti.telefono}
            onChange={(e) => handleNestedInputChange('contatti', 'telefono', e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">📱</InputAdornment>,
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.contatti.email || ''}
            onChange={(e) => handleNestedInputChange('contatti', 'email', e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">✉️</InputAdornment>,
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Telefono Emergenza"
            value={formData.contatti.telefonoEmergenza || ''}
            onChange={(e) => handleNestedInputChange('contatti', 'telefonoEmergenza', e.target.value)}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Contatto Emergenza (Nome)"
            value={formData.contatti.contattoEmergenza || ''}
            onChange={(e) => handleNestedInputChange('contatti', 'contattoEmergenza', e.target.value)}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderPatentiQualifiche = () => (
    <Box>
      {/* PATENTI */}
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" sx={{ color: 'primary.main' }}>
            🚗 Patenti
          </Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={addPatente}
            variant="outlined"
            size="small"
          >
            Aggiungi Patente
          </Button>
        </Box>

        {formData.patenti.length === 0 ? (
          <Alert severity="info">Nessuna patente inserita. Aggiungere almeno una patente.</Alert>
        ) : (
          formData.patenti.map((patente, index) => (
            <Box
              key={index}
              sx={{
                p: 2,
                mb: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.paper',
              }}
            >
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Tipo Patente</InputLabel>
                    <Select
                      value={patente.tipo}
                      label="Tipo Patente"
                      onChange={(e) => updatePatente(index, 'tipo', e.target.value)}
                    >
                      <MenuItem value="AM">AM</MenuItem>
                      <MenuItem value="A1">A1</MenuItem>
                      <MenuItem value="A2">A2</MenuItem>
                      <MenuItem value="A">A</MenuItem>
                      <MenuItem value="B">B</MenuItem>
                      <MenuItem value="BE">BE</MenuItem>
                      <MenuItem value="C1">C1</MenuItem>
                      <MenuItem value="C1E">C1E</MenuItem>
                      <MenuItem value="C">C</MenuItem>
                      <MenuItem value="CE">CE</MenuItem>
                      <MenuItem value="D1">D1</MenuItem>
                      <MenuItem value="D1E">D1E</MenuItem>
                      <MenuItem value="D">D</MenuItem>
                      <MenuItem value="DE">DE</MenuItem>
                      <MenuItem value="CQC">CQC</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Numero Patente"
                    value={patente.numero || ''}
                    onChange={(e) => updatePatente(index, 'numero', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} sm={3}>
                  <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="it">
                    <DatePicker
                      label="Data Scadenza *"
                      value={patente.dataScadenza ? dayjs(patente.dataScadenza) : null}
                      onChange={(date: Dayjs | null) => {
                        if (date) updatePatente(index, 'dataScadenza', date.format('YYYY-MM-DD'));
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: 'small',
                          required: true,
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Grid>

                <Grid item xs={12} sm={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={patente.valida}
                        onChange={(e) => updatePatente(index, 'valida', e.target.checked)}
                      />
                    }
                    label="Valida"
                  />
                </Grid>

                <Grid item xs={12} sm={1}>
                  <IconButton
                    onClick={() => removePatente(index)}
                    color="error"
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Ente Rilascio"
                    value={patente.enteRilascio || ''}
                    onChange={(e) => updatePatente(index, 'enteRilascio', e.target.value)}
                  />
                </Grid>
              </Grid>
            </Box>
          ))
        )}
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* QUALIFICHE */}
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" sx={{ color: 'primary.main' }}>
            🎓 Qualifiche & Certificazioni
          </Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={addQualifica}
            variant="outlined"
            size="small"
          >
            Aggiungi Qualifica
          </Button>
        </Box>

        {(!formData.qualifiche || formData.qualifiche.length === 0) ? (
          <Alert severity="info">Nessuna qualifica inserita (opzionale).</Alert>
        ) : (
          formData.qualifiche!.map((qualifica, index) => (
            <Box
              key={index}
              sx={{
                p: 2,
                mb: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.paper',
              }}
            >
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Tipo Qualifica</InputLabel>
                    <Select
                      value={qualifica.tipo}
                      label="Tipo Qualifica"
                      onChange={(e) => updateQualifica(index, 'tipo', e.target.value as any)}
                    >
                      <MenuItem value="ADR Base">ADR Base</MenuItem>
                      <MenuItem value="ADR Cisterne">ADR Cisterne</MenuItem>
                      <MenuItem value="ADR Esplosivi">ADR Esplosivi</MenuItem>
                      <MenuItem value="CQC Persone">CQC Persone</MenuItem>
                      <MenuItem value="CQC Merci">CQC Merci</MenuItem>
                      <MenuItem value="Muletto">Muletto</MenuItem>
                      <MenuItem value="Gru">Gru</MenuItem>
                      <MenuItem value="Altro">Altro</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Numero"
                    value={qualifica.numero || ''}
                    onChange={(e) => updateQualifica(index, 'numero', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="it">
                    <DatePicker
                      label="Data Scadenza"
                      value={qualifica.dataScadenza ? dayjs(qualifica.dataScadenza) : null}
                      onChange={(date: Dayjs | null) => {
                        if (date) updateQualifica(index, 'dataScadenza', date.format('YYYY-MM-DD'));
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: 'small',
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Grid>

                <Grid item xs={12} sm={1}>
                  <IconButton
                    onClick={() => removeQualifica(index)}
                    color="error"
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Note"
                    multiline
                    rows={2}
                    value={qualifica.note || ''}
                    onChange={(e) => updateQualifica(index, 'note', e.target.value)}
                  />
                </Grid>
              </Grid>
            </Box>
          ))
        )}
      </Box>
    </Box>
  );

  const renderContrattoDisponibilita = () => (
    <Box>
      {/* CONTRATTO */}
      <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
        📄 Contratto di Lavoro
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Tipo Contratto</InputLabel>
            <Select
              value={formData.contratto.tipo}
              label="Tipo Contratto"
              onChange={(e) => handleNestedInputChange('contratto', 'tipo', e.target.value)}
            >
              <MenuItem value="Tempo Indeterminato">Tempo Indeterminato</MenuItem>
              <MenuItem value="Tempo Determinato">Tempo Determinato</MenuItem>
              <MenuItem value="Apprendistato">Apprendistato</MenuItem>
              <MenuItem value="Partita IVA">Partita IVA</MenuItem>
              <MenuItem value="Collaborazione">Collaborazione</MenuItem>
              <MenuItem value="Stagionale">Stagionale</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Orario Lavoro</InputLabel>
            <Select
              value={formData.contratto.orarioLavoro || 'Full-time'}
              label="Orario Lavoro"
              onChange={(e) => handleNestedInputChange('contratto', 'orarioLavoro', e.target.value)}
            >
              <MenuItem value="Full-time">Full-time</MenuItem>
              <MenuItem value="Part-time">Part-time</MenuItem>
              <MenuItem value="Turni">Turni</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="it">
            <DatePicker
              label="Data Assunzione *"
              value={formData.contratto.dataAssunzione ? dayjs(formData.contratto.dataAssunzione) : null}
              onChange={(date: Dayjs | null) => {
                if (date) handleNestedInputChange('contratto', 'dataAssunzione', date.format('YYYY-MM-DD'));
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                },
              }}
            />
          </LocalizationProvider>
        </Grid>

        <Grid item xs={12} sm={6}>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="it">
            <DatePicker
              label="Data Fine Contratto"
              value={formData.contratto.dataFineContratto ? dayjs(formData.contratto.dataFineContratto) : null}
              onChange={(date: Dayjs | null) => {
                handleNestedInputChange('contratto', 'dataFineContratto', date ? date.format('YYYY-MM-DD') : null);
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                },
              }}
            />
          </LocalizationProvider>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Livello"
            value={formData.contratto.livello || ''}
            onChange={(e) => handleNestedInputChange('contratto', 'livello', e.target.value)}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Matricola"
            value={formData.contratto.matricola || ''}
            onChange={(e) => handleNestedInputChange('contratto', 'matricola', e.target.value)}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }}>
        <Chip label="Disponibilità & Veicoli" size="small" />
      </Divider>

      {/* DISPONIBILITÀ SETTIMANALE */}
      <Typography variant="subtitle1" gutterBottom fontWeight={500}>
        📅 Disponibilità Settimanale
      </Typography>

      <Grid container spacing={1} sx={{ mb: 3 }}>
        {Object.keys(formData.disponibilita).map((giorno) => (
          <Grid item xs={6} sm={3} md={1.7} key={giorno}>
            <FormControlLabel
              control={
                <Switch
                  checked={(formData.disponibilita as any)[giorno]}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      disponibilita: {
                        ...prev.disponibilita,
                        [giorno]: e.target.checked,
                      },
                    }))
                  }
                />
              }
              label={giorno.charAt(0).toUpperCase() + giorno.slice(1)}
            />
          </Grid>
        ))}
      </Grid>

      {/* VEICOLI ABILITATI */}
      <Typography variant="subtitle1" gutterBottom fontWeight={500}>
        🚚 Veicoli Abilitati (opzionale)
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" mb={1}>
        Lasciare vuoto per abilitare l'autista a guidare tutti i veicoli
      </Typography>

      <Autocomplete
        multiple
        options={veicoli}
        getOptionLabel={(option) => `${option.targa} - ${option.marca} ${option.modello}`}
        value={veicoli.filter((v) => formData.veicoliAbilitati?.includes(v._id))}
        onChange={(_, newValue) => {
          handleInputChange('veicoliAbilitati', newValue.map((v) => v._id));
        }}
        renderInput={(params) => (
          <TextField {...params} label="Veicoli Abilitati" placeholder="Seleziona veicoli..." />
        )}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip
              label={option.targa}
              {...getTagProps({ index })}
              size="small"
            />
          ))
        }
      />

      <Divider sx={{ my: 3 }} />

      {/* STATO E NOTE */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Stato</InputLabel>
            <Select
              value={formData.stato}
              label="Stato"
              onChange={(e) => handleInputChange('stato', e.target.value)}
            >
              <MenuItem value="Attivo">Attivo</MenuItem>
              <MenuItem value="In Ferie">In Ferie</MenuItem>
              <MenuItem value="Malattia">Malattia</MenuItem>
              <MenuItem value="Sospeso">Sospeso</MenuItem>
              <MenuItem value="Cessato">Cessato</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.attivo}
                onChange={(e) => handleInputChange('attivo', e.target.checked)}
              />
            }
            label="Autista Attivo"
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Note"
            multiline
            rows={4}
            value={formData.note}
            onChange={(e) => handleInputChange('note', e.target.value)}
            placeholder="Note aggiuntive sull'autista..."
          />
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {editMode ? '✏️ Modifica Autista' : '➕ Nuovo Autista'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Step Content */}
        {activeStep === 0 && renderAnagrafica()}
        {activeStep === 1 && renderPatentiQualifiche()}
        {activeStep === 2 && renderContrattoDisponibilita()}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Annulla
        </Button>
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={loading}>
            Indietro
          </Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button onClick={handleNext} variant="contained" disabled={loading}>
            Avanti
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            {loading ? 'Salvataggio...' : 'Salva Autista'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AutistaForm;
























