import axios from 'axios';

// Ottieni URL API dall'env o usa default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5555/api';

console.log('===============================');
console.log('API URL configurato:', API_URL);
console.log('Environment Variables:', process.env);
console.log('===============================');

// Crea un'istanza di axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Disabilita withCredentials poiché stiamo usando Authorization header
  withCredentials: false
});

// Interceptor per gestire path errati
api.interceptors.request.use(
  (config) => {
    // Correggi il percorso dei test: da /api/test a /test
    if (config.url === '/api/test') {
      console.log('Correzione percorso da /api/test a /test');
      config.url = '/test';
    }
    
    console.log(`📤 Request [${config.method?.toUpperCase()}] ${config.url}`, config.data || '');
    const token = localStorage.getItem('token');
    
    if (token && config.headers) {
      console.log('Utilizzo token:', token.substring(0, 10) + '...');
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('📛 Request Error:', error);
    return Promise.reject(error);
  }
);

// Aggiungi log dettagliati alle risposte
api.interceptors.response.use(
  (response) => {
    console.log(`📥 Response [${response.status}] ${response.config.url}`, response.data || '');
    return response;
  },
  (error) => {
    console.error('📛 API Error:', error.response?.status, error.response?.data || error.message);
    
    // Log dettagliato per errori di connessione
    if (!error.response) {
      console.error('❌ Network Error - Impossibile connettersi al server:', API_URL);
      console.error('Dettagli errore:', error);
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;