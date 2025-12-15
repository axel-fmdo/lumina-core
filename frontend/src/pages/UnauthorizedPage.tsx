// pages/UnauthorizedPage.tsx
import { useNavigate } from "react-router-dom";
import { ShieldX, Home, ArrowLeft } from "lucide-react";

export const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-lumina-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Icono */}
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center">
            <ShieldX className="w-12 h-12 text-red-500" />
          </div>
        </div>

        {/* Código de error */}
        <h1 className="text-8xl font-bold text-white mb-4">403</h1>
        
        {/* Título */}
        <h2 className="text-2xl font-bold text-white mb-4">
          Acceso Denegado
        </h2>
        
        {/* Descripción */}
        <p className="text-lumina-muted mb-8">
          No tienes permisos suficientes para acceder a esta página. 
          Si crees que esto es un error, contacta al administrador del sistema.
        </p>

        {/* Botones de acción */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-lumina-border"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
          
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-6 py-3 bg-lumina-primary hover:bg-lumina-primary/80 text-white rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" />
            Ir al Inicio
          </button>
        </div>
      </div>
    </div>
  );
};