// src/services/autoveicoliService.ts - VERSIONE CORRETTA COMPLETA
import api from './api';
import { Autoveicolo } from '../types/Autoveicolo';

interface ListResponse<T> {
  success: boolean;
  count: number;
  pagination?: {
    next?: { page: number; limit: number };
    prev?: { page: number; limit: number };
  };
  data: T[];
}

interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// Tipo unificato per la creazione/aggiornamento con i nuovi campi
// Supporta sia Date objects (dal frontend) che stringhe ISO (per API)
interface AutoveicoloData {
  marca?: string;
  modello?: string;
  cilindrata?: number;
  kw?: number;
  targa?: string;
  tipoCarrozzeria?: Autoveicolo['tipoCarrozzeria'];
  tipologiaAcquisto?: 'Proprietà' | 'Leasing' | 'Noleggio';
  scadenzaTitoloProprietà?: string | Date;
  dataImmatricolazione?: string | Date;
  ultimaRevisione?: string | Date;
  dataScadenzaBollo?: string | Date;
  esenteBollo?: boolean;
  compagniaAssicurazione?: string;
  numeroPolizzaAssicurazione?: string;
  dataInizioAssicurazione?: string | Date;
  dataScadenzaAssicurazione?: string | Date;
  telaio?: string;
  autista?: string;
  portataMax?: number;
  autCat1?: string;
  autCat2?: string;
  autCat3?: string;
  passZTL?: boolean;
  autRifiuti?: string[];
  note?: string;
  // Campi per gestione stati
  stato?: 'Attivo' | 'Chiuso' | 'Venduto' | 'Demolito';
  motivoChiusura?: string;
  datiDemolizione?: {
    datiDemolitore: string;
    dataDemolizione: string | Date;
  };
}

