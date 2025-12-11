import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { MainLayout } from "./components/layout/MainLayout";
import { Login } from "./pages/Login";
import { RootState } from "./redux/store";

// Componente Protector: Si no hay token, te patea al login
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta Pública */}
        <Route path="/login" element={<Login />} />

        {/* Rutas Protegidas (Dashboard y demás) */}
        <Route path="/" element={
            <ProtectedRoute>
                <MainLayout />
            </ProtectedRoute>
        }>
            <Route index element={
                <div className="p-4">
                  <h1 className="text-3xl font-bold text-white">Dashboard Protegido</h1>
                  <p className="text-lumina-muted mt-2">Bienvenido al sistema.</p>
                </div>
            } />
            <Route path="users" element={<h1>Usuarios</h1>} />
            <Route path="assets" element={<h1>Activos</h1>} />
        </Route>
        
        {/* Cualquier otra ruta redirige a login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
