// src/services/axiosConfig.ts
import axios from 'axios';

// Configurazione base per axios
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5555/api',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor per le richieste
axiosInstance.interceptors.request.use(
  (config) => {
    console.log('🔄 Axios Request:', config.method?.toUpperCase(), config.url);

    // Aggiungi token se presente
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error('❌ Axios Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor per le risposte
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('✅ Axios Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ Axios Response Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
    });

    // Gestione errore 401 (non autorizzato)
    if (error.response?.status === 401) {
      console.warn('🔒 Token scaduto, reindirizzamento al login');
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;