// Tipo per i filtri di ricerca aggiornato
interface AutoveicoloFilters {
  stato?: string;
  tipoCarrozzeria?: string;
  tipologiaAcquisto?: string;
  marca?: string;
  targa?: string;
  autista?: string;
  esenteBollo?: boolean;
  passZTL?: boolean;
  conAutRifiuti?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const autoveicoliService = {
  // Ottieni tutti gli autoveicoli con filtri aggiornati
  async getAll(filters?: AutoveicoloFilters): Promise<ListResponse<Autoveicolo>> {
    console.log('🔍 Fetching autoveicoli with filters:', filters);
    
    try {
      const params = new URLSearchParams();
      
      // Filtri esistenti
      if (filters?.stato) params.append('stato', filters.stato);
      if (filters?.tipoCarrozzeria) params.append('tipoCarrozzeria', filters.tipoCarrozzeria);
      if (filters?.tipologiaAcquisto) params.append('tipologiaAcquisto', filters.tipologiaAcquisto);
      if (filters?.marca) params.append('marca', filters.marca);
      if (filters?.targa) params.append('targa', filters.targa);
      
      // NUOVI FILTRI
      if (filters?.autista) params.append('autista', filters.autista);
      if (filters?.esenteBollo !== undefined) params.append('esenteBollo', filters.esenteBollo.toString());
      if (filters?.passZTL !== undefined) params.append('passZTL', filters.passZTL.toString());
      if (filters?.conAutRifiuti !== undefined) params.append('conAutRifiuti', filters.conAutRifiuti.toString());
      
      // Paginazione e ordinamento
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

      const response = await api.get(`/autoveicoli?${params.toString()}`);
      console.log('✅ Autoveicoli fetched successfully:', response.data);
      return response.data as ListResponse<Autoveicolo>;
    } catch (error) {
      console.error('❌ Error fetching autoveicoli:', error);
      throw error;
    }
  },

  // Ottieni un autoveicolo per ID
  async getById(id: string): Promise<Autoveicolo> {
    console.log(`🔍 Fetching autoveicolo with ID: ${id}`);
    
    try {
      const response = await api.get(`/autoveicoli/${id}`);
      console.log('✅ Autoveicolo fetched successfully:', response.data);
      return (response.data as ApiResponse<Autoveicolo>).data;
    } catch (error) {
      console.error(`❌ Error fetching autoveicolo ${id}:`, error);
      throw error;
    }
  },

  // Funzione helper per convertire Date objects in stringhe ISO
  convertDatesToISO(data: Partial<AutoveicoloData>): any {
    const converted = { ...data };
    
    // Lista dei campi data da convertire
    const dateFields = [
      'scadenzaTitoloProprietà',
      'dataImmatricolazione', 
      'ultimaRevisione',
      'dataScadenzaBollo',
      'dataInizioAssicurazione',
      'dataScadenzaAssicurazione'
    ];

    dateFields.forEach(field => {
      if (converted[field] && converted[field] instanceof Date) {
        converted[field] = (converted[field] as Date).toISOString();
      }
    });

    // Gestione campo datiDemolizione
    if (converted.datiDemolizione?.dataDemolizione instanceof Date) {
      converted.datiDemolizione.dataDemolizione = converted.datiDemolizione.dataDemolizione.toISOString();
    }

    return converted;
  },

  // Crea nuovo autoveicolo
  async create(data: Partial<AutoveicoloData>): Promise<Autoveicolo> {
    console.log('🔨 Creating new autoveicolo:', data);
    
    try {
      // Validazione base
      if (!data.marca || !data.modello || !data.targa) {
        throw new Error('Marca, modello e targa sono obbligatori');
      }

      // Converti Date objects in stringhe ISO
      const convertedData = this.convertDatesToISO(data);

      // Preparazione dati con validazione per esenzione bollo
      const payload = {
        ...convertedData,
        // Se esente dal bollo, rimuovi la data di scadenza
        dataScadenzaBollo: convertedData.esenteBollo ? undefined : convertedData.dataScadenzaBollo,
        // Assicurati che i campi booleani abbiano valori di default
        esenteBollo: convertedData.esenteBollo || false,
        passZTL: convertedData.passZTL || false,
        autRifiuti: convertedData.autRifiuti || [],
      };

      const response = await api.post('/autoveicoli', payload);
      console.log('✅ Autoveicolo created successfully:', response.data);
      return (response.data as ApiResponse<Autoveicolo>).data;
    } catch (error) {
      console.error('❌ Error creating autoveicolo:', error);
      throw error;
    }
  },

  // Aggiorna autoveicolo esistente
  async update(id: string, data: Partial<AutoveicoloData>): Promise<Autoveicolo> {
    console.log(`🔧 Updating autoveicolo ${id}:`, data);
    
    try {
      // Converti Date objects in stringhe ISO
      const convertedData = this.convertDatesToISO(data);

      // Preparazione dati con validazione per esenzione bollo
      const payload = {
        ...convertedData,
        // Se esente dal bollo, rimuovi la data di scadenza
        dataScadenzaBollo: convertedData.esenteBollo ? undefined : convertedData.dataScadenzaBollo,
        // Assicurati che i campi booleani mantengano i loro valori
        esenteBollo: convertedData.esenteBollo !== undefined ? convertedData.esenteBollo : false,
        passZTL: convertedData.passZTL !== undefined ? convertedData.passZTL : false,
        autRifiuti: convertedData.autRifiuti || [],
      };

      const response = await api.put(`/autoveicoli/${id}`, payload);
      console.log('✅ Autoveicolo updated successfully:', response.data);
      return (response.data as ApiResponse<Autoveicolo>).data;
    } catch (error) {
      console.error(`❌ Error updating autoveicolo ${id}:`, error);
      throw error;
    }
  },

  // Elimina autoveicolo
  async delete(id: string): Promise<void> {
    console.log(`🗑️ Deleting autoveicolo ${id}`);
    
    try {
      await api.delete(`/autoveicoli/${id}`);
      console.log('✅ Autoveicolo deleted successfully');
    } catch (error) {
      console.error(`❌ Error deleting autoveicolo ${id}:`, error);
      throw error;
    }
  },

  // Carica allegati per un autoveicolo
  async uploadAllegati(id: string, files: FileList, tipo: string): Promise<any> {
    console.log(`📎 Uploading allegati for autoveicolo ${id}, type: ${tipo}`);
    
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      formData.append('tipo', tipo);

      const response = await api.post(`/autoveicoli/${id}/allegati`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('✅ Allegati uploaded successfully:', response.data);
      return (response.data as ApiResponse).data;
    } catch (error) {
      console.error(`❌ Error uploading allegati for autoveicolo ${id}:`, error);
      throw error;
    }
  },

  // Elimina allegato specifico
  async deleteAllegato(autoveicoloId: string, allegatoId: string): Promise<void> {
    console.log(`🗑️ Deleting allegato ${allegatoId} from autoveicolo ${autoveicoloId}`);
    
    try {
      await api.delete(`/autoveicoli/${autoveicoloId}/allegati/${allegatoId}`);
      console.log('✅ Allegato deleted successfully');
    } catch (error) {
      console.error(`❌ Error deleting allegato ${allegatoId}:`, error);
      throw error;
    }
  },

  // Cambia stato autoveicolo
  async changeStatus(id: string, nuovoStato: 'Attivo' | 'Chiuso' | 'Venduto' | 'Demolito', datiAggiuntivi?: any): Promise<Autoveicolo> {
    console.log(`🔄 Changing status of autoveicolo ${id} to ${nuovoStato}`);
    
    try {
      const payload = {
        stato: nuovoStato,
        ...datiAggiuntivi
      };

      const response = await api.patch(`/autoveicoli/${id}/status`, payload);
      console.log('✅ Status changed successfully:', response.data);
      return (response.data as ApiResponse<Autoveicolo>).data;
    } catch (error) {
      console.error(`❌ Error changing status of autoveicolo ${id}:`, error);
      throw error;
    }
  },

  // FUNZIONI PER GESTIONE STATI

  // Vendi autoveicolo (compatibile con l'uso esistente)
  async vendi(id: string, datiVendita?: { dataVendita?: string; acquirente?: string; prezzo?: number }): Promise<Autoveicolo> {
    console.log(`💰 Vendendo autoveicolo ${id}:`, datiVendita);
    
    try {
      // Usa PUT come nel controller esistente
      const response = await api.put(`/autoveicoli/${id}/vendi`, datiVendita || {});
      console.log('✅ Autoveicolo sold successfully:', response.data);
      return (response.data as ApiResponse<Autoveicolo>).data;
    } catch (error) {
      console.error(`❌ Error selling autoveicolo ${id}:`, error);
      throw error;
    }
  },

  // Demolisci autoveicolo (compatibile con l'uso esistente)
  async demolisci(id: string, datiDemolizione: { datiDemolitore: string; dataDemolizione?: string }): Promise<Autoveicolo> {
    console.log(`🔨 Demolendo autoveicolo ${id}:`, datiDemolizione);
    
    try {
      // Usa PUT come nel controller esistente
      const payload = {
        datiDemolitore: datiDemolizione.datiDemolitore,
        dataDemolizione: datiDemolizione.dataDemolizione || new Date().toISOString()
      };

      const response = await api.put(`/autoveicoli/${id}/demolisci`, payload);
      console.log('✅ Autoveicolo demolished successfully:', response.data);
      return (response.data as ApiResponse<Autoveicolo>).data;
    } catch (error) {
      console.error(`❌ Error demolishing autoveicolo ${id}:`, error);
      throw error;
    }
  },

  // Chiudi autoveicolo (compatibile con update esistente)
  async chiudi(id: string, motivoChiusura?: string): Promise<Autoveicolo> {
    console.log(`🔒 Chiudendo autoveicolo ${id}, motivo:`, motivoChiusura);
    
    try {
      // Usa API diretta invece di this.update per evitare problemi di tipo
      const payload = {
        stato: 'Chiuso' as const,
        motivoChiusura: motivoChiusura || ''
      };

      const response = await api.put(`/autoveicoli/${id}`, payload);
      console.log('✅ Autoveicolo closed successfully:', response.data);
      return (response.data as ApiResponse<Autoveicolo>).data;
    } catch (error) {
      console.error(`❌ Error closing autoveicolo ${id}:`, error);
      throw error;
    }
  },

  // Riattiva autoveicolo
  async riattiva(id: string): Promise<Autoveicolo> {
    console.log(`🔓 Riattivando autoveicolo ${id}`);
    
    try {
      // Usa API diretta invece di this.update per evitare problemi di tipo
      const payload = {
        stato: 'Attivo' as const
      };

      const response = await api.put(`/autoveicoli/${id}`, payload);
      console.log('✅ Autoveicolo reactivated successfully:', response.data);
      return (response.data as ApiResponse<Autoveicolo>).data;
    } catch (error) {
      console.error(`❌ Error reactivating autoveicolo ${id}:`, error);
      throw error;
    }
  },

  // Funzione per getScadenze (compatibile con l'uso esistente)
  async getScadenze(): Promise<any> {
    console.log('⏰ Getting all scadenze');
    
    try {
      const response = await api.get('/autoveicoli/scadenze/all');
      console.log('✅ Scadenze fetched successfully:', response.data);
      return (response.data as ApiResponse).data;
    } catch (error) {
      console.error('❌ Error fetching scadenze:', error);
      throw error;
    }
  },

  // FUNZIONI AGGIUNTIVE

  // Ottieni autoveicoli con Pass ZTL
  async getWithPassZTL(): Promise<Autoveicolo[]> {
    console.log('🚗 Fetching autoveicoli with Pass ZTL');
    
    try {
      const response = await this.getAll({ passZTL: true, stato: 'Attivo' });
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching autoveicoli with Pass ZTL:', error);
      throw error;
    }
  },

  // Ottieni autoveicoli esenti dal bollo
  async getEsentiBollo(): Promise<Autoveicolo[]> {
    console.log('💰 Fetching autoveicoli esenti dal bollo');
    
    try {
      const response = await this.getAll({ esenteBollo: true, stato: 'Attivo' });
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching autoveicoli esenti dal bollo:', error);
      throw error;
    }
  },

  // Ottieni autoveicoli con autorizzazioni rifiuti
  async getWithAutRifiuti(): Promise<Autoveicolo[]> {
    console.log('♻️ Fetching autoveicoli with autorizzazioni rifiuti');
    
    try {
      const response = await this.getAll({ conAutRifiuti: true, stato: 'Attivo' });
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching autoveicoli with aut rifiuti:', error);
      throw error;
    }
  },

  // Duplica autoveicolo (utile per veicoli simili)
  async duplicate(id: string, modifiche?: Partial<AutoveicoloData>): Promise<Autoveicolo> {
    console.log(`📋 Duplicating autoveicolo ${id} with modifications:`, modifiche);
    
    try {
      const payload = {
        ...modifiche
      };

      const response = await api.post(`/autoveicoli/${id}/duplicate`, payload);
      console.log('✅ Autoveicolo duplicated successfully:', response.data);
      return (response.data as ApiResponse<Autoveicolo>).data;
    } catch (error) {
      console.error(`❌ Error duplicating autoveicolo ${id}:`, error);
      throw error;
    }
  }
};

export default autoveicoliService;