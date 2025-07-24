export interface DashboardData {
  riepilogoMezzi: Array<{
    _id: string;
    count: number;
  }>;
  contatori: {
    mezziAttivi: number;
    revisioniInScadenza: number;
    bolliInScadenza: number;
    assicurazioniInScadenza: number;
    angaInScadenza: number;
    renInScadenza: number;
    titoliProprietaInScadenza: number;
  };
  revisioni: Array<{
    autoveicolo: {
      _id: string;
      targa: string;
      marca: string;
      modello: string;
      tipoCarrozzeria?: string; // AGGIUNTO
    };
    dataRevisione: Date;
    urgent: boolean;
    giorni: number;
    tipoRevisione?: string; // AGGIUNTO
  }>;
  bolliInScadenza: Array<{
    autoveicolo: {
      _id: string;
      targa: string;
      marca: string;
      modello: string;
    };
    dataScadenza: Date;
    urgent: boolean;
    giorni: number;
  }>;
  assicurazioniInScadenza: Array<{
    autoveicolo: {
      _id: string;
      targa: string;
      marca: string;
      modello: string;
    };
    dataScadenza: Date;
    urgent: boolean;
    giorni: number;
    tolleranza?: boolean;
  }>;
  titoliProprietaInScadenza: Array<{
    autoveicolo: {
      _id: string;
      targa: string;
      marca: string;
      modello: string;
      tipologiaAcquisto: 'Leasing' | 'Noleggio';
    };
    dataScadenza: Date;
    urgent: boolean;
    giorni: number;
  }>;
  angaInScadenza: Array<{
    alboGestore: {
      _id: string;
      numeroIscrizione: string;
      categoria: string;
      classe: string;
    };
    dataScadenza: Date;
    urgent: boolean;
    giorni: number;
  }>;
  renInScadenza: Array<{
    ren: {
      _id: string;
      numeroIscrizione: string;
      regione: string;
      provincia: string;
    };
    dataScadenza: Date;
    urgent: boolean;
    giorni: number;
  }>;
}