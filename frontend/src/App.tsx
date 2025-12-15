// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { MainLayout } from "./components/layout/MainLayout";
import { Login } from "./pages/Login";
import { UsersView } from "./pages/UsersView";
import { AssetsView } from "./pages/AssetsView";
import { CategoriesView } from "./pages/CategoriesView";
import { RolesView } from "./pages/RolesView";
import { NotFoundPage } from "./pages/NotFoundPage";
import { UnauthorizedPage } from "./pages/UnauthorizedPage";
import { RootState } from "./redux/store";
import { Toaster } from "sonner";
import { usePermission } from "./hooks/usePermission";

// Componente Protector de Autenticación
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Componente Protector de Permisos
const PermissionRoute = ({ 
  children, 
  permission 
}: { 
  children: JSX.Element; 
  permission: string;
}) => {
  const { hasPermission } = usePermission();
  
  if (!hasPermission(permission)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Toaster 
        position="top-right"
        richColors
        theme="dark"
        closeButton
        duration={5000}
      />
      <Routes>
        {/* Ruta Pública */}
        <Route path="/login" element={<Login />} />

        {/* Página de Error - Sin Permisos */}
        <Route path="/unauthorized" element={
          <ProtectedRoute>
            <UnauthorizedPage />
          </ProtectedRoute>
        } />

        {/* Rutas Protegidas con Permisos */}
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          {/* Dashboard */}
          <Route index element={
            <PermissionRoute permission="dashboard_read">
              <div className="p-4">
                <h1 className="text-3xl font-bold text-white">Dashboard Protegido</h1>
                <p className="text-lumina-muted mt-2">Bienvenido al sistema.</p>
              </div>
            </PermissionRoute>
          } />

          {/* Usuarios */}
          <Route path="users" element={
            <PermissionRoute permission="users_read">
              <UsersView />
            </PermissionRoute>
          } />

          {/* Activos */}
          <Route path="assets" element={
            <PermissionRoute permission="assets_read">
              <AssetsView />
            </PermissionRoute>
          } />

          {/* Categorías */}
          <Route path="categories" element={
            <PermissionRoute permission="categories_read">
              <CategoriesView />
            </PermissionRoute>
          } />

          {/* Roles */}
          <Route path="roles" element={
            <PermissionRoute permission="roles_read">
              <RolesView />
            </PermissionRoute>
          } />

          {/* Ruta no encontrada dentro del layout */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        
        {/* Ruta no encontrada fuera del layout (para cualquier URL no definida) */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
