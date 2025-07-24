import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '../types/User';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          console.log('Token trovato, recupero dati utente...');
          try {
            const userData = await authService.getProfile();
            setUser(userData);
            console.log('Utente autenticato:', userData.email);
          } catch (profileError) {
            console.error('Errore nel recupero profilo:', profileError);
            localStorage.removeItem('token');
          }
        } else {
          console.log('Nessun token trovato, utente non autenticato');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('Tentativo di login per:', email);
      
      try {
        // Test di connessione, ma omettiamo in caso di errore
        await authService.testConnection();
      } catch (testError) {
        console.log('Test di connessione fallito, ma procedo con il login');
      }
      
      const response = await authService.login({ email, password });
      
      console.log('Risposta login:', response);
      
      if (response.success) {
        setUser(response.user);
        console.log('Login riuscito, utente impostato:', response.user);
        
        // Verifica il token
        const token = localStorage.getItem('token');
        console.log('Token salvato:', token ? 'Presente' : 'Assente');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Log dettagliato
      const err = error as any;
      if (err.response) {
        console.error('Dettagli errore:', {
          status: err.response.status,
          data: err.response.data,
          headers: err.response.headers
        });
      }
      
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await authService.register(userData);
      if (response.success) {
        setUser(response.user);
      }
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    register,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};