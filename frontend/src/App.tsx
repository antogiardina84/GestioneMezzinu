// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/auth/PrivateRoute';
import Layout from './components/common/Layout';
import Login from './components/auth/LoginForm';
import Dashboard from './components/dashboard/Dashboard';
import AutoveicoliList from './components/autoveicoli/AutoveicoliList';
import AlboGestoriList from './components/alboGestori/AlboGestoriList';
import ManutezioniList from './components/manutenzioni/ManutenzioniList';
import ManutenzioniDashboard from './components/manutenzioni/ManutenzionDashboard';
import RENList from './components/ren/RENList';
import UsersList from './components/users/UsersList';
import UsersManagement  from './components/users/UsersManagement';

// Tema Material-UI personalizzato
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#fff',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
      contrastText: '#fff',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
    },
    error: {
      main: '#d32f2f',
      light: '#f44336',
      dark: '#c62828',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        elevation3: {
          boxShadow: '0px 1px 8px 0px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#1976d2',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/autoveicoli" element={<AutoveicoliList />} />
                      <Route path="/albo-gestori" element={<AlboGestoriList />} />
                      <Route path='/manutenzioni' element={<ManutezioniList />} />
                      <Route path='/manutenzioni/dashboard' element={<ManutenzioniDashboard />} />
                      <Route path="/ren" element={<RENList />} />
                      <Route path="/users" element={<UsersManagement/>} />
                    </Routes>
                  </Layout>
                </PrivateRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;