import axios from 'axios';
import { toast } from 'sonner';

// Generación de la instancia base
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
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

// Interceptor de Response (Manejo de Mensajes)
api.interceptors.response.use(
    (response) => {
        // Se busca el header personalizado
        const successMessage = response.headers['x-process-message'];
        
        // Si existe, se muestra mensaje de éxito
        if (successMessage) {
            // Se decodifica en caso de que lleguen caracteres especiales
            try {
                toast.success(decodeURIComponent(escape(successMessage)));
            } catch (e) {
                toast.success(successMessage);
            }
        }
        
        return response;
    },
    (error) => {
      const isLoginError = error.config?.url?.includes('/auth/login');

      // Manejo de Errores
      if (error.response) {
        const { status, data } = error.response;
        const errorMessage = data?.detail || "Ocurrió un error inesperado";

        if(isLoginError && status === 401) {
          return Promise.reject(error);
        }

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