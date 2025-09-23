// src/types/Autoveicolo.ts - VERSIONE AGGIORNATA CON PASS ZTL
export interface Autoveicolo {
  _id: string;
  marca: string;
  modello: string;
  cilindrata: number;
  kw: number;
  targa: string;
  tipoCarrozzeria: 'Cassonato' | 'Van' | 'Autovettura' | 'Trattore stradale < 3.5 ton' | 'Trattore stradale > 3.5 ton' | 'Semirimorchio' | 'Rimorchio < 3.5 ton' | 'Rimorchio > 3.5 ton';
  tipologiaAcquisto: 'Proprietà' | 'Leasing' | 'Noleggio';
  scadenzaTitoloProprietà?: Date;
  dataImmatricolazione: Date;
  ultimaRevisione?: Date;
  dataScadenzaBollo?: Date;
  esenteBollo: boolean;
  compagniaAssicurazione: string;
  numeroPolizzaAssicurazione: string;
  dataInizioAssicurazione: Date;
  dataScadenzaAssicurazione: Date;
  iscrizioneANGA: string[];
  stato: 'Attivo' | 'Chiuso' | 'Venduto' | 'Demolito' | 'Veicolo Guasto';
  allegati: Allegato[];
  datiDemolizione?: {
    datiDemolitore: string;
    dataDemolizione: Date;
  };
  telaio?: string;
  autista?: string;
  portataMax?: number;
  autCat1?: string;
  autCat2?: string;
  autCat3?: string;
  passZTL: boolean;
  // NUOVO CAMPO PER LA SCADENZA DEL PASS ZTL
  dataScadenzaPassZTL?: Date;
  autRifiuti: string[];
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Allegato {
  _id: string;
  nomeFile: string;
  percorsoFile: string;
  tipo: string;
  dataCaricamento: Date;
}

// Tipo helper per i tipi di carrozzeria con revisione annuale
export type TipoCarrozzeriaRevisioneAnnuale = 
  | 'Trattore stradale > 3.5 ton'
  | 'Semirimorchio'
  | 'Rimorchio > 3.5 ton';

// Tipo helper per i tipi di carrozzeria con revisione quadriennale/biennale
export type TipoCarrozzeriaRevisioneBiennale = 
  | 'Cassonato'
  | 'Van'
  | 'Autovettura'
  | 'Trattore stradale < 3.5 ton'
  | 'Rimorchio < 3.5 ton';

// Utility type per verificare il tipo di revisione
export interface IntervalliRevisione {
  primaRevisione: number; // anni
  revisioniSuccessive: number; // anni
}

// Costanti per i tipi di carrozzeria
export const TIPI_CARROZZERIA_REVISIONE_ANNUALE: TipoCarrozzeriaRevisioneAnnuale[] = [
  'Trattore stradale > 3.5 ton',
  'Semirimorchio',
  'Rimorchio > 3.5 ton'
];

export const TIPI_CARROZZERIA_REVISIONE_BIENNALE: TipoCarrozzeriaRevisioneBiennale[] = [
  'Cassonato',
  'Van',
  'Autovettura',
  'Trattore stradale < 3.5 ton',
  'Rimorchio < 3.5 ton'
];

// Tutti i tipi di carrozzeria disponibili
export const TUTTI_TIPI_CARROZZERIA = [
  ...TIPI_CARROZZERIA_REVISIONE_BIENNALE,
  ...TIPI_CARROZZERIA_REVISIONE_ANNUALE
] as const;

// Funzione helper per determinare se il veicolo ha un motore
export const isMotorVehicle = (tipoCarrozzeria: Autoveicolo['tipoCarrozzeria']): boolean => {
  return !['Semirimorchio', 'Rimorchio < 3.5 ton', 'Rimorchio > 3.5 ton'].includes(tipoCarrozzeria);
};

// Funzione helper per determinare il tipo di revisione
export const getIntervalliRevisione = (tipoCarrozzeria: Autoveicolo['tipoCarrozzeria']): IntervalliRevisione => {
  if (TIPI_CARROZZERIA_REVISIONE_ANNUALE.includes(tipoCarrozzeria as TipoCarrozzeriaRevisioneAnnuale)) {
    return { primaRevisione: 1, revisioniSuccessive: 1 };
  }
  return { primaRevisione: 4, revisioniSuccessive: 2 };
};

// Funzione helper per calcolare la prossima revisione
export const calcolaProssimaRevisione = (autoveicolo: Autoveicolo): Date => {
  const intervalli = getIntervalliRevisione(autoveicolo.tipoCarrozzeria);
  
  if (autoveicolo.ultimaRevisione) {
    const ultimaRevisione = new Date(autoveicolo.ultimaRevisione);
    const prossima = new Date(ultimaRevisione);
    prossima.setFullYear(ultimaRevisione.getFullYear() + intervalli.revisioniSuccessive);
    return prossima;
  } else {
    const immatricolazione = new Date(autoveicolo.dataImmatricolazione);
    const prossima = new Date(immatricolazione);
    prossima.setFullYear(immatricolazione.getFullYear() + intervalli.primaRevisione);
    return prossima;
  }
};