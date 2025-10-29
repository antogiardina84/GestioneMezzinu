// frontend/src/types/Servizio.ts
import { AutistaListItem } from './Autista'; 
import { Autoveicolo } from './Autoveicolo'; // AGGIUNTO

export interface Servizio {
  _id: string;
  titolo: string;
  descrizione?: string;
  // CORREZIONE: Uso l'interfaccia Autoveicolo importata
  autoveicolo: Autoveicolo; 
  // La proprietà 'autista' a livello di Servizio è corretta (assegnazione per il servizio)
  autista: string | AutistaListItem; 
  tipoServizio: TipoServizio;
  dataInizio: Date;
  dataFine: Date;
  oraInizio: string;
  oraFine: string;
  stato: StatoServizio;
  priorita: PrioritaServizio;
  luogoPartenza?: Luogo;
  luogoArrivo?: Luogo;
  cliente?: Cliente;
  chilometraggio?: Chilometraggio;
  carburante?: Carburante;
  materiali?: Materiale[];
  costi?: Costi;
  note?: string;
  noteCompletamento?: string;
  allegati: Allegato[];
  ricorrenza?: Ricorrenza;
  completato: boolean;
  dataCompletamento?: Date;
  createdBy?: {
    _id: string;
    nome: string;
    email: string;
  };
  updatedBy?: {
    _id: string;
    nome: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Luogo {
  indirizzo?: string;
  citta?: string;
  provincia?: string;
  cap?: string;
  coordinate?: {
    lat: number;
    lng: number;
  };
}

export interface Cliente {
  nome?: string;
  telefono?: string;
  email?: string;
  riferimento?: string;
}

export interface Chilometraggio {
  iniziale?: number;
  finale?: number;
  totale: number;
}

export interface Carburante {
  iniziale?: number;
  finale?: number;
  rifornimento?: {
    effettuato: boolean;
    quantita?: number;
    costo?: number;
    stazione?: string;
  };
}

export interface Materiale {
  descrizione: string;
  quantita?: number;
  unitaMisura?: string;
  peso?: number;
  note?: string;
}

export interface Costi {
  pedaggi: number;
  parcheggi: number;
  altri: number;
}

export interface Allegato {
  _id: string;
  nomeFile: string;
  percorsoFile: string;
  tipo: TipoAllegato;
  dataCaricamento: Date;
}

export interface Ricorrenza {
  attiva: boolean;
  frequenza?: FrequenzaRicorrenza;
  giornoSettimana?: number[];
  giornoMese?: number;
  dataFineRicorrenza?: Date;
}

export type TipoServizio = 
  | 'Trasporto'
  | 'Raccolta'
  | 'Consegna'
  | 'Manutenzione'
  | 'Ispezione'
  | 'Altro';

export type StatoServizio = 
  | 'Programmato'
  | 'In corso'
  | 'Completato'
  | 'Annullato'
  | 'Posticipato';

export type PrioritaServizio = 
  | 'Bassa'
  | 'Media'
  | 'Alta'
  | 'Urgente';

export type TipoAllegato = 
  | 'Documento Trasporto'
  | 'Bolla Consegna'
  | 'Foto Merce'
  | 'Ricevuta'
  | 'Contratto'
  | 'Autorizzazione'
  | 'Altro';

export type FrequenzaRicorrenza = 
  | 'Giornaliera'
  | 'Settimanale'
  | 'Mensile'
  | 'Personalizzata';

export interface ServizioFilters {
  autoveicolo?: string;
  autista?: string;
  stato?: string;
  tipoServizio?: string;
  priorita?: string;
  dataInizio?: string;
  dataFine?: string;
  mese?: number;
  anno?: number;
  completato?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ServizioCalendario {
  tipo: 'mese' | 'settimana' | 'giorno';
  dataInizio: Date;
  dataFine: Date;
  servizi: Record<string, Servizio[]>; // Chiave: data in formato YYYY-MM-DD
}

export interface ServizioStatistiche {
  anno: number;
  contatori: {
    totale: number;
    completati: number;
    inCorso: number;
    programmati: number;
    tassoCompletamento: number;
  };
  statistichePerTipo: Array<{
    _id: string;
    count: number;
    completati: number;
    chilometraggioTotale: number;
    costiTotali: number;
  }>;
  statistichePerAutoveicolo: Array<{
    _id: string;
    count: number;
    completati: number;
    chilometraggioTotale: number;
    autoveicolo: {
      targa: string;
      marca: string;
      modello: string;
    };
  }>;
  statistichePerAutista: Array<{
    _id: string;
    count: number;
    completati: number;
    chilometraggioTotale: number;
  }>;
  serviziMensili: Array<{
    _id: number; // Mese (1-12)
    count: number;
    completati: number;
    chilometraggioTotale: number;
  }>;
}

export interface ServizioConflitto {
  _id: string;
  titolo: string;
  autoveicolo: {
    _id: string;
    targa: string;
    marca: string;
    modello: string;
  };
  autista: string;
  dataInizio: Date;
  dataFine: Date;
  stato: StatoServizio;
}

export const TIPI_SERVIZIO: TipoServizio[] = [
  'Trasporto',
  'Raccolta',
  'Consegna',
  'Manutenzione',
  'Ispezione',
  'Altro'
];

export const STATI_SERVIZIO: StatoServizio[] = [
  'Programmato',
  'In corso',
  'Completato',
  'Annullato',
  'Posticipato'
];

export const PRIORITA_SERVIZIO: PrioritaServizio[] = [
  'Bassa',
  'Media',
  'Alta',
  'Urgente'
];

export const TIPI_ALLEGATO: TipoAllegato[] = [
  'Documento Trasporto',
  'Bolla Consegna',
  'Foto Merce',
  'Ricevuta',
  'Contratto',
  'Autorizzazione',
  'Altro'
];

export const FREQUENZE_RICORRENZA: FrequenzaRicorrenza[] = [
  'Giornaliera',
  'Settimanale',
  'Mensile',
  'Personalizzata'
];

// Helper functions
export const getStatoColor = (stato: StatoServizio): string => {
  switch (stato) {
    case 'Programmato':
      return 'blue';
    case 'In corso':
      return 'yellow';
    case 'Completato':
      return 'green';
    case 'Annullato':
      return 'gray';
    case 'Posticipato':
      return 'orange';
    default:
      return 'gray';
  }
};

export const getPrioritaColor = (priorita: PrioritaServizio): string => {
  switch (priorita) {
    case 'Bassa':
      return 'green';
    case 'Media':
      return 'blue';
    case 'Alta':
      return 'orange';
    case 'Urgente':
      return 'red';
    default:
      return 'gray';
  }
};

export const formatOra = (ora: string): string => {
  return ora;
};

export const calcolaDurata = (oraInizio: string, oraFine: string): string => {
  const [oreInizio, minutiInizio] = oraInizio.split(':').map(Number);
  const [oreFine, minutiFine] = oraFine.split(':').map(Number);
  
  const minutiTotaliInizio = oreInizio * 60 + minutiInizio;
  const minutiTotaliFine = oreFine * 60 + minutiFine;
  
  const differenzaMinuti = minutiTotaliFine - minutiTotaliInizio;
  const ore = Math.floor(differenzaMinuti / 60);
  const minuti = differenzaMinuti % 60;
  
  if (ore > 0 && minuti > 0) {
    return `${ore}h ${minuti}m`;
  } else if (ore > 0) {
    return `${ore}h`;
  } else {
    return `${minuti}m`;
  }
};