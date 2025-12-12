import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Sidebar } from "../ui/Sidebar";
import { Header } from "../ui/Header";
import { AppDispatch, RootState } from "../../redux/store";
import { fetchUserProfile } from "../../redux/slices/authSlice";

export const MainLayout = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, token } = useSelector((state: RootState) => state.auth);

  // Si hay token pero no hay usuario cargado, sw busca
  useEffect(() => {
    if (token && !user) {
      dispatch(fetchUserProfile());
    }
  }, [token, user, dispatch]);

  // Se muestra un loader global mientras cargamos los permisos
  if (token && !user) {
     return <div className="h-screen w-full flex items-center justify-center bg-lumina-bg text-white">Cargando perfil...</div>;
  }

  return (
    <div className="min-h-screen bg-lumina-bg text-lumina-text font-sans selection:bg-lumina-primary/30">
        <Sidebar />
        <div className="flex flex-col min-h-screen relative transition-all duration-300">
            {/* Header */}
            <div> 
                <Header />
            </div>
            {/* Contenido Principal */}
            <main className="flex-1 ml-20 px-16 pt-8 pb-16 w-[calc(100%-5rem)] overflow-x-hidden">
                <div className="w-full max-w-full mx-auto animate-fade-in">
                    <Outlet />
                </div>
            </main>
        </div>
    </div>
  );
};