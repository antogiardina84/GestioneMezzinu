// src/components/users/UsersManagement.tsx
import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  People as PeopleIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import UsersList from './UsersList';
import UsersStatisticsComponent from './UsersStatistics';
import AdminRoute from '../auth/AdminRoute';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`users-tabpanel-${index}`}
      aria-labelledby={`users-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `users-tab-${index}`,
    'aria-controls': `users-tabpanel-${index}`,
  };
}

const UsersManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <AdminRoute>
      <Box>
        {/* Header in stile Odoo */}
        <Paper 
          elevation={0} 
          sx={{ 
            mb: 3,
            backgroundColor: '#FFFFFF',
            border: '1px solid #E0E0E0',
            borderRadius: '3px',
            boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}
        >
          {/* Header bar viola con icona */}
          <Box 
            sx={{
              backgroundColor: '#714B67',
              color: 'white',
              px: 3,
              py: 2,
              borderBottom: '1px solid #E0E0E0'
            }}
          >
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ 
                fontSize: '18px',
                fontWeight: 600,
                margin: 0,
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                mb: 1
              }}
            >
              <PeopleIcon sx={{ fontSize: '20px' }} /> 
              Amministrazione Utenti
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                fontSize: '13px',
                opacity: 0.9,
                margin: 0,
                fontWeight: 400
              }}
            >
              Gestisci utenti, permessi e monitora l'attività del sistema
            </Typography>
          </Box>

          {/* Tabs in stile Odoo */}
          <Box 
            sx={{ 
              backgroundColor: '#F5F5F5',
              borderBottom: '1px solid #E0E0E0'
            }}
          >
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              variant={isMobile ? "scrollable" : "fullWidth"}
              scrollButtons="auto"
              aria-label="gestione utenti tabs"
              sx={{
                '& .MuiTabs-indicator': {
                  backgroundColor: '#714B67',
                  height: '2px'
                },
                '& .MuiTab-root': {
                  fontSize: '13px',
                  fontWeight: 500,
                  textTransform: 'none',
                  color: '#666666',
                  minHeight: '40px',
                  padding: '8px 16px',
                  '&.Mui-selected': {
                    color: '#714B67',
                    fontWeight: 600
                  },
                  '& .MuiSvgIcon-root': {
                    fontSize: '18px'
                  }
                }
              }}
            >
              <Tab 
                label="Gestione Utenti" 
                icon={<PeopleIcon />} 
                iconPosition="start"
                {...a11yProps(0)} 
              />
              <Tab 
                label="Statistiche" 
                icon={<AnalyticsIcon />} 
                iconPosition="start"
                {...a11yProps(1)} 
              />
            </Tabs>
          </Box>
        </Paper>

        {/* Tab Panels */}
        <TabPanel value={tabValue} index={0}>
          <UsersList />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <UsersStatisticsComponent />
        </TabPanel>
      </Box>
    </AdminRoute>
  );
};

export default UsersManagement;