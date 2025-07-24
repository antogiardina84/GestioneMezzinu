// src/types/REN.ts
export interface REN {
  _id: string;
  numeroIscrizioneREN: string;
  dataIscrizioneREN: Date | string;
  dataScadenzaREN: Date | string;
  regione: string;
  provincia: string;
  tipologiaAttività: 'Conto Proprio' | 'Conto Terzi';
  numeroIscrizioneContoTerzi?: string;
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