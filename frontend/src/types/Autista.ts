// frontend/src/types/Autista.ts

export interface Patente {
  tipo: 'AM' | 'A1' | 'A2' | 'A' | 'B' | 'BE' | 'C1' | 'C1E' | 'C' | 'CE' | 'D1' | 'D1E' | 'D' | 'DE' | 'CQC';
  numero?: string;
  dataRilascio?: string;
  dataScadenza: string;
  enteRilascio?: string;
  valida: boolean;
}

export interface Qualifica {
  tipo: 'ADR Base' | 'ADR Cisterne' | 'ADR Esplosivi' | 'CQC Persone' | 'CQC Merci' | 'Muletto' | 'Gru' | 'Altro';
  numero?: string;
  dataRilascio?: string;
  dataScadenza?: string;
  note?: string;
}

export interface Documento {
  numero?: string;
  dataRilascio?: string;
  dataScadenza?: string;
  enteRilascio?: string;
  tipo?: string;
}

export interface Contratto {
  tipo: 'Tempo Indeterminato' | 'Tempo Determinato' | 'Apprendistato' | 'Partita IVA' | 'Collaborazione' | 'Stagionale';
  dataAssunzione: string;
  dataFineContratto?: string;
  orarioLavoro?: 'Full-time' | 'Part-time' | 'Turni';
  livello?: string;
  matricola?: string;
}

export interface Disponibilita {
  lunedi: boolean;
  martedi: boolean;
  mercoledi: boolean;
  giovedi: boolean;
  venerdi: boolean;
  sabato: boolean;
  domenica: boolean;
}

export interface Allegato {
  _id?: string;
  tipo: 'Patente' | 'Carta Identità' | 'Codice Fiscale' | 'Contratto' | 'Certificato Medico' | 'Qualifica' | 'Altro';
  nomeFile: string;
  percorsoFile: string;
  dataCaricamento?: string;
  dataScadenza?: string;
}

export interface Autista {
  _id: string;
  nome: string;
  cognome: string;
  codiceFiscale: string;
  dataNascita: string;
  luogoNascita?: string;
  indirizzo?: {
    via?: string;
    citta?: string;
    provincia?: string;
    cap?: string;
  };
  contatti: {
    telefono: string;
    email?: string;
    telefonoEmergenza?: string;
    contattoEmergenza?: string;
  };
  patenti: Patente[];
  qualifiche?: Qualifica[];
  documenti?: {
    cartaIdentita?: Documento;
    permessoSoggiorno?: Documento;
  };
  contratto: Contratto;
  veicoliAbilitati?: string[]; // Array di ID autoveicoli
  categorieVeicoli?: string[];
  stato: 'Attivo' | 'In Ferie' | 'Malattia' | 'Sospeso' | 'Cessato';
  disponibilita: Disponibilita;
  note?: string;
  allegati?: Allegato[];
  user?: string; // ID User collegato
  attivo: boolean;
  nomeCompleto?: string; // Virtual
  eta?: number; // Virtual
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AutistaListItem {
  id: string;
  value: string;
  label: string;
  nomeCompleto: string;
  telefono?: string;
}

export interface AutistaFormData {
  nome: string;
  cognome: string;
  codiceFiscale: string;
  dataNascita: string;
  luogoNascita?: string;
  indirizzo?: {
    via?: string;
    citta?: string;
    provincia?: string;
    cap?: string;
  };
  contatti: {
    telefono: string;
    email?: string;
    telefonoEmergenza?: string;
    contattoEmergenza?: string;
  };
  patenti: Patente[];
  qualifiche?: Qualifica[];
  contratto: Contratto;
  veicoliAbilitati?: string[];
  categorieVeicoli?: string[];
  stato: 'Attivo' | 'In Ferie' | 'Malattia' | 'Sospeso' | 'Cessato';
  disponibilita: Disponibilita;
  note?: string;
  attivo: boolean;
}

export interface AutistaStats {
  totale: number;
  attivi: number;
  inFerie: number;
  malattia: number;
  sospesi: number;
  scadenze: {
    patenti: number;
    qualifiche: number;
  };
}