import axios from 'axios';
import { toast } from 'sonner';

// Creamos una instancia base
const api = axios.create({
  //baseURL: 'http://localhost:8000', // URL de tu backend
  baseURL: 'http://192.168.0.190:8000', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para el Token al hacer Login o refrescar
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de los mensajes de respuesta del backend
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- NUEVO: Interceptor de Response (Manejo de Mensajes) ---
api.interceptors.response.use(
    (response) => {
        // Se busca el header personalizado (Axios los pone en minúsculas)
        const successMessage = response.headers['x-process-message'];
        
        // Si existe, lanzamos Toast de Éxito
        if (successMessage) {
            // Decodificamos por si vienen caracteres especiales (acentos)
            try {
                toast.success(decodeURIComponent(escape(successMessage)));
            } catch (e) {
                toast.success(successMessage);
            }
        }
        
        return response;
    },
    (error) => {
        // Manejo de Errores
        if (error.response) {
        const { status, data } = error.response;
        const errorMessage = data?.detail || "Ocurrió un error inesperado";

        // Personalización por el tipo de error
        if (status === 401) {
            toast.error("Sesión expirada", { description: "Por favor inicia sesión nuevamente." });
            localStorage.removeItem('token');
            window.location.href = "/login";
            return Promise.reject(error);
        } else if (status === 403 || status === 409) {
            toast.warning("Atención", { description: errorMessage });
        } else if (status >= 500) {
            toast.error("Error de Servidor", { description: "Consulta con el administrador." });
        } else {
            // Errores de validación (400, 404, 422)
            // Si es un array de errores (Pydantic a veces), lo formateamos
            if (Array.isArray(errorMessage)) {
                toast.error("Error de Validación", { description: errorMessage[0].msg });
            } else {
                toast.error("Error", { description: errorMessage });
            }
        }
        } else {
        toast.error("Error de Conexión", { description: "No se pudo contactar al servidor." });
        }
        
        return Promise.reject(error);
    }
);

export default api;