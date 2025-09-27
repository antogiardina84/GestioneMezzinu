export interface Manutenzione {
  _id: string;
  autoveicolo: {
    _id: string;
    targa: string;
    marca: string;
    modello: string;
    tipoCarrozzeria: string;
  };
  tipoManutenzione: 'Ordinaria' | 'Straordinaria' | 'Preventiva' | 'Correttiva' | 'Revisione' | 'Tagliando' | 'Riparazione';
  descrizione: string;
  dataProgrammata: Date;
  dataEsecuzione?: Date;
  stato: 'Programmata' | 'In corso' | 'Completata' | 'Annullata' | 'Rimandata';
  priorita: 'Bassa' | 'Media' | 'Alta' | 'Urgente';
  chilometraggioEsecuzione?: number;
  chilometraggioProgammato?: number;
  fornitore: {
    nome: string;
    telefono?: string;
    email?: string;
    indirizzo?: string;
    partitaIVA?: string;
  };
  costi: {
    manodopera: number;
    ricambi: number;
    altri: number;
    iva: number;
  };
  ricambi: Ricambio[];
  note?: string;
  prossimaScadenza?: {
    data?: Date;
    chilometraggio?: number;
    descrizione?: string;
  };
  allegati: Allegato[];
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

export interface Ricambio {
  codice?: string;
  descrizione: string;
  quantita: number;
  prezzoUnitario: number;
}

export interface Allegato {
  _id: string;
  nomeFile: string;
  percorsoFile: string;
  tipo: 'Fattura' | 'Preventivo' | 'Ricevuta' | 'Foto Prima' | 'Foto Dopo' | 'Scheda Tecnica' | 'Garanzia' | 'Altro';
  dataCaricamento: Date;
}

export interface ManutenzioneFilters {
  autoveicolo?: string;
  stato?: string;
  tipoManutenzione?: string;
  priorita?: string;
  dataInizio?: string;
  dataFine?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ManutenzioneScadenze {
  scaduteEUrgenti: Manutenzione[];
  prossimeScadenze: Manutenzione[];
  prossimiTreGiorni: Manutenzione[];
}

export interface ManutenzioneStatistiche {
  statistichePerTipo: Array<{
    _id: string;
    count: number;
    costoTotale: number;
  }>;
  statistichePerFornitore: Array<{
    _id: string;
    count: number;
    costoTotale: number;
  }>;
  statistichePerAutoveicolo: Array<{
    _id: string;
    count: number;
    costoTotale: number;
    autoveicolo: {
      targa: string;
      marca: string;
      modello: string;
    };
  }>;
  costiMensili: Array<{
    _id: number;
    costoTotale: number;
  }>;
}

export const TIPI_MANUTENZIONE = [
  'Ordinaria',
  'Straordinaria', 
  'Preventiva',
  'Correttiva',
  'Revisione',
  'Tagliando',
  'Riparazione'
] as const;

export const STATI_MANUTENZIONE = [
  'Programmata',
  'In corso',
  'Completata',
  'Annullata',
  'Rimandata'
] as const;

export const PRIORITA_MANUTENZIONE = [
  'Bassa',
  'Media',
  'Alta',
  'Urgente'
] as const;

export const TIPI_ALLEGATO_MANUTENZIONE = [
  'Fattura',
  'Preventivo',
  'Ricevuta',
  'Foto Prima',
  'Foto Dopo',
  'Scheda Tecnica',
  'Garanzia',
  'Altro'
] as const;