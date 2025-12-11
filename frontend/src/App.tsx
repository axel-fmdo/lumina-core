import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Todas las rutas dentro del Layout Principal */}
        <Route element={<MainLayout />}>
          
          {/* Ruta Dashboard (Home) */}
          <Route path="/" element={
            <div>
              <h1 className="text-3xl font-bold text-white mb-4">Dashboard</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Cards de prueba visual */}
                <div className="h-40 glass-panel rounded-xl p-6">
                    <h3 className="text-lumina-muted text-sm">Total Activos</h3>
                    <p className="text-4xl font-bold text-white mt-2">1,240</p>
                </div>
                <div className="h-40 glass-panel rounded-xl p-6">
                    <h3 className="text-lumina-muted text-sm">Usuarios</h3>
                    <p className="text-4xl font-bold text-white mt-2">85</p>
                </div>
                <div className="h-40 glass-panel rounded-xl p-6 border-lumina-primary/30">
                    <h3 className="text-lumina-primary text-sm font-semibold">Alertas</h3>
                    <p className="text-4xl font-bold text-white mt-2">3</p>
                </div>
              </div>
            </div>
          } />

          {/* Rutas Placeholder */}
          <Route path="/assets" element={<h1>Gestión de Activos</h1>} />
          <Route path="/users" element={<h1>Usuarios</h1>} />
          
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
