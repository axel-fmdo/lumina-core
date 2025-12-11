import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  Users, 
  Shield, 
  Settings, 
  Menu, 
  LogOut,
  Box
} from "lucide-react";
import { cn } from "../../lib/utils";
import {logout } from "../../redux/slices/authSlice";

const MENU_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Box, label: "Activos", path: "/assets" },
  { icon: Users, label: "Usuarios", path: "/users" },
  { icon: Shield, label: "Permisos", path: "/permissions" },
  { icon: Settings, label: "Configuración", path: "/settings" },
];

export const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  //Función para el cierre de sesión
  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    // Contenedor fijo a la izquierda
    <aside 
      className="fixed left-0 top-0 h-screen z-50 flex flex-col"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* FONDO ANIMADO (Glassmorphism)
         Cambia de ancho suavemente (w-20 a w-64)
      */}
      <motion.div 
        className="h-full bg-lumina-surface/90 backdrop-blur-xl border-r border-lumina-border flex flex-col relative overflow-hidden shadow-2xl"
        animate={{ width: isExpanded ? 250 : 80 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        
        {/* LOGO AREA */}
        <div className="h-20 flex items-center pl-5 border-b border-lumina-border/50">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-lumina-primary to-lumina-accent rounded-xl flex items-center justify-center shadow-lg shadow-lumina-primary/20 shrink-0">
                <Box className="text-white w-6 h-6" />
              </div>
              
              <AnimatePresence>
                {isExpanded && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    /* Se agrega whitespace-nowrap para evitar que el texto intente bajar de línea al cerrar */
                    className="font-bold text-xl tracking-tight text-white whitespace-nowrap"
                  >
                    Lumina
                  </motion.span>
                )}
              </AnimatePresence>
           </div>
        </div>

        {/* ITEMS DEL MENU */}
        <nav className="flex-1 py-6 flex flex-col gap-2 px-3">
          {MENU_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center h-12 px-3 rounded-lg transition-all duration-200 group relative",
                isActive 
                  ? "bg-lumina-primary/10 text-lumina-primary" 
                  : "text-lumina-muted hover:bg-white/5 hover:text-white"
              )}
            >
              {/* Icono siempre visible y centrado si está colapsado */}
              <item.icon className="w-6 h-6 min-w-[24px]" />

              {/* Texto (Solo visible expandido) */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="ml-4 font-medium whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Tooltip simple cuando está colapsado (opcional visual) */}
              {!isExpanded && (
                 <div className="absolute left-14 bg-lumina-surface border border-lumina-border px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                 </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* FOOTER (Logout) */}
        <div className="p-3 border-t border-lumina-border/50">
            <button 
              className="w-full flex items-center h-12 px-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
              onClick={handleLogout}
            >
                <LogOut className="w-6 h-6 min-w-[24px]" />
                <AnimatePresence>
                  {isExpanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="ml-4 font-medium whitespace-nowrap"
                    >
                      Cerrar Sesión
                    </motion.span>
                  )}
                </AnimatePresence>
            </button>
        </div>

      </motion.div>
    </aside>
  );
};