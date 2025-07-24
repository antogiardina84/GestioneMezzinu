// src/components/users/UsersList.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Dialog,
  CircularProgress,
  Menu,
  ListItemIcon,
  ListItemText,
  Fab,
  Toolbar,
  Avatar,
  Switch,
  Tooltip,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  People as PeopleIcon,
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon,
  Lock as LockIcon,
  ToggleOff as ToggleOffIcon,
  ToggleOn as ToggleOnIcon,
  Email as EmailIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { usersService, User } from '../../services/usersService';
import UserForm from './UserForm';
import { useAuth } from '../../context/AuthContext';

const UsersList: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRuolo, setFilterRuolo] = useState('');
  const [filterAttivo, setFilterAttivo] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'password'>('create');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuUser, setMenuUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    fetchUsers();
  }, [page, searchTerm, filterRuolo, filterAttivo]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersService.getAll({
        page,
        limit: 10,
        search: searchTerm || undefined,
        ruolo: filterRuolo || undefined,
        attivo: filterAttivo === 'true' ? true : filterAttivo === 'false' ? false : undefined,
        sort: '-createdAt'
      });
      setUsers(response.data);
      setTotalUsers(response.count);
    } catch (error) {
      console.error('Errore nel caricamento utenti:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1); // Reset page when searching
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setAnchorEl(event.currentTarget);
    setMenuUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuUser(null);
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setFormMode('create');
    setShowForm(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormMode('edit');
    setShowForm(true);
    handleMenuClose();
  };

  const handleChangePassword = (user: User) => {
    setSelectedUser(user);
    setFormMode('password');
    setShowForm(true);
    handleMenuClose();
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      await usersService.delete(userToDelete._id);
      await fetchUsers();
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Errore nell\'eliminazione utente:', error);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await usersService.toggleStatus(user._id);
      await fetchUsers();
      handleMenuClose();
    } catch (error) {
      console.error('Errore nel cambio stato utente:', error);
    }
  };

  const formatDate = (date: string | Date) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: it });
  };

  const formatDateShort = (date: string | Date) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy', { locale: it });
  };

  const getRoleChip = (ruolo: string) => {
    return ruolo === 'admin' ? (
      <Chip 
        label="Admin" 
        color="primary" 
        size="small" 
        icon={<AdminIcon />} 
      />
    ) : (
      <Chip 
        label="Utente" 
        color="default" 
        size="small" 
        icon={<PersonIcon />} 
      />
    );
  };

  const getStatusChip = (attivo: boolean) => {
    return attivo ? (
      <Chip 
        label="Attivo" 
        color="success" 
        size="small" 
      />
    ) : (
      <Chip 
        label="Inattivo" 
        color="error" 
        size="small" 
      />
    );
  };

  const getUserAvatar = (user: User) => {
    const initials = `${user.nome.charAt(0)}${user.cognome.charAt(0)}`.toUpperCase();
    return (
      <Avatar 
        sx={{ 
          width: 32, 
          height: 32, 
          bgcolor: user.ruolo === 'admin' ? 'primary.main' : 'secondary.main',
          fontSize: '0.8rem'
        }}
      >
        {initials}
      </Avatar>
    );
  };

  const canManageUser = (user: User) => {
    // L'admin corrente non può gestire se stesso per certe operazioni
    return currentUser?._id !== user._id;
  };

  const filteredUsers = users; // Already filtered on backend

  if (loading && users.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PeopleIcon /> Gestione Utenti
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateUser}
            size="large"
          >
            Nuovo Utente
          </Button>
        </Box>

        {/* Filtri */}
        <Toolbar sx={{ px: 0, gap: 2 }}>
          <TextField
            placeholder="Cerca per nome, cognome o email..."
            value={searchTerm}
            onChange={handleSearch}
            sx={{ minWidth: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Ruolo</InputLabel>
            <Select
              value={filterRuolo}
              label="Ruolo"
              onChange={(e) => {
                setFilterRuolo(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">Tutti</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="user">Utenti</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Stato</InputLabel>
            <Select
              value={filterAttivo}
              label="Stato"
              onChange={(e) => {
                setFilterAttivo(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">Tutti</MenuItem>
              <MenuItem value="true">Attivi</MenuItem>
              <MenuItem value="false">Inattivi</MenuItem>
            </Select>
          </FormControl>
        </Toolbar>

        {/* Info totale utenti */}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Totale utenti: {totalUsers}
        </Typography>
      </Paper>

      {/* Tabella Utenti */}
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.light' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Utente</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Email</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Ruolo</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Stato</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Ultimo Accesso</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Creato</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user._id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {getUserAvatar(user)}
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        {user.nome} {user.cognome}
                      </Typography>
                      {currentUser?._id === user._id && (
                        <Chip label="Tu" size="small" color="info" />
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon fontSize="small" color="action" />
                    {user.email}
                  </Box>
                </TableCell>
                <TableCell>{getRoleChip(user.ruolo)}</TableCell>
                <TableCell>{getStatusChip(user.attivo)}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTimeIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {user.ultimoAccesso ? formatDate(user.ultimoAccesso) : 'Mai'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatDateShort(user.createdAt)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, user)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">
                    {loading ? 'Caricamento...' : 'Nessun utente trovato'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalUsers > 10 && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 1 }}>
          <Button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Precedente
          </Button>
          <Typography sx={{ px: 2, py: 1 }}>
            Pagina {page} di {Math.ceil(totalUsers / 10)}
          </Typography>
          <Button
            disabled={page >= Math.ceil(totalUsers / 10)}
            onClick={() => setPage(page + 1)}
          >
            Successiva
          </Button>
        </Box>
      )}

      {/* Menu Contestuale */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {menuUser && (
          <>
            <MenuItem onClick={() => handleEditUser(menuUser)}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Modifica Dati</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleChangePassword(menuUser)}>
              <ListItemIcon>
                <LockIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Cambia Password</ListItemText>
            </MenuItem>
            {canManageUser(menuUser) && (
              <>
                <MenuItem onClick={() => handleToggleStatus(menuUser)}>
                  <ListItemIcon>
                    {menuUser.attivo ? 
                      <ToggleOffIcon fontSize="small" /> : 
                      <ToggleOnIcon fontSize="small" />
                    }
                  </ListItemIcon>
                  <ListItemText>
                    {menuUser.attivo ? 'Disattiva' : 'Attiva'}
                  </ListItemText>
                </MenuItem>
                <MenuItem 
                  onClick={() => handleDeleteClick(menuUser)} 
                  sx={{ color: 'error.main' }}
                >
                  <ListItemIcon>
                    <DeleteIcon fontSize="small" color="error" />
                  </ListItemIcon>
                  <ListItemText>Elimina</ListItemText>
                </MenuItem>
              </>
            )}
          </>
        )}
      </Menu>

      {/* Dialog Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Conferma Eliminazione</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {userToDelete && (
              <>
                Sei sicuro di voler eliminare l'utente <strong>{userToDelete.nome} {userToDelete.cognome}</strong>?
              </>
            )}
          </DialogContentText>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Questa azione non può essere annullata. L'utente non potrà più accedere al sistema.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Annulla</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Elimina
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Form */}
      <Dialog 
        open={showForm} 
        onClose={() => setShowForm(false)}
        maxWidth="md"
        fullWidth
      >
        <UserForm
          user={selectedUser}
          mode={formMode}
          onSuccess={() => {
            setShowForm(false);
            fetchUsers();
          }}
          onCancel={() => setShowForm(false)}
        />
      </Dialog>

      {/* Floating Action Button for mobile */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', md: 'none' }
        }}
        onClick={handleCreateUser}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default UsersList;