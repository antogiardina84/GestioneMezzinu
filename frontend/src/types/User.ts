// src/types/User.ts
export interface User {
  _id: string;
  id?: string; // Aggiungiamo id opzionale per compatibilità
  nome: string;
  cognome: string;
  email: string;
  ruolo: 'user' | 'admin';
  attivo: boolean;
  ultimoAccesso?: Date;
  createdAt: Date;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}