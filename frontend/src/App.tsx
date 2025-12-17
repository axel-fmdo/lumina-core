// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { MainLayout } from "./components/layout/MainLayout";
import { Login } from "./pages/Login";
import { DashboardView } from "./pages/Dashboard";
import { UsersView } from "./pages/UsersView";
import { AssetsView } from "./pages/AssetsView";
import { CategoriesView } from "./pages/CategoriesView";
import { RolesView } from "./pages/RolesView";
import { SecurityView } from "./pages/SecurityView";
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

// Componente Protector de un solo Permiso
const PermissionRoute = ({ children, permission }: { 
  children: JSX.Element; 
  permission: string;
}) => {
  const { hasPermission } = usePermission();
  
  if (!hasPermission(permission)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
};

// Componente protector de varios Permisos
const PermissionsRoute = ({ children, permissions }: {
  children: JSX.Element;
  permissions: string[];
}) => {
  const { hasAllPermissions } = usePermission();

  if(!hasAllPermissions(permissions)){
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

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
              <DashboardView/>
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
            <PermissionsRoute permissions={["categories_read", "settings_read"]}>
              <CategoriesView />
            </PermissionsRoute>
          } />

          {/* Roles */}
          <Route path="roles" element={
            <PermissionsRoute permissions={["roles_read", "settings_read"]}>
              <RolesView />
            </PermissionsRoute>
          } />

          {/* Seguridad */}
          <Route path="security" element={
            <PermissionsRoute permissions={["roles_read", "settings_read", "security_read"]}>
              <SecurityView />
            </PermissionsRoute>
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
