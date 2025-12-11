import { useEffect, useState } from "react";
import { Bell, Search, UserCircle } from "lucide-react";
import { usePermission } from "../../hooks/usePermission";

export const Header = () => {
  // Estado para controlar la hora actual
  const [time, setTime] = useState(new Date());

  //Se obtiene al usuario desde Redux
  const { user} = usePermission();

  // Se obtienen las iniciales para el avatar
  const getInitial = (name: string) => {
    return name
        ?.split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2) || "U";
  };

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 100); // Actualiza cada segundo
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-20 pl-24 pr-8 flex items-center justify-between sticky top-0 z-40">
        {/* Izquierda: Buscador Global (Placeholder) */}
        <div className="flex items-center bg-lumina-surface/50 border border-lumina-border rounded-full px-4 py-2 w-96 backdrop-blur-sm focus-within:ring-2 ring-lumina-primary/50 transition-all">
            <Search className="w-4 h-4 text-lumina-muted mr-3" />
            <input 
            type="text" 
            placeholder="Buscar activos, usuarios..." 
            className="bg-transparent border-none outline-none text-sm text-lumina-text w-full placeholder:text-lumina-muted"
            />
        </div>

        {/* Derecha: Info y Perfil */}
        <div className="flex items-center gap-6">
        
        {/* Reloj */}
        <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-lumina-text">
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-xs text-lumina-muted capitalize">
                {time.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
        </div>

        {/* Separador */}
        <div className="h-8 w-[1px] bg-lumina-border" />

        {/* Acciones */}
        <button className="relative p-2 text-lumina-muted hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        </button>

        {/* Perfil Dropdown */}
        <div className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors">
            <div className="w-8 h-8 rounded-full bg-lumina-primary flex items-center justify-center text-white font-bold text-sm">
                {user ? getInitial(user.full_name) : "..."}
            </div>
            <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-lumina-text leading-none">{user?.full_name || "Cargando..."}</p>
                <p className="text-xs text-lumina-muted mt-1">{user?.email || "Cargando..."}</p>
            </div>
        </div>

      </div>
    </header>
  );
};