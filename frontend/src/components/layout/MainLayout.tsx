import { Outlet } from "react-router-dom";
import { Sidebar } from "../ui/Sidebar";
import { Header } from "../ui/Header";

export const MainLayout = () => {
  return (
    <div className="min-h-screen bg-lumina-bg text-lumina-text font-sans selection:bg-lumina-primary/30">
      
      {/* Sidebar Fijo */}
      <Sidebar />

      {/* Contenido Principal */}
      <div className="flex flex-col min-h-screen relative">
        
        {/* Header Superior */}
        <Header />

        {/* Area de Contenido (Páginas) 
            Se le dará un padding izquierdo (pl-20) para que no choque con el sidebar colapsado
        */}
        <main className="flex-1 p-8 pl-24 overflow-x-hidden">
            {/* Aquí se renderizarán las rutas hijas */}
            <div className="max-w-7xl mx-auto animate-fade-in">
                <Outlet />
            </div>
        </main>

      </div>
    </div>
  );
};