// frontend/src/services/manutenzioniService.ts - VERSIONE COMPLETA CON FILTRO AUTOVEICOLO
import api from './api';
import { Manutenzione, ManutenzioneFilters, ManutenzioneScadenze, ManutenzioneStatistiche } from '../types/Manutenzione';

interface ListResponse<T> {
  success: boolean;
  count: number;
  total: number;
  pagination: {
    next?: { page: number; limit: number };
    prev?: { page: number; limit: number };
  };
  data: T[];
}

// ============================================
// NUOVA INTERFACCIA PER I PARAMETRI STATISTICHE
// ============================================
interface StatisticheParams {
  anno?: number;
  autoveicolo?: string; // NUOVO: Parametro per filtrare per mezzo
}

export const manutenzioniService = {
  // ============================================
  // TUTTE LE FUNZIONI ESISTENTI RIMANGONO INVARIATE
  // ============================================
  
  async getAll(params?: ManutenzioneFilters): Promise<ListResponse<Manutenzione>> {
    const response = await api.get('/manutenzioni', { params });
    return response.data as ListResponse<Manutenzione>;
  },

  async getById(id: string): Promise<Manutenzione> {
    const response = await api.get(`/manutenzioni/${id}`);
    return (response.data as any).data;
  },

  async create(data: Partial<Manutenzione>): Promise<Manutenzione> {
    const response = await api.post('/manutenzioni', data);
    return (response.data as any).data;
  },

  async update(id: string, data: Partial<Manutenzione>): Promise<Manutenzione> {
    const response = await api.put(`/manutenzioni/${id}`, data);
    return (response.data as any).data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/manutenzioni/${id}`);
  },

  async uploadAllegati(id: string, files: FileList, tipo: string): Promise<any> {
    try {
      console.log(`Caricamento allegati per manutenzione ${id}, tipo: ${tipo}, numero file: ${files.length}`);
      
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      formData.append('tipo', tipo);
      
      console.log('FormData creato con i seguenti file:');
      console.log(`tipo: ${tipo}`);
      console.log(`Numero di file: ${files.length}`);
      
      Array.from(files).forEach((file, index) => {
        console.log(`File ${index + 1}: ${file.name} (${file.size} bytes, ${file.type})`);
      });
      
      const response = await api.post(`/manutenzioni/${id}/allegati`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Risposta caricamento allegati:', response.data);
      return response.data;
    } catch (error) {
      console.error('Errore caricamento allegati:', error);
      throw error;
    }
  },

  async deleteAllegato(id: string, allegatoId: string): Promise<void> {
    try {
      console.log(`Eliminazione allegato ${allegatoId} dalla manutenzione ${id}`);
      await api.delete(`/manutenzioni/${id}/allegati/${allegatoId}`);
      console.log('Allegato eliminato con successo');
    } catch (error) {
      console.error('Errore eliminazione allegato:', error);
      throw error;
    }
  },

  async getScadenze(): Promise<ManutenzioneScadenze> {
    const response = await api.get('/manutenzioni/scadenze');
    return (response.data as any).data;
  },

  // ============================================
  // QUESTA È LA FUNZIONE MODIFICATA
  // ============================================
  async getStatistiche(params: StatisticheParams = {}): Promise<ManutenzioneStatistiche> {
    // Costruisci i query parameters
    const queryParams = new URLSearchParams();
    
    // Aggiungi anno se presente
    if (params.anno) {
      queryParams.append('anno', params.anno.toString());
    }
    
    // NUOVO: Aggiungi autoveicolo se presente
    if (params.autoveicolo) {
      queryParams.append('autoveicolo', params.autoveicolo);
    }
    
    // Costruisci l'URL con i parametri
    const queryString = queryParams.toString();
    const url = `/manutenzioni/statistiche${queryString ? `?${queryString}` : ''}`;
    
    console.log('Richiesta statistiche con URL:', url);
    
    const response = await api.get(url);
    return (response.data as any).data;
  }
};