import api from './api';
import { DashboardData } from '../types/Dashboard';

export const dashboardService = {
  async getDashboardData(): Promise<DashboardData> {
    const response = await api.get('/dashboard');
    return (response.data as any).data;
  },

  async getStatistics(): Promise<any> {
    const response = await api.get('/dashboard/statistics');
    return (response.data as any).data;
  },
};