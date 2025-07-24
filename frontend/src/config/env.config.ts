// src/config/envConfig.ts

interface EnvConfig {
  API_URL: string;
  API_TIMEOUT: number;
  ENVIRONMENT: 'development' | 'production' | 'test';
}

const getConfig = (): EnvConfig => {
  // Determina l'ambiente corrente
  const env = process.env.NODE_ENV || 'development';
  
  // Configurazione di base
  let config: EnvConfig = {
    API_URL: process.env.REACT_APP_API_URL || 'http://localhost:5555/api',
    API_TIMEOUT: parseInt(process.env.REACT_APP_API_TIMEOUT || '30000', 10),
    ENVIRONMENT: env as 'development' | 'production' | 'test'
  };

  // Override per ambienti specifici
  if (env === 'development') {
    // In sviluppo, usa l'API locale
    config.API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5555/api';
  } else if (env === 'production') {
    // In produzione, dovrebbe essere configurato tramite variabili d'ambiente
    config.API_URL = process.env.REACT_APP_API_URL || '/api';
  }

  // Log della configurazione in development
  if (env === 'development') {
    console.log('🔧 Environment Configuration:', {
      environment: config.ENVIRONMENT,
      apiUrl: config.API_URL,
      timeout: config.API_TIMEOUT
    });
  }

  return config;
};

// Esporta la configurazione
export const envConfig = getConfig();

// Esporta anche singoli valori per comodità
export const API_URL = envConfig.API_URL;
export const API_TIMEOUT = envConfig.API_TIMEOUT;
export const ENVIRONMENT = envConfig.ENVIRONMENT;

// Helper per verificare l'ambiente
export const isDevelopment = () => envConfig.ENVIRONMENT === 'development';
export const isProduction = () => envConfig.ENVIRONMENT === 'production';
export const isTest = () => envConfig.ENVIRONMENT === 'test';