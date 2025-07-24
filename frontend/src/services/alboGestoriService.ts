// src/services/alboGestoriService.ts (versione finale corretta)
import api from './api';
import { AlboGestori } from '../types/AlboGestori';

interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  count?: number;
  pagination?: {
    next?: { page: number; limit: number };
    prev?: { page: number; limit: number };
  };
  message?: string;
  error?: string;
}

interface ListResponse<T> {
  success: boolean;
  count: number;
  pagination?: {
    next?: { page: number; limit: number };
    prev?: { page: number; limit: number };
  };
  data: T[];
}

// Definisco l'oggetto di servizio
export const alboGestoriService = {
  async getAll(params?: Record<string, any>): Promise<ListResponse<AlboGestori>> {
    const response = await api.get('/albo-gestori', { params });
    return response.data as ListResponse<AlboGestori>;
  },

  async getById(id: string): Promise<AlboGestori> {
    const response = await api.get(`/albo-gestori/${id}`);
    const apiResponse = response.data as ApiResponse<AlboGestori>;
    return apiResponse.data;
  },

  async create(data: Partial<AlboGestori>): Promise<AlboGestori> {
    const response = await api.post('/albo-gestori', data);
    const apiResponse = response.data as ApiResponse<AlboGestori>;
    return apiResponse.data;
  },

  async update(id: string, data: Partial<AlboGestori>): Promise<AlboGestori> {
    const response = await api.put(`/albo-gestori/${id}`, data);
    const apiResponse = response.data as ApiResponse<AlboGestori>;
    return apiResponse.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/albo-gestori/${id}`);
  },

  async uploadAllegati(id: string, files: FileList, tipo: string): Promise<any> {
    try {
      console.log(`Caricamento allegati per Albo Gestori ${id}, tipo: ${tipo}, numero file: ${files.length}`);
      
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

      const response = await api.post(`/albo-gestori/${id}/allegati`, formData, {
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
      console.log(`Eliminazione allegato ${allegatoId} dall'Albo Gestori ${id}`);
      await api.delete(`/albo-gestori/${id}/allegati/${allegatoId}`);
      console.log('Allegato eliminato con successo');
    } catch (error) {
      console.error('Errore eliminazione allegato:', error);
      throw error;
    }
  },

  async getScadenze(): Promise<any> {
    const response = await api.get('/albo-gestori/scadenze/all');
    const apiResponse = response.data as ApiResponse;
    return apiResponse.data;
  },
};