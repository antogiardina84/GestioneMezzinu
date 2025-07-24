// src/services/usersService.ts
import api from './api';

export interface User {
  _id: string;
  nome: string;
  cognome: string;
  email: string;
  ruolo: 'admin' | 'user';
  attivo: boolean;
  ultimoAccesso?: Date | string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface CreateUserData {
  nome: string;
  cognome: string;
  email: string;
  password: string;
  ruolo: 'admin' | 'user';
}

export interface UpdateUserData {
  nome?: string;
  cognome?: string;
  email?: string;
  ruolo?: 'admin' | 'user';
  attivo?: boolean;
}

export interface UsersStatistics {
  totals: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    adminUsers: number;
    regularUsers: number;
  };
  usersByMonth: Array<{
    _id: { year: number; month: number };
    count: number;
  }>;
  recentUsers: User[];
}

export interface UsersResponse {
  success: boolean;
  count: number;
  pagination?: {
    next?: { page: number; limit: number };
    prev?: { page: number; limit: number };
  };
  data: User[];
}

export const usersService = {
  // Get all users with filtering and pagination
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    ruolo?: string;
    attivo?: boolean;
    sort?: string;
  }): Promise<UsersResponse> => {
    console.log('🔍 Fetching users with params:', params);
    
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.ruolo) searchParams.append('ruolo', params.ruolo);
    if (params?.attivo !== undefined) searchParams.append('attivo', params.attivo.toString());
    if (params?.sort) searchParams.append('sort', params.sort);

    try {
      const response = await api.get(`/users?${searchParams.toString()}`);
      console.log('✅ Users fetched successfully:', response.data);
      return response.data as UsersResponse;
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      throw error;
    }
  },

  // Get single user by ID
  getById: async (id: string): Promise<{ success: boolean; data: User }> => {
    console.log('🔍 Fetching user by ID:', id);
    
    try {
      const response = await api.get(`/users/${id}`);
      console.log('✅ User fetched successfully:', response.data);
      return response.data as { success: boolean; data: User };
    } catch (error) {
      console.error('❌ Error fetching user:', error);
      throw error;
    }
  },

  // Create new user
  create: async (userData: CreateUserData): Promise<{ success: boolean; data: User }> => {
    console.log('➕ Creating new user:', userData);
    
    try {
      const response = await api.post('/users', userData);
      console.log('✅ User created successfully:', response.data);
      return response.data as { success: boolean; data: User };
    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw error;
    }
  },

  // Update user
  update: async (id: string, userData: UpdateUserData): Promise<{ success: boolean; data: User }> => {
    console.log('🔄 Updating user:', id, userData);
    
    try {
      const response = await api.put(`/users/${id}`, userData);
      console.log('✅ User updated successfully:', response.data);
      return response.data as { success: boolean; data: User };
    } catch (error) {
      console.error('❌ Error updating user:', error);
      throw error;
    }
  },

  // Update user password
  updatePassword: async (id: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    console.log('🔐 Updating user password for ID:', id);
    
    try {
      const response = await api.put(`/users/${id}/password`, { newPassword });
      console.log('✅ Password updated successfully:', response.data);
      return response.data as { success: boolean; message: string };
    } catch (error) {
      console.error('❌ Error updating password:', error);
      throw error;
    }
  },

  // Delete user
  delete: async (id: string): Promise<{ success: boolean; data: {} }> => {
    console.log('🗑️ Deleting user:', id);
    
    try {
      const response = await api.delete(`/users/${id}`);
      console.log('✅ User deleted successfully:', response.data);
      return response.data as { success: boolean; data: {} };
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      throw error;
    }
  },

  // Toggle user active status
  toggleStatus: async (id: string): Promise<{ success: boolean; data: User }> => {
    console.log('🔄 Toggling user status:', id);
    
    try {
      const response = await api.put(`/users/${id}/toggle-status`);
      console.log('✅ User status toggled successfully:', response.data);
      return response.data as { success: boolean; data: User };
    } catch (error) {
      console.error('❌ Error toggling user status:', error);
      throw error;
    }
  },

  // Get users statistics
  getStatistics: async (): Promise<{ success: boolean; data: UsersStatistics }> => {
    console.log('📊 Fetching users statistics');
    
    try {
      const response = await api.get('/users/statistics');
      console.log('✅ Statistics fetched successfully:', response.data);
      return response.data as { success: boolean; data: UsersStatistics };
    } catch (error) {
      console.error('❌ Error fetching statistics:', error);
      throw error;
    }
  }
};