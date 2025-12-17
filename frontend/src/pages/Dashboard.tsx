import { useEffect, useState } from "react";
import api from "../lib/axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Box, CheckCircle2, AlertOctagon, LayoutDashboard, ArrowRight, User, TrendingUp } from "lucide-react";
import { DashboardData } from "../types";
import { KpiCard } from "../components/ui/KpiCard";

export const DashboardView = () => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const res = await api.get("/dashboard/");

                if(res){
                    setData(res.data);
                }
                
            } catch (error) {
                console.error("Error cargando dashboard.", error);
            } finally {
                setLoading(false);
            }
        };
        loadDashboard();
    }, []);

    if (loading || !data) {
        return (
        <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
        );
    }

    // Preparación de datos para los gráficos de barras
    const statusData = [
        { name: 'Disponibles', value: data.stats.available_count, color: '#10b981' },
        { name: 'Asignados', value: data.stats.assigned_count, color: '#6366f1' },
        { name: 'Mantenimiento', value: data.stats.maintenance_count, color: '#f59e0b' },
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-6 pb-10">
        
        {/* CABECERA */}
        <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
            <LayoutDashboard className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
            <p className="text-gray-400 text-sm">Resumen operativo en tiempo real</p>
            </div>
        </div>

        {/* TARJETAS CON INDICADORES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard 
            title="Valor del Inventario" 
            value={new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(data.stats.total_value)}
            icon={<DollarSign className="w-6 h-6 text-emerald-400" />}
            trend="Costo Total"
            color="bg-emerald-500/10 border-emerald-500/20"
            />
            <KpiCard 
            title="Total Activos" 
            value={data.stats.total_assets}
            icon={<Box className="w-6 h-6 text-blue-400" />}
            trend="Equipos registrados"
            color="bg-blue-500/10 border-blue-500/20"
            />
            <KpiCard 
            title="Asignados" 
            value={data.stats.assigned_count}
            icon={<User className="w-6 h-6 text-indigo-400" />}
            trend={`${((data.stats.assigned_count / data.stats.total_assets) * 100).toFixed(0)}% Utilización`}
            color="bg-indigo-500/10 border-indigo-500/20"
            />
            <KpiCard 
            title="Mantenimiento" 
            value={data.stats.maintenance_count}
            icon={<AlertOctagon className="w-6 h-6 text-amber-400" />}
            trend="Requieren atención"
            color="bg-amber-500/10 border-amber-500/20"
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* GRÁFICA DE BARRAS (CATEGORÍAS) */}
            <div className="lg:col-span-2 bg-[#1a1c23] border border-white/10 rounded-xl p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gray-400" /> Distribución por Categoría
            </h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.category_distribution} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                    <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="#9ca3af" width={100} fontSize={12} />
                    <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: number) => [`${value} Unidades`, 'Cantidad']}
                    />
                    <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
                </ResponsiveContainer>
            </div>
            </div>

            {/* GRÁFICA DE DONA (ESTADO) */}
            <div className="bg-[#1a1c23] border border-white/10 rounded-xl p-6 shadow-xl flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-2">Disponibilidad</h3>
            <div className="flex-1 min-h-[250px] relative">
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    >
                    {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                    </Pie>
                    <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
                    />
                </PieChart>
                </ResponsiveContainer>
                {/* TEXTO CENTRAL */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold text-white">{data.stats.available_count}</span>
                    <span className="text-xs text-emerald-400 font-medium uppercase">Disponibles</span>
                </div>
            </div>
            <div className="flex justify-center gap-4 text-xs text-gray-400 mt-2">
                {statusData.map(d => (
                    <div key={d.name} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                        {d.name}
                    </div>
                ))}
            </div>
            </div>
        </div>

        {/* ACTIVIDAD RECIENTE */}
        <div className="bg-[#1a1c23] border border-white/10 rounded-xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white">Actividad Reciente</h3>
            </div>
            <div className="divide-y divide-white/5">
            {data.recent_activity.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                        item.action_type === 'Asignación' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                        item.action_type === 'Devolución' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                        'bg-gray-500/10 border-gray-500/20 text-gray-400'
                    }`}>
                        {item.action_type === 'Asignación' ? <CheckCircle2 className="w-5 h-5"/> : 
                        item.action_type === 'Devolución' ? <ArrowRight className="w-5 h-5"/> : <AlertOctagon className="w-5 h-5"/>}
                    </div>
                    <div>
                    <p className="text-sm font-medium text-white">
                        {item.action_type} <span className="text-gray-500 mx-1">•</span> <span className="text-indigo-300">{item.asset?.name || 'Activo'}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                        {item.action_type === 'Asignación' ? `Asignado a ${item.assigned_to?.full_name}` : 
                        item.action_type === 'Devolución' ? `Devuelto por ${item.assigned_to?.full_name}` : 
                        item.comments || 'Sin comentarios'}
                    </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-400 font-mono">
                        {new Date(item.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                    </p>
                    <p className="text-[10px] text-gray-600">
                        {new Date(item.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
                </div>
            ))}
            {data.recent_activity.length === 0 && (
                <div className="p-8 text-center text-gray-500">No hay actividad reciente.</div>
            )}
            </div>
        </div>
        </div>
    );
};