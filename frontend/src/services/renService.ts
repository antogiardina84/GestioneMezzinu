// src/services/renService.ts (versione finale corretta)
import api from './api';
import { REN } from '../types/REN';

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

// Definisco l'oggetto di servizio
export const renService = {
  async getAll(params?: Record<string, any>): Promise<ListResponse<REN>> {
    const response = await api.get('/ren', { params });
    return response.data as ListResponse<REN>;
  },

  async getById(id: string): Promise<REN> {
    const response = await api.get(`/ren/${id}`);
    return (response.data as ApiResponse<REN>).data;
  },

  async create(data: Partial<REN>): Promise<REN> {
    console.log('Creating REN with data:', data);
    const response = await api.post('/ren', data);
    console.log('Response after create:', response.data);
    return (response.data as ApiResponse<REN>).data;
  },

  async update(id: string, data: Partial<REN>): Promise<REN> {
    console.log(`Updating REN ${id} with data:`, data);
    const response = await api.put(`/ren/${id}`, data);
    console.log('Response after update:', response.data);
    return (response.data as ApiResponse<REN>).data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/ren/${id}`);
  },

  async uploadAllegati(id: string, files: FileList, tipo: string): Promise<any> {
    try {
      console.log(`Caricamento allegati per REN ${id}, tipo: ${tipo}, numero file: ${files.length}`);
      
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      formData.append('tipo', tipo);
      
      // Log dei dati formData senza usare entries() che causa l'errore
      console.log('FormData creato con i seguenti file:');
      console.log(`tipo: ${tipo}`);
      console.log(`Numero di file: ${files.length}`);
      
      // Log dei file senza iterare su formData.entries()
      Array.from(files).forEach((file, index) => {
        console.log(`File ${index + 1}: ${file.name} (${file.size} bytes, ${file.type})`);
      });

      const response = await api.post(`/ren/${id}/allegati`, formData, {
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
      console.log(`Eliminazione allegato ${allegatoId} dal REN ${id}`);
      await api.delete(`/ren/${id}/allegati/${allegatoId}`);
      console.log('Allegato eliminato con successo');
    } catch (error) {
      console.error('Errore eliminazione allegato:', error);
      throw error;
    }
  },

  async getScadenze(): Promise<any> {
    const response = await api.get('/ren/scadenze/all');
    return (response.data as ApiResponse).data;
  },

  async getProvince(regione: string): Promise<{ success: boolean; data: string[] }> {
    console.log(`Fetching provinces for region ${regione}`);
    const response = await api.get(`/ren/province/${regione}`);
    console.log('Province response:', response.data);
    return response.data as { success: boolean; data: string[] };
  },
};