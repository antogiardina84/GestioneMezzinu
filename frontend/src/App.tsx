// src/App.tsx - Tema stile Odoo
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
import UsersManagement from './components/users/UsersManagement';

// Tema Odoo-style
const odooTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#714B67', // Viola caratteristico di Odoo
      light: '#875A7B',
      dark: '#5D3E56',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#00A09D', // Teal di Odoo
      light: '#4DB6AC',
      dark: '#00796B',
      contrastText: '#ffffff',
    },
    background: {
      default: '#F0F0F0', // Grigio molto chiaro
      paper: '#FFFFFF',
    },
    text: {
      primary: '#212121',
      secondary: '#666666',
    },
    grey: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#EEEEEE',
      300: '#E0E0E0',
      400: '#BDBDBD',
      500: '#9E9E9E',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
    success: {
      main: '#4CAF50',
      light: '#81C784',
      dark: '#388E3C',
    },
    warning: {
      main: '#FF9800',
      light: '#FFB74D',
      dark: '#F57C00',
    },
    error: {
      main: '#F44336',
      light: '#E57373',
      dark: '#D32F2F',
    },
    info: {
      main: '#2196F3',
      light: '#64B5F6',
      dark: '#1976D2',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Lucida Grande", "Helvetica", "Verdana", sans-serif',
    fontSize: 13,
    h1: {
      fontSize: '2.2rem',
      fontWeight: 300,
      color: '#714B67',
    },
    h2: {
      fontSize: '1.8rem',
      fontWeight: 300,
      color: '#714B67',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 400,
      color: '#714B67',
    },
    h4: {
      fontSize: '1.3rem',
      fontWeight: 500,
      color: '#212121',
    },
    h5: {
      fontSize: '1.1rem',
      fontWeight: 500,
      color: '#212121',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      color: '#212121',
    },
    body1: {
      fontSize: '13px',
      lineHeight: 1.4,
    },
    body2: {
      fontSize: '12px',
      lineHeight: 1.3,
    },
    button: {
      fontSize: '13px',
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 3, // Bordi meno arrotondati come Odoo
  },
  shadows: [
    'none',
    '0px 1px 2px rgba(0, 0, 0, 0.1)',
    '0px 1px 4px rgba(0, 0, 0, 0.1)',
    '0px 2px 6px rgba(0, 0, 0, 0.1)',
    '0px 2px 8px rgba(0, 0, 0, 0.12)',
    '0px 3px 10px rgba(0, 0, 0, 0.12)',
    '0px 3px 12px rgba(0, 0, 0, 0.14)',
    '0px 4px 14px rgba(0, 0, 0, 0.14)',
    '0px 4px 16px rgba(0, 0, 0, 0.16)',
    '0px 5px 18px rgba(0, 0, 0, 0.16)',
    '0px 5px 20px rgba(0, 0, 0, 0.18)',
    '0px 6px 22px rgba(0, 0, 0, 0.18)',
    '0px 6px 24px rgba(0, 0, 0, 0.2)',
    '0px 7px 26px rgba(0, 0, 0, 0.2)',
    '0px 7px 28px rgba(0, 0, 0, 0.22)',
    '0px 8px 30px rgba(0, 0, 0, 0.22)',
    '0px 8px 32px rgba(0, 0, 0, 0.24)',
    '0px 9px 34px rgba(0, 0, 0, 0.24)',
    '0px 9px 36px rgba(0, 0, 0, 0.26)',
    '0px 10px 38px rgba(0, 0, 0, 0.26)',
    '0px 10px 40px rgba(0, 0, 0, 0.28)',
    '0px 11px 42px rgba(0, 0, 0, 0.28)',
    '0px 11px 44px rgba(0, 0, 0, 0.3)',
    '0px 12px 46px rgba(0, 0, 0, 0.3)',
    '0px 12px 48px rgba(0, 0, 0, 0.32)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#F0F0F0',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#714B67',
          boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.1)',
          '& .MuiToolbar-root': {
            minHeight: '48px',
            paddingLeft: '16px',
            paddingRight: '16px',
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#2F2F2F',
          color: '#CCCCCC',
          borderRight: 'none',
          '& .MuiListItemIcon-root': {
            color: '#CCCCCC',
            minWidth: '40px',
          },
          '& .MuiListItemText-primary': {
            fontSize: '13px',
            fontWeight: 400,
          },
          '& .MuiListItemButton-root': {
            paddingLeft: '16px',
            paddingRight: '16px',
            paddingTop: '8px',
            paddingBottom: '8px',
            margin: '2px 8px',
            borderRadius: '3px',
            '&:hover': {
              backgroundColor: '#404040',
            },
            '&.Mui-selected': {
              backgroundColor: '#714B67',
              '&:hover': {
                backgroundColor: '#875A7B',
              },
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.1)',
        },
        elevation1: {
          boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
        },
        elevation2: {
          boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.1)',
        },
        elevation3: {
          boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontSize: '13px',
          fontWeight: 500,
          borderRadius: '3px',
          padding: '6px 16px',
          minHeight: '32px',
        },
        contained: {
          boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.2)',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
          },
        },
        outlined: {
          borderColor: '#D0D0D0',
          color: '#666666',
          '&:hover': {
            backgroundColor: '#F5F5F5',
            borderColor: '#BDBDBD',
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#F5F5F5',
            color: '#666666',
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'uppercase',
            borderBottom: '1px solid #E0E0E0',
            padding: '8px 16px',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '13px',
          padding: '8px 16px',
          borderBottom: '1px solid #F0F0F0',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#F9F9F9',
          },
          '&:nth-of-type(even)': {
            backgroundColor: '#FAFAFA',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          height: '24px',
          fontSize: '11px',
          fontWeight: 500,
          borderRadius: '12px',
        },
        colorSuccess: {
          backgroundColor: '#E8F5E8',
          color: '#2E7D32',
        },
        colorWarning: {
          backgroundColor: '#FFF8E1',
          color: '#F57C00',
        },
        colorError: {
          backgroundColor: '#FFEBEE',
          color: '#D32F2F',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.1)',
          borderRadius: '3px',
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          backgroundColor: '#F5F5F5',
          borderBottom: '1px solid #E0E0E0',
          padding: '12px 16px',
          '& .MuiCardHeader-title': {
            fontSize: '14px',
            fontWeight: 600,
            color: '#212121',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            fontSize: '13px',
            '& fieldset': {
              borderColor: '#D0D0D0',
            },
            '&:hover fieldset': {
              borderColor: '#BDBDBD',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#714B67',
            },
          },
          '& .MuiInputLabel-root': {
            fontSize: '13px',
            color: '#666666',
            '&.Mui-focused': {
              color: '#714B67',
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          fontSize: '13px',
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        label: {
          fontSize: '13px',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          fontSize: '13px',
          borderRadius: '3px',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #E0E0E0',
          minHeight: '40px',
        },
        indicator: {
          backgroundColor: '#714B67',
          height: '2px',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontSize: '13px',
          fontWeight: 500,
          minHeight: '40px',
          padding: '8px 16px',
          color: '#666666',
          '&.Mui-selected': {
            color: '#714B67',
          },
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={odooTheme}>
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
                      <Route path="/users" element={<UsersManagement />} />
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