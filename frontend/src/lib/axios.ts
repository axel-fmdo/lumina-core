import axios from 'axios';

// Creamos una instancia base
const api = axios.create({
  //baseURL: 'http://localhost:8000', // URL de tu backend
  baseURL: 'http://192.168.0.190:8000', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor (Lo usaremos más adelante para inyectar el Token automáticamente)
// Por ahora lo dejamos listo.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;