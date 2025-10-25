// src/components/servizi/ServiziCalendarioPlanner.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Grid,
  Card,
  CardContent,
  Chip,
  Dialog,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  Badge,
  CircularProgress,
  Button,
  Tooltip,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Today,
  Event,
  AccessTime,
  DirectionsCar,
  Person,
  Close as CloseIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/it';
import isoWeek from 'dayjs/plugin/isoWeek';
import { Servizio, StatoServizio, PrioritaServizio } from '../../types/Servizio';
import { serviziService } from '../../services/serviziService';
import ServizioDetailModal from './ServizioDetailModal';
import FoglioLavoroGiornaliero from './FoglioLavoroGiornaliero';

dayjs.extend(isoWeek);
dayjs.locale('it');

const ServiziCalendarioPlanner: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());
  const [servizi, setServizi] = useState<Servizio[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [selectedServizio, setSelectedServizio] = useState<Servizio | null>(null);
  const [showDateDetail, setShowDateDetail] = useState(false);
  const [showServizioDetail, setShowServizioDetail] = useState(false);
  const [showStampa, setShowStampa] = useState(false);
  const [dataStampa, setDataStampa] = useState<Dayjs | null>(null);

  // Carica servizi del mese
  const loadServizi = React.useCallback(async () => {
    try {
      setLoading(true);
      const startOfMonth = currentMonth.startOf('month').toISOString();
      const endOfMonth = currentMonth.endOf('month').toISOString();
      
      const response = await serviziService.getAll({
        limit: 10000,
        dataInizio: startOfMonth,
        dataFine: endOfMonth,
      });
      
      setServizi(response.data || []);
    } catch (error) {
      console.error('Errore caricamento servizi:', error);
      setServizi([]);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    loadServizi();
  }, [loadServizi]);

  // Naviga al mese precedente
  const handlePreviousMonth = () => {
    setCurrentMonth(currentMonth.subtract(1, 'month'));
  };

  // Naviga al mese successivo
  const handleNextMonth = () => {
    setCurrentMonth(currentMonth.add(1, 'month'));
  };

  // Torna a oggi
  const handleToday = () => {
    setCurrentMonth(dayjs());
  };

  // Ottieni servizi per una data specifica
  const getServiziForDate = (date: Dayjs): Servizio[] => {
    return servizi.filter(servizio => {
      const servizioDate = dayjs(servizio.dataInizio);
      return servizioDate.format('YYYY-MM-DD') === date.format('YYYY-MM-DD');
    });
  };

  // Click su una data del calendario
  const handleDateClick = (date: Dayjs) => {
    const serviziGiorno = getServiziForDate(date);
    if (serviziGiorno.length > 0) {
      setSelectedDate(date);
      setShowDateDetail(true);
    }
  };

  // Click su un servizio nella lista
  const handleServizioClick = (servizio: Servizio) => {
    setSelectedServizio(servizio);
    setShowServizioDetail(true);
  };

  // Chiudi dialog lista servizi
  const handleCloseDateDetail = () => {
    setShowDateDetail(false);
    setSelectedDate(null);
  };

  // Chiudi dialog dettaglio servizio
  const handleCloseServizioDetail = () => {
    setShowServizioDetail(false);
    setSelectedServizio(null);
  };

  // Genera i giorni del mese
  const generateCalendarDays = (): (Dayjs | null)[] => {
    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    const startDate = startOfMonth.startOf('isoWeek');
    const endDate = endOfMonth.endOf('isoWeek');

    const days: (Dayjs | null)[] = [];
    let currentDate = startDate;

    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
      days.push(currentDate);
      currentDate = currentDate.add(1, 'day');
    }

    return days;
  };

  // Colori per stati
  const getStatoColor = (stato: StatoServizio): string => {
    switch (stato) {
      case 'Programmato': return '#2196F3';
      case 'In corso': return '#FF9800';
      case 'Completato': return '#4CAF50';
      case 'Annullato': return '#9E9E9E';
      case 'Posticipato': return '#FFC107';
      default: return '#9E9E9E';
    }
  };

  const getPrioritaColor = (priorita: PrioritaServizio): string => {
    switch (priorita) {
      case 'Urgente': return '#F44336';
      case 'Alta': return '#FF9800';
      case 'Media': return '#2196F3';
      case 'Bassa': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  // Rendering giorni settimana
  const weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  const calendarDays = generateCalendarDays();
  const serviziDelGiorno = selectedDate ? getServiziForDate(selectedDate) : [];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Caricamento calendario...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header Calendario */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <Event color="primary" sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h5" fontWeight={600}>
                {currentMonth.format('MMMM YYYY')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {servizi.length} servizi questo mese
              </Typography>
            </Box>
          </Box>

          <Box display="flex" gap={1}>
            <Tooltip title="Stampa Foglio Lavoro">
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={() => {
                  setDataStampa(currentMonth);
                  setShowStampa(true);
                }}
                size="small"
              >
                Stampa
              </Button>
            </Tooltip>
            <Tooltip title="Mese Precedente">
              <IconButton onClick={handlePreviousMonth} color="primary">
                <ChevronLeft />
              </IconButton>
            </Tooltip>
            <Tooltip title="Oggi">
              <Button
                variant="outlined"
                startIcon={<Today />}
                onClick={handleToday}
                size="small"
              >
                Oggi
              </Button>
            </Tooltip>
            <Tooltip title="Mese Successivo">
              <IconButton onClick={handleNextMonth} color="primary">
                <ChevronRight />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Calendario */}
      <Paper elevation={2} sx={{ p: 2 }}>
        {/* Intestazione giorni settimana */}
        <Grid container spacing={1} sx={{ mb: 1 }}>
          {weekDays.map((day) => (
            <Grid item xs key={day}>
              <Box
                sx={{
                  textAlign: 'center',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: 'text.secondary',
                  py: 1,
                }}
              >
                {day}
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Griglia giorni */}
        <Grid container spacing={1}>
          {calendarDays.map((day, index) => {
            if (!day) return <Grid item xs key={index} />;

            const isCurrentMonth = day.month() === currentMonth.month();
            const isToday = day.isSame(dayjs(), 'day');
            const serviziGiorno = getServiziForDate(day);
            const hasServizi = serviziGiorno.length > 0;

            return (
              <Grid item xs key={index}>
                <Card
                  sx={{
                    minHeight: 100,
                    cursor: hasServizi ? 'pointer' : 'default',
                    opacity: isCurrentMonth ? 1 : 0.4,
                    border: isToday ? '2px solid #714B67' : '1px solid #E0E0E0',
                    backgroundColor: hasServizi ? '#F5F5F5' : 'white',
                    transition: 'all 0.2s',
                    '&:hover': hasServizi ? {
                      boxShadow: 3,
                      transform: 'translateY(-2px)',
                    } : {},
                  }}
                  onClick={() => handleDateClick(day)}
                >
                  <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Typography
                        variant="body2"
                        fontWeight={isToday ? 700 : 500}
                        color={isToday ? 'primary' : 'text.primary'}
                      >
                        {day.date()}
                      </Typography>
                      {hasServizi && (
                        <Badge
                          badgeContent={serviziGiorno.length}
                          color="primary"
                          sx={{
                            '& .MuiBadge-badge': {
                              fontSize: '0.65rem',
                              height: 16,
                              minWidth: 16,
                            }
                          }}
                        />
                      )}
                    </Box>

                    {/* Mini indicatori servizi */}
                    {hasServizi && (
                      <Box mt={1} display="flex" flexDirection="column" gap={0.5}>
                        {serviziGiorno.slice(0, 3).map((servizio) => (
                          <Box
                            key={servizio._id}
                            sx={{
                              height: 4,
                              borderRadius: 1,
                              backgroundColor: getStatoColor(servizio.stato),
                            }}
                          />
                        ))}
                        {serviziGiorno.length > 3 && (
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: '0.65rem',
                              color: 'text.secondary',
                              textAlign: 'center',
                            }}
                          >
                            +{serviziGiorno.length - 3}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Legenda */}
        <Box mt={3} p={2} bgcolor="grey.50" borderRadius={1}>
          <Typography variant="subtitle2" gutterBottom fontWeight={600}>
            Legenda Stati
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Chip
              label="Programmato"
              size="small"
              sx={{ backgroundColor: getStatoColor('Programmato'), color: 'white' }}
            />
            <Chip
              label="In corso"
              size="small"
              sx={{ backgroundColor: getStatoColor('In corso'), color: 'white' }}
            />
            <Chip
              label="Completato"
              size="small"
              sx={{ backgroundColor: getStatoColor('Completato'), color: 'white' }}
            />
            <Chip
              label="Annullato"
              size="small"
              sx={{ backgroundColor: getStatoColor('Annullato'), color: 'white' }}
            />
          </Box>
        </Box>
      </Paper>

      {/* Dialog: Lista Servizi del Giorno */}
      <Dialog
        open={showDateDetail}
        onClose={handleCloseDateDetail}
        maxWidth="md"
        fullWidth
      >
        <Box sx={{ p: 2, borderBottom: '1px solid #E0E0E0' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Servizi del {selectedDate?.format('DD MMMM YYYY')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {serviziDelGiorno.length} {serviziDelGiorno.length === 1 ? 'servizio' : 'servizi'}
              </Typography>
            </Box>
            <IconButton onClick={handleCloseDateDetail} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <List sx={{ pt: 0 }}>
          {serviziDelGiorno.map((servizio, index) => (
            <React.Fragment key={servizio._id}>
              {index > 0 && <Divider />}
              <ListItem disablePadding>
                <ListItemButton onClick={() => handleServizioClick(servizio)}>
                  <ListItemIcon>
                    <Event sx={{ color: getStatoColor(servizio.stato) }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                        <Typography variant="body1" fontWeight={600}>
                          {servizio.titolo}
                        </Typography>
                        <Chip
                          label={servizio.stato}
                          size="small"
                          sx={{
                            backgroundColor: getStatoColor(servizio.stato),
                            color: 'white',
                            fontSize: '0.7rem',
                          }}
                        />
                        <Chip
                          label={servizio.priorita}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: getPrioritaColor(servizio.priorita),
                            color: getPrioritaColor(servizio.priorita),
                            fontSize: '0.7rem',
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box mt={0.5}>
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <AccessTime sx={{ fontSize: 14 }} />
                          <Typography variant="caption">
                            {servizio.oraInizio} - {servizio.oraFine}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            •
                          </Typography>
                          <Typography variant="caption">
                            {servizio.tipoServizio}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <DirectionsCar sx={{ fontSize: 14 }} />
                          <Typography variant="caption">
                            {servizio.autoveicolo?.targa} - {servizio.autoveicolo?.marca} {servizio.autoveicolo?.modello}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Person sx={{ fontSize: 14 }} />
                          <Typography variant="caption">
                            {servizio.autista}
                          </Typography>
                        </Box>
                        {servizio.descrizione && (
                          <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                            {servizio.descrizione.substring(0, 100)}
                            {servizio.descrizione.length > 100 ? '...' : ''}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      </Dialog>

      {/* Dialog: Dettaglio Servizio */}
      <Dialog
        open={showServizioDetail}
        onClose={handleCloseServizioDetail}
        maxWidth="md"
        fullWidth
      >
        {selectedServizio && (
          <ServizioDetailModal
            servizio={selectedServizio}
            onClose={handleCloseServizioDetail}
          />
        )}
      </Dialog>

      {/* Dialog: Stampa Foglio Lavoro */}
      <FoglioLavoroGiornaliero
        open={showStampa}
        onClose={() => setShowStampa(false)}
        dataPreselezionata={dataStampa || undefined}
      />
    </Box>
  );
};

export default ServiziCalendarioPlanner;