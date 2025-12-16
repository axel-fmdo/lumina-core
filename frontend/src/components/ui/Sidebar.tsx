import { useState, useEffect } from "react";
import { usePermission } from "../../hooks/usePermission";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut,
  Box,
  ChevronDown,
  ChevronRight,
  Shield,
  Tags,
  UserCog
} from "lucide-react";
import { cn } from "../../lib/utils";
import { logout } from "../../redux/slices/authSlice";

// Tipado para elementos del menú
type MenuItem = {
  icon: any;
  label: string;
  path?: string;
  permission?: string; // Permiso requerido para ver este item
  permissions?: string[];
  subItems?: { 
    label: string; 
    path: string; 
    icon?: any;
    permission?: string; // Permiso requerido para ver este subitem
    permissions?: string[];
  }[];
};

const MENU_ITEMS: MenuItem[] = [
  { 
    icon: LayoutDashboard, 
    label: "Dashboard", 
    path: "/",
    permission: "dashboard_read"
  },
  { 
    icon: Box, 
    label: "Activos", 
    path: "/assets",
    permission: "assets_read"
  },
  { 
    icon: Users, 
    label: "Usuarios", 
    path: "/users",
    permission: "users_read"
  },
  { 
    icon: Settings, 
    label: "Configuración",
    permission: "settings_read",
    subItems: [
      { 
        label: "Perfiles", 
        path: "/roles", 
        icon: UserCog,
        permissions: ["roles_read", "settings_read"]
      },
      { 
        label: "Seguridad", 
        path: "/security", 
        icon: Shield,
        permissions: ["security_read", "settings_read", "roles_read"]
      },
      { 
        label: "Categorías", 
        path: "/categories", 
        icon: Tags,
        permissions: ["categories_read", "settings_read"]
      }
    ]
  },
];

export const Sidebar = () => {
  const { hasPermission, hasAllPermissions } = usePermission();
  const [isExpanded, setIsExpanded] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Filtrar items del menú según permisos
  const getFilteredMenuItems = () => {
    return MENU_ITEMS.filter(item => {
      // Si el item tiene subItems, filtrar los subItems primero
      if (item.subItems) {
        const filteredSubItems = item.subItems.filter(subItem => {
          // Si el subitem tiene permiso, validarlo
          if (subItem.permission) {
            return hasPermission(subItem.permission);
          }

          if(subItem.permissions){
            return hasAllPermissions(subItem.permissions)
          }
          // Si no tiene permiso definido, mostrarlo por defecto
          return true;
        });
        
        // Si no quedan subItems visibles, ocultar el item padre
        if (filteredSubItems.length === 0) {
          return false;
        }
        
        // Actualizar los subItems del item con los filtrados
        item.subItems = filteredSubItems;
        return true;
      }
      
      // Para items sin subItems, validar su permiso
      if (item.permission) {
        return hasPermission(item.permission);
      }

      if(item.permissions){
        return hasAllPermissions(item.permissions)
      }
      
      // Si no tiene permiso definido, mostrarlo por defecto
      return true;
    });
  };

  const filteredMenuItems = getFilteredMenuItems();

  useEffect(() => {
    if (isExpanded) {
      filteredMenuItems.forEach(item => {
        if (item.subItems?.some(sub => sub.path === location.pathname)) {
          setOpenMenu(item.label);
        }
      });
    }
  }, [location.pathname, isExpanded]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const toggleSubMenu = (label: string) => {
    if (!isExpanded) setIsExpanded(true);
    setOpenMenu(openMenu === label ? null : label);
  };

  return (
    <aside 
      className="fixed left-0 top-0 h-screen z-50 flex flex-col"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => {
        setIsExpanded(false);
        setOpenMenu(null);
      }}
    >
      <motion.div 
        className="h-full bg-lumina-surface/90 backdrop-blur-xl border-r border-lumina-border flex flex-col relative overflow-hidden shadow-2xl"
        animate={{ width: isExpanded ? 220 : 80 }}
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
                  className="font-bold text-xl tracking-tight text-white whitespace-nowrap"
                >
                  Lumina
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ITEMS DEL MENU */}
        <nav className="flex-1 py-6 flex flex-col gap-2 px-3 overflow-y-auto custom-scrollbar">
          {filteredMenuItems.map((item) => {
            // CASO 1: ITEM CON SUBMENÚ
            if (item.subItems) {
              const isOpen = openMenu === item.label;
              const isActiveParent = item.subItems.some(sub => sub.path === location.pathname);

              return (
                <div key={item.label} className="flex flex-col">
                  <button
                    onClick={() => toggleSubMenu(item.label)}
                    className={cn(
                      "flex items-center h-12 px-4 rounded-lg transition-all duration-200 group relative w-full",
                      (isActiveParent || isOpen) ? "text-white" : "text-lumina-muted hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <item.icon className={cn("w-6 h-6 min-w-[24px]", isActiveParent && "text-lumina-primary")} />
                    
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="ml-4 font-medium whitespace-nowrap flex-1 flex justify-between items-center"
                        >
                          <span>{item.label}</span>
                          {isOpen ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>

                  {/* SUBMENÚ LISTA */}
                  <AnimatePresence>
                    {isExpanded && isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden ml-4 pl-4 border-l border-lumina-border/30"
                      >
                        {item.subItems.map(subItem => (
                          <NavLink
                            key={subItem.path}
                            to={subItem.path}
                            className={({ isActive }) => cn(
                              "flex items-center h-10 px-3 my-1 rounded-lg text-sm transition-all duration-200",
                              isActive 
                                ? "bg-lumina-primary/10 text-lumina-primary font-medium" 
                                : "text-lumina-muted hover:text-white hover:bg-white/5"
                            )}
                          >
                            {subItem.icon && <subItem.icon className="w-3 h-3 mr-2 opacity-70"/>}
                            <span className="whitespace-nowrap">{subItem.label}</span>
                          </NavLink>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            // CASO 2: ITEM NORMAL
            return (
              <NavLink
                key={item.path}
                to={item.path!}
                className={({ isActive }) => cn(
                  "flex items-center h-12 px-4 rounded-lg transition-all duration-200 group relative",
                  isActive 
                    ? "bg-lumina-primary/10 text-lumina-primary" 
                    : "text-lumina-muted hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className="w-6 h-6 min-w-[24px]" />

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

                {/* Tooltip para modo colapsado */}
                {!isExpanded && (
                  <div className="absolute left-14 bg-lumina-surface border border-lumina-border px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 text-white shadow-xl">
                    {item.label}
                  </div>
                )}
              </NavLink>
            );
          })}
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