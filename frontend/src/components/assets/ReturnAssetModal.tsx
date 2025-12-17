import { useState } from "react";
import { X, CornerDownLeft, AlertTriangle, MessageSquare, Loader2 } from "lucide-react";
import { motion, easeInOut } from "framer-motion";
import { Asset } from "../../types";

interface ReturnAssetModalProps {
    asset: Asset;
    onClose: () => void;
    onConfirm: (comments: string) => void;
    isLoading: boolean;
}

export const ReturnAssetModal = ({ asset, onClose, onConfirm, isLoading }: ReturnAssetModalProps) => {
    const [comments, setComments] = useState("");

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
                className="relative w-full max-w-md bg-lumina-surface border border-lumina-border rounded-xl shadow-2xl overflow-hidden flex flex-col"
            >
                {/* CABECERA */}
                <div className="p-4 border-b border-lumina-border bg-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-white">
                        <CornerDownLeft className="w-5 h-5 text-amber-500" />
                        <h3 className="text-lg font-semibold">Devolver Activo</h3>
                    </div>
                    <button onClick={onClose} className="text-lumina-muted hover:text-white"><X className="w-5 h-5"/></button>
                </div>

                {/* CUERPO */}
                <div className="p-6 space-y-4">
                    {/* ALERTA VISUAL */}
                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-amber-200">Confirmar Devolución</p>
                            <p className="text-xs text-amber-200/70 leading-relaxed">
                                Vas a desvincular el activo <strong className="text-white">{asset.internal_code}</strong> de <strong className="text-white">{asset.assigned_to?.full_name}</strong>. Pasará a estado Disponible.
                            </p>
                        </div>
                    </div>

                    {/* COMENTARIOS */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="w-4 h-4 text-lumina-primary" />
                            <label className="text-xs font-medium text-lumina-muted uppercase tracking-wider">Estado de recepción / Notas</label>
                        </div>
                        <textarea 
                            rows={3}
                            className="w-full bg-lumina-bg border border-lumina-border rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-amber-500/50 outline-none resize-none placeholder:text-gray-600 transition-all"
                            placeholder="Ej. Equipo recibido en buenas condiciones, pantalla sucia..."
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                {/* BOTONES */}
                <div className="p-4 border-t border-lumina-border bg-white/5 flex justify-end gap-3">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 text-sm text-lumina-muted hover:text-white transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={() => onConfirm(comments)}
                        disabled={isLoading}
                        className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-900/20 active:scale-95"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : null}
                        Confirmar Devolución
                    </button>
                </div>
            </motion.div>
        </div>
    );
};