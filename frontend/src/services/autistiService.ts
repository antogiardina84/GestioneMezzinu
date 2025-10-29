// frontend/src/services/autistiService.ts
import api from './api';
import { Autista, AutistaFormData, AutistaListItem, AutistaStats } from '../types/Autista';

export interface AutistiResponse {
  success: boolean;
  count: number;
  total: number;
  pagination?: {
    next?: { page: number; limit: number };
    prev?: { page: number; limit: number };
  };
  data: Autista[];
}

export interface AutistaResponse {
  success: boolean;
  data: Autista;
}

export interface ListaSempliceResponse {
  success: boolean;
  count: number;
  data: AutistaListItem[];
}

export interface StatsResponse {
  success: boolean;
  data: AutistaStats;
}

class AutistiService {
  // Get tutti gli autisti con paginazione e filtri
  async getAll(params?: {
    page?: number;
    limit?: number;
    stato?: string;
    attivo?: boolean;
    search?: string;
    veicoloId?: string;
    giorno?: number;
  }): Promise<AutistiResponse> {
    const response = await api.get<AutistiResponse>('/autisti', { params });
    return response.data;
  }

  // Get singolo autista
  async getById(id: string): Promise<Autista> {
    const response = await api.get<AutistaResponse>(`/autisti/${id}`);
    return response.data.data;
  }

  // Crea nuovo autista
  async create(data: AutistaFormData): Promise<Autista> {
    const response = await api.post<AutistaResponse>('/autisti', data);
    return response.data.data;
  }

  // Aggiorna autista
  async update(id: string, data: Partial<AutistaFormData>): Promise<Autista> {
    const response = await api.put<AutistaResponse>(`/autisti/${id}`, data);
    return response.data.data;
  }

  // Elimina autista (soft delete)
  async delete(id: string): Promise<void> {
    await api.delete(`/autisti/${id}`);
  }

  // Get lista semplice per dropdown
  async getListaSemplice(): Promise<AutistaListItem[]> {
    const response = await api.get<ListaSempliceResponse>('/autisti/lista-semplice');
    return response.data.data;
  }

  // Get autisti disponibili per giorno/veicolo
  async getDisponibili(giorno: number, veicoloId?: string): Promise<AutistaListItem[]> {
    const params: any = { giorno };
    if (veicoloId) params.veicoloId = veicoloId;
    
    const response = await api.get<ListaSempliceResponse>('/autisti/disponibili', { params });
    return response.data.data;
  }

  // Get scadenze patenti
  async getScadenzePatenti(giorni: number = 30): Promise<any> {
    const response = await api.get('/autisti/scadenze/patenti', { 
      params: { giorni } 
    });
    return response.data;
  }

  // Get scadenze qualifiche
  async getScadenzeQualifiche(giorni: number = 30): Promise<any> {
    const response = await api.get('/autisti/scadenze/qualifiche', { 
      params: { giorni } 
    });
    return response.data;
  }

  // Get statistiche
  async getStatistiche(): Promise<AutistaStats> {
    const response = await api.get<StatsResponse>('/autisti/stats');
    return response.data.data;
  }

  // Upload allegato
  async uploadAllegato(
    autistaId: string, 
    file: File, 
    tipo: string,
    dataScadenza?: string
  ): Promise<Autista> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tipo', tipo);
    if (dataScadenza) formData.append('dataScadenza', dataScadenza);

    const response = await api.post<AutistaResponse>(
      `/autisti/${autistaId}/allegati`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  }

  // Elimina allegato
  async deleteAllegato(autistaId: string, allegatoId: string): Promise<void> {
    await api.delete(`/autisti/${autistaId}/allegati/${allegatoId}`);
  }
}

export const autistiService = new AutistiService();
export default autistiService;