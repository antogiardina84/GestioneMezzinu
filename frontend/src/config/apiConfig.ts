// src/config/apiConfig.ts - Configurazione API CORRETTA
export const API_CONFIG = {
  // URL base dell'API
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5555',
  
  // Timeout per le richieste
  timeout: 30000,
  
  // Headers di default
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
  
  // Endpoints
  endpoints: {
    auth: '/api/auth',
    autoveicoli: '/api/autoveicoli',
    alboGestori: '/api/albo-gestori',
    ren: '/api/ren',
    dashboard: '/api/dashboard',
    uploads: '/uploads'
  },
  
  // Configurazione per file upload
  fileUpload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'image/jpeg', 
      'image/png', 
      'image/gif',
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
      'application/vnd.ms-excel', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'text/plain'
    ]
  }
};

// Funzione helper per costruire URL completi API
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = API_CONFIG.baseURL.replace(/\/$/, ''); // Rimuovi trailing slash
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

// Funzione helper per costruire URL dei file - VERSIONE CORRETTA
export const buildFileUrl = (filePath: string): string => {
  if (!filePath) return '';
  
  // Se è già un URL completo, ritornalo così com'è
  if (filePath.startsWith('http')) {
    return filePath;
  }
  
  // Normalizza il percorso
  let normalizedPath = filePath.replace(/\\/g, '/');
  
  // Assicurati che inizi con 'uploads/'
  if (!normalizedPath.startsWith('uploads/')) {
    const uploadsIndex = normalizedPath.indexOf('uploads/');
    if (uploadsIndex >= 0) {
      normalizedPath = normalizedPath.substring(uploadsIndex);
    } else {
      normalizedPath = `uploads/${normalizedPath}`;
    }
  }
  
  // IMPORTANTE: Per i file statici NON usare /api/
  const baseUrl = API_CONFIG.baseURL.replace(/\/$/, '');
  return `${baseUrl}/${normalizedPath}`;
};

// Funzione per verificare se un file esiste
export const checkFileExists = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      mode: 'cors'
    });
    return response.ok;
  } catch (error) {
    console.error('Errore verifica esistenza file:', error);
    return false;
  }
};

// Configurazione per development/production
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';

// Log di debug solo in development
export const debugLog = (...args: any[]) => {
  if (isDevelopment) {
    console.log('[API Config]', ...args);
  }
};

export default API_CONFIG;