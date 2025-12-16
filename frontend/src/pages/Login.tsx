import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Mail, Loader2, ArrowRight } from "lucide-react";
import { useState } from "react";
import api from "../lib/axios";
import { setToken, fetchUserProfile } from "../redux/slices/authSlice";
import { AppDispatch } from "../redux/store";

// 1. Esquema de Validación con Zod
const loginSchema = z.object({
  email: z.string().email("El correo no es válido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

type LoginForm = z.infer<typeof loginSchema>;

export const Login = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new URLSearchParams();
      formData.append('username', data.email);
      formData.append('password', data.password);

      const response = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      if(response.data){
        const token = response.data.access_token;
        dispatch(setToken(token)); // Se guarda el token en Redux
        const userProfile = await dispatch(fetchUserProfile()).unwrap(); //Se obtiene el perfil del usuario
        
        if(userProfile){
            navigate("/"); // Se redirige al Dashboard
        }
      }

    } catch (err: any) {
        console.error("Login Error:", err);
        // Manejo específico de errores de login
        if (err.response) {
            const { status, data } = err.response;
            
            if (status === 401) {
            // Error de credenciales incorrectas
            setError(data?.detail || "Credenciales incorrectas");
            } else if (status === 400) {
            // Usuario inactivo u otro error de validación
            setError(data?.detail || "Usuario inactivo o datos incorrectos");
            } else {
            // Otros errores del servidor
            setError("Error al iniciar sesión. Intenta nuevamente.");
            }
        } else if (err.request) {
            // Error de conexión
            setError("No se pudo conectar con el servidor");
        } else {
            // Error desconocido
            setError("Ocurrió un error inesperado");
        }
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-lumina-bg relative overflow-hidden">
        {/* Fondo Decorativo */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-lumina-primary/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-lumina-accent/20 rounded-full blur-[100px]" />

        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md p-8 glass-panel rounded-2xl relative z-10"
        >
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Bienvenido</h1>
                <p className="text-lumina-muted">Ingresa a Lumina Asset Manager</p>
            </div>

            {/* Mensaje de Error */}
            {error && (
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm text-center"
            >
                {error}
            </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Email Input */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-lumina-muted">Correo Electrónico</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-lumina-muted" />
                        <input 
                            {...register("email")}
                            type="email" 
                            className="w-full bg-lumina-bg/50 border border-lumina-border rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-lumina-primary/50 focus:border-transparent outline-none transition-all"
                            placeholder="Ingresa tu correo"
                        />
                    </div>
                    {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-lumina-muted">Contraseña</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-lumina-muted" />
                        <input 
                            {...register("password")}
                            type="password" 
                            className="w-full bg-lumina-bg/50 border border-lumina-border rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-lumina-primary/50 focus:border-transparent outline-none transition-all"
                            placeholder="Ingresa tu constraseña"
                        />
                    </div>
                    {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
                </div>

                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-lumina-primary to-lumina-accent hover:opacity-90 text-white font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            Iniciar Sesión <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </form>
        </motion.div>
    </div>
  );
};