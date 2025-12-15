// pages/NotFoundPage.tsx
import { useNavigate } from "react-router-dom";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 bg-lumina-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Icono */}
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 bg-lumina-primary/10 rounded-full flex items-center justify-center">
            <FileQuestion className="w-12 h-12 text-lumina-primary" />
          </div>
        </div>

        {/* Código de error */}
        <h1 className="text-8xl font-bold text-white mb-4">404</h1>
        
        {/* Título */}
        <h2 className="text-2xl font-bold text-white mb-4">
          Página No Encontrada
        </h2>
        
        {/* Descripción */}
        <p className="text-lumina-muted mb-8">
          Lo sentimos, la página que buscas no existe o ha sido movida. 
          Verifica la URL o regresa al inicio.
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