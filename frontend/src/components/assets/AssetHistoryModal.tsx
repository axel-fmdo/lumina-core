import { useEffect, useState } from "react";
import { X, Clock, User, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import api from "../../lib/axios";
import { Asset, AssetHistory } from "../../types";
import { motion, easeInOut } from "framer-motion";

interface AssetHistoryModalProps {
    asset: Asset;
    onClose: () => void;
}

export const AssetHistoryModal = ({ asset, onClose }: AssetHistoryModalProps) => {
    const [history, setHistory] = useState<AssetHistory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const { data } = await api.get(`/assets/${asset.id}/history`);
                setHistory(data);
            } catch (error) {
                console.error("Error cargando historial", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [asset.id]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString("es-MX", {
            day: "2-digit", month: "short", year: "numeric", 
            hour: "2-digit", minute: "2-digit"
        });
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{duration: 0.2}}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}
            />

            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, ease: easeInOut }}
                className="relative w-full max-w-2xl bg-lumina-surface border border-lumina-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
                {/* Header */}
                <div className="p-4 border-b border-lumina-border bg-white/5 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Historial de Movimientos</h2>
                            <p className="text-xs text-lumina-muted font-mono mt-0.5">{asset.internal_code} • {asset.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-lumina-muted hover:text-white"><X className="w-5 h-5"/></button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-lumina-primary"/>
                            <p className="text-sm text-lumina-muted">Cargando bitácora...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-xl bg-white/[0.02]">
                            <p className="text-gray-500">No hay movimientos registrados para este activo.</p>
                        </div>
                    ) : (
                        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-px before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                            {history.map((item) => (
                                <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                    
                                    {/* Icono Central */}
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border shadow-lg shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform group-hover:scale-110 ${
                                         item.action_type === "Asignación" ? "bg-[#1a1c23] border-emerald-500/30 text-emerald-500" : 
                                         item.action_type === "Devolución" ? "bg-[#1a1c23] border-amber-500/30 text-amber-500" :
                                         "bg-[#1a1c23] border-gray-500/30 text-gray-400"
                                    }`}>
                                        {item.action_type === "Asignación" ? <CheckCircle2 className="w-5 h-5" /> : 
                                         item.action_type === "Devolución" ? <ArrowRight className="w-5 h-5" /> :
                                         <AlertCircle className="w-5 h-5" />}
                                    </div>
                                    
                                    {/* Tarjeta de Datos */}
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all shadow-sm hover:border-white/10 hover:shadow-md">
                                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/5">
                                            <span className={`font-bold text-xs uppercase tracking-wider ${
                                                item.action_type === "Asignación" ? "text-emerald-400" :
                                                item.action_type === "Devolución" ? "text-amber-400" : "text-white"
                                            }`}>
                                                {item.action_type}
                                            </span>
                                            <time className="text-[10px] text-gray-500 font-mono bg-black/20 px-2 py-0.5 rounded">{formatDate(item.created_at)}</time>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            {item.assigned_to && (
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
                                                        <User className="w-3.5 h-3.5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-lumina-muted">Usuario</span>
                                                        <span className="text-sm font-medium text-white">{item.assigned_to.full_name}</span>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {item.comments && (
                                                <div className="text-sm text-gray-300 italic bg-black/20 p-3 rounded-lg border-l-2 border-white/10">
                                                    "{item.comments}"
                                                </div>
                                            )}

                                            <div className="pt-2 text-[10px] text-gray-600 flex justify-end">
                                                Registrado por: {item.action_by?.full_name || 'Sistema'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};