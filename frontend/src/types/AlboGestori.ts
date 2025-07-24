// src/types/AlboGestori.ts
export interface AlboGestori {
  _id: string;
  numeroIscrizioneAlbo: string;
  categoria: '1' | '4' | '5' | '8' | '9' | '10';
  classe: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  dataIscrizione: Date | string;
  dataScadenzaIscrizione: Date | string;
  allegati: Allegato[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Allegato {
  _id: string;
  nomeFile: string;
  percorsoFile: string;
  tipo: string;
  dataCaricamento: Date | string;
}