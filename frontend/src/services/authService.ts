import api from './api';
import { LoginCredentials, LoginResponse, User } from '../types/User';

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      console.log(`Tentativo di login per: ${credentials.email}`);
      const response = await api.post('/auth/login', credentials);
      
      console.log('Risposta login completa:', response.data);
      
      // Usa un'asserzione di tipo più esplicita per la risposta
      const responseData = response.data as any;
      
      // Estrai token e user dalla risposta
      const success = responseData.success;
      const token = responseData.token;
      const user = responseData.user;
      
      if (token) {
        localStorage.setItem('token', token);
        console.log('Token salvato con successo:', token.substring(0, 10) + '...');
      } else {
        console.error('Nessun token trovato nella risposta:', responseData);
      }
      
      // Costruisci manualmente l'oggetto di risposta
      return {
        success: success || false,
        token: token || '',
        user: user || null
      };
    } catch (error) {
      console.error('Login error dettagliato:', error);
      throw error;
    }
  },

  async logout(): Promise<void> {
    try {
      await api.get('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
    }
  },

  async getProfile(): Promise<User> {
    try {
      const response = await api.get('/auth/me');
      // Usa asserzione di tipo per response.data
      const responseData = response.data as any;
      return responseData.data;
    } catch (error) {
      console.error('Errore recupero profilo:', error);
      throw error;
    }
  },

  async register(userData: {
    nome: string;
    cognome: string;
    email: string;
    password: string;
    ruolo?: 'user' | 'admin';
  }): Promise<LoginResponse> {
    const response = await api.post('/auth/register', userData);
    // Usa asserzione di tipo
    return response.data as LoginResponse;
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  // Corretto il percorso per il test di connessione
  async testConnection(): Promise<boolean> {
    try {
      // Usa /test invece di /api/test
      const response = await api.get('/test');
      console.log('Test di connessione al backend OK:', response.data);
      return true;
    } catch (error) {
      console.error('Test di connessione al backend fallito:', error);
      return false;
    }
  }
};