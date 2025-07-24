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
        {/* Header */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ 
            background: 'linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)',
            color: 'white',
            p: 3,
            borderRadius: 2,
            mb: 3
          }}>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PeopleIcon /> Amministrazione Utenti
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Gestisci utenti, permessi e monitora l'attività del sistema
            </Typography>
          </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              variant={isMobile ? "scrollable" : "fullWidth"}
              scrollButtons="auto"
              aria-label="gestione utenti tabs"
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