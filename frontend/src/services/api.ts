import axios from 'axios';

// Ottieni URL API dall'env e aggiungi /api
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5555';
const API_URL = `${BASE_URL}/api`;

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
  withCredentials: false
});

// Interceptor per le richieste
api.interceptors.request.use(
  (config) => {
    console.log(`📤 Request [${config.method?.toUpperCase()}] ${config.url}`, config.data || '');
    const token = localStorage.getItem('token');
    
    if (token && config.headers) {
      console.log('Utilizzo token:', token.substring(0, 20) + '...');
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('📛 Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor per le risposte
api.interceptors.response.use(
  (response) => {
    console.log(`📥 Response [${response.status}] ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error('📛 API Error:', error.response?.status, error.response?.data || error.message);
    
    if (!error.response) {
      console.error('❌ Network Error - Impossibile connettersi al server:', API_URL);
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