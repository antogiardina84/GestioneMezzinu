// frontend/src/services/serviziService.ts
import api from './api';
import { Servizio, ServizioFilters, ServizioCalendario, ServizioStatistiche, ServizioConflitto } from '../types/Servizio';

interface ListResponse<T> {
  success: boolean;
  count: number;
  total: number;
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
  conflitti?: ServizioConflitto[];
}

interface CalendarioResponse {
  success: boolean;
  periodo: {
    tipo: string;
    dataInizio: Date;
    dataFine: Date;
  };
  count: number;
  data: Record<string, Servizio[]>;
}

interface ConflittiResponse {
  success: boolean;
  count: number;
  conflitti: boolean;
  data: ServizioConflitto[];
}

export const serviziService = {
  // Ottieni tutti i servizi con filtri
  async getAll(filters?: ServizioFilters): Promise<ListResponse<Servizio>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await api.get<ListResponse<Servizio>>(`/servizi?${params.toString()}`);
    return response.data;
  },

  // Ottieni un singolo servizio
  async getById(id: string): Promise<ApiResponse<Servizio>> {
    const response = await api.get<ApiResponse<Servizio>>(`/servizi/${id}`);
    return response.data;
  },

  // Crea un nuovo servizio
  async create(servizio: Partial<Servizio>): Promise<ApiResponse<Servizio>> {
    const response = await api.post<ApiResponse<Servizio>>('/servizi', servizio);
    return response.data;
  },

  // Aggiorna un servizio
  async update(id: string, servizio: Partial<Servizio>): Promise<ApiResponse<Servizio>> {
    const response = await api.put<ApiResponse<Servizio>>(`/servizi/${id}`, servizio);
    return response.data;
  },

  // Elimina un servizio
  async delete(id: string): Promise<ApiResponse> {
    const response = await api.delete<ApiResponse>(`/servizi/${id}`);
    return response.data;
  },

  // Carica allegati
  async uploadAllegati(id: string, files: FileList, tipo: string): Promise<ApiResponse<Servizio>> {
    const formData = new FormData();
    
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });
    formData.append('tipo', tipo);
    
    const response = await api.post<ApiResponse<Servizio>>(
      `/servizi/${id}/allegati`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Elimina allegato
  async deleteAllegato(id: string, allegatoId: string): Promise<ApiResponse<Servizio>> {
    const response = await api.delete<ApiResponse<Servizio>>(`/servizi/${id}/allegati/${allegatoId}`);
    return response.data;
  },

  // Ottieni servizi calendario
  async getCalendario(tipo: 'mese' | 'settimana' | 'giorno', data?: string): Promise<CalendarioResponse> {
    const params = data ? `?data=${data}` : '';
    const response = await api.get<CalendarioResponse>(`/servizi/calendario/${tipo}${params}`);
    return response.data;
  },

  // Ottieni statistiche
  async getStatistiche(anno?: number): Promise<ApiResponse<ServizioStatistiche>> {
    const params = anno ? `?anno=${anno}` : '';
    const response = await api.get<ApiResponse<ServizioStatistiche>>(`/servizi/statistiche${params}`);
    return response.data;
  },

  // Verifica conflitti
  async verificaConflitti(data: {
    autoveicolo?: string;
    autista?: string;
    dataInizio: string;
    dataFine: string;
    servizioId?: string;
  }): Promise<ConflittiResponse> {
    const response = await api.post<ConflittiResponse>('/servizi/verifica-conflitti', data);
    return response.data;
  },

  // Genera servizi ricorrenti
  async generaServiziRicorrenti(id: string, numeroOccorrenze?: number): Promise<ApiResponse<Servizio[]>> {
    const response = await api.post<ApiResponse<Servizio[]>>(
      `/servizi/${id}/genera-ricorrenti`,
      { numeroOccorrenze }
    );
    return response.data;
  }
};

export default serviziService;