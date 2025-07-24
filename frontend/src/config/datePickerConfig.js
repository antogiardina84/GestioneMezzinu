// src/config/datePickerConfig.ts
/**
 * Configurazione globale per i DatePicker di MUI
 * Risolve il problema della chiusura improvvisa e della selezione dell'anno
 */

/**
 * Ottiene le proprietà di default per i DatePicker
 * @returns {Object} Le proprietà da applicare ai DatePicker
 */
const getDatePickerConfig = () => ({
          disableFuture: false,
           format: 'DD/MM/YYYY',
  // Impedisce chiusura automatica quando si seleziona un valore
  closeOnSelect: false,
  
  // Riduce le animazioni che possono causare problemi
  reduceAnimations: true,
  
  // Configurazione avanzata per i componenti interni
  slotProps: {
    // Configura la barra delle azioni per includere tutti i pulsanti necessari
    actionBar: {
      actions: ['clear', 'today', 'accept', 'cancel'],
    },
    

    // Migliora il comportamento del selettore dell'anno
    desktopPaper: {
      sx: {
        // Styling migliorato per il selettore dell'anno
        '& .MuiYearCalendar-root': {
          maxHeight: '300px',
          overflowY: 'auto',
          padding: '8px',
          '& .MuiPickersYear-yearButton': {
            margin: '2px',
          },
        },
        // Migliora l'header del calendario
        '& .MuiPickersCalendarHeader-root': {
          paddingLeft: '16px',
          paddingRight: '16px',
          marginTop: '8px',
        },
      },
    },
    
    // Configura il popper per un posizionamento migliore
    popper: {
      placement: 'bottom-start',
      modifiers: [
        {
          name: 'preventOverflow',
          options: {
            boundary: document.body,
          },
        },
        {
          name: 'offset',
          options: {
            offset: [0, 8],
          },
        },
      ],
    },
  },

  // Opzioni avanzate per la visualizzazione
  openTo: 'day', // Apre sempre alla vista del giorno (non dell'anno)
  
  // Non dimenticare di includere disabled con un valore predefinito
  disabled: false,
});

export default getDatePickerConfig;