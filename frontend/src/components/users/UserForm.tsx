// src/components/users/UserForm.tsx
import React, { useState } from 'react';
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
  Grid,
  FormControlLabel,
  Switch,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import { usersService, User, CreateUserData, UpdateUserData } from '../../services/usersService';

interface UserFormProps {
  user?: User | null;
  onSuccess: () => void;
  onCancel: () => void;
  mode?: 'create' | 'edit' | 'password';
}

const UserForm: React.FC<UserFormProps> = ({ 
  user, 
  onSuccess, 
  onCancel,
  mode = 'create'
}) => {
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isEditMode = mode === 'edit' && user;
  const isPasswordMode = mode === 'password' && user;
  const isCreateMode = mode === 'create';

  const defaultValues = {
    nome: user?.nome || '',
    cognome: user?.cognome || '',
    email: user?.email || '',
    password: '',
    confirmPassword: '',
    newPassword: '',
    ruolo: user?.ruolo || 'user',
    attivo: user?.attivo ?? true,
  };

  const { control, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues,
  });

  const watchPassword = watch('password');
  const watchNewPassword = watch('newPassword');

  const onSubmit = async (data: any) => {
    try {
      setError('');
      setLoading(true);

      console.log('🚀 Form submitted:', { mode, data });

      if (isPasswordMode) {
        // Update password mode
        if (!data.newPassword || data.newPassword.length < 6) {
          setError('La password deve essere di almeno 6 caratteri');
          return;
        }

        if (data.newPassword !== data.confirmPassword) {
          setError('Le password non coincidono');
          return;
        }

        await usersService.updatePassword(user!._id, data.newPassword);
      } else if (isEditMode) {
        // Edit user mode
        const updateData: UpdateUserData = {
          nome: data.nome,
          cognome: data.cognome,
          email: data.email,
          ruolo: data.ruolo,
          attivo: data.attivo,
        };

        await usersService.update(user!._id, updateData);
      } else {
        // Create user mode
        if (!data.password || data.password.length < 6) {
          setError('La password deve essere di almeno 6 caratteri');
          return;
        }

        if (data.password !== data.confirmPassword) {
          setError('Le password non coincidono');
          return;
        }

        const createData: CreateUserData = {
          nome: data.nome,
          cognome: data.cognome,
          email: data.email,
          password: data.password,
          ruolo: data.ruolo,
        };

        await usersService.create(createData);
      }

      console.log('✅ Operation completed successfully');
      onSuccess();
    } catch (err: any) {
      console.error('❌ Error during operation:', err);
      setError(err.response?.data?.error || err.message || 'Errore durante l\'operazione');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (isPasswordMode) return `Cambia Password - ${user!.nome} ${user!.cognome}`;
    if (isEditMode) return `Modifica Utente - ${user!.nome} ${user!.cognome}`;
    return 'Nuovo Utente';
  };

  const getSubmitButtonText = () => {
    if (loading) return 'Salvando...';
    if (isPasswordMode) return 'Cambia Password';
    if (isEditMode) return 'Aggiorna Utente';
    return 'Crea Utente';
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {isPasswordMode ? <LockIcon /> : <PersonIcon />}
        {getTitle()}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
        <Grid container spacing={3}>
          {/* Nome - Hidden in password mode */}
          {!isPasswordMode && (
            <Grid item xs={12} md={6}>
              <Controller
                name="nome"
                control={control}
                rules={{ required: 'Il nome è obbligatorio' }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Nome"
                    fullWidth
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
          )}

          {/* Cognome - Hidden in password mode */}
          {!isPasswordMode && (
            <Grid item xs={12} md={6}>
              <Controller
                name="cognome"
                control={control}
                rules={{ required: 'Il cognome è obbligatorio' }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Cognome"
                    fullWidth
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
          )}

          {/* Email - Hidden in password mode */}
          {!isPasswordMode && (
            <Grid item xs={12} md={6}>
              <Controller
                name="email"
                control={control}
                rules={{ 
                  required: 'L\'email è obbligatoria',
                  pattern: {
                    value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                    message: 'Inserisci un\'email valida'
                  }
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Email"
                    type="email"
                    fullWidth
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
          )}

          {/* Ruolo - Hidden in password mode */}
          {!isPasswordMode && (
            <Grid item xs={12} md={6}>
              <Controller
                name="ruolo"
                control={control}
                rules={{ required: 'Il ruolo è obbligatorio' }}
                render={({ field, fieldState }) => (
                  <FormControl fullWidth error={!!fieldState.error}>
                    <InputLabel>Ruolo</InputLabel>
                    <Select {...field} label="Ruolo">
                      <MenuItem value="user">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon /> Utente
                        </Box>
                      </MenuItem>
                      <MenuItem value="admin">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AdminIcon /> Amministratore
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
          )}

          {/* Password fields for create mode */}
          {isCreateMode && (
            <>
              <Grid item xs={12} md={6}>
                <Controller
                  name="password"
                  control={control}
                  rules={{ 
                    required: 'La password è obbligatoria',
                    minLength: {
                      value: 6,
                      message: 'La password deve essere di almeno 6 caratteri'
                    }
                  }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      fullWidth
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="confirmPassword"
                  control={control}
                  rules={{ 
                    required: 'Conferma la password',
                    validate: value => value === watchPassword || 'Le password non coincidono'
                  }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Conferma Password"
                      type={showPassword ? 'text' : 'password'}
                      fullWidth
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>
            </>
          )}

          {/* Password fields for password change mode */}
          {isPasswordMode && (
            <>
              <Grid item xs={12} md={6}>
                <Controller
                  name="newPassword"
                  control={control}
                  rules={{ 
                    required: 'La nuova password è obbligatoria',
                    minLength: {
                      value: 6,
                      message: 'La password deve essere di almeno 6 caratteri'
                    }
                  }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Nuova Password"
                      type={showPassword ? 'text' : 'password'}
                      fullWidth
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="confirmPassword"
                  control={control}
                  rules={{ 
                    required: 'Conferma la nuova password',
                    validate: value => value === watchNewPassword || 'Le password non coincidono'
                  }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Conferma Nuova Password"
                      type={showPassword ? 'text' : 'password'}
                      fullWidth
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>
            </>
          )}

          {/* Stato Attivo - Only in edit mode */}
          {isEditMode && (
            <Grid item xs={12}>
              <Controller
                name="attivo"
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
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography>Utente Attivo</Typography>
                        {field.value ? (
                          <Typography variant="caption" color="success.main">
                            (L'utente può accedere al sistema)
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="error.main">
                            (L'utente non può accedere al sistema)
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                )}
              />
            </Grid>
          )}

          {/* Note informative */}
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="caption">
                <strong>Informazioni sui ruoli:</strong>
                <br />
                • <strong>Utente:</strong> Può visualizzare e gestire i dati del sistema
                <br />
                • <strong>Amministratore:</strong> Ha accesso completo al sistema inclusa la gestione utenti
                <br />
                {isCreateMode && '• La password deve essere di almeno 6 caratteri'}
                {isPasswordMode && '• La nuova password deve essere di almeno 6 caratteri'}
              </Typography>
            </Alert>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button onClick={onCancel} disabled={loading} variant="outlined">
            Annulla
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
            startIcon={isPasswordMode ? <LockIcon /> : <PersonIcon />}
          >
            {getSubmitButtonText()}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default UserForm;