import { useState, useEffect } from "react";
import { X, Search, User as UserIcon, Loader2, CheckCircle2, MessageSquare } from "lucide-react";
import { motion, easeInOut } from "framer-motion";
import api from "../../lib/axios";
import { User } from "../../types";

interface UserSelectModalProps {
    onClose: () => void;
    onSelect: (userId: string, comments: string) => void;
    isLoadingAction: boolean;
}

export const UserSelectModal = ({ onClose, onSelect, isLoadingAction }: UserSelectModalProps) => {
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [comments, setComments] = useState("");

    // Efecto de búsqueda para los usuarios
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            setIsLoading(true);
            try {
                const { data } = await api.get("/users/", { params: { skip: 0, limit: 5, search: searchTerm || undefined }});
                
                if (data && Array.isArray(data.data)) {
                    setUsers(data.data);
                } else {
                    setUsers([]);
                }

            } catch (error) {
                console.error("Error buscando usuarios.", error);
                setUsers([]);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handleConfirm = () => {
        if (selectedUserId) {
            onSelect(selectedUserId, comments);
        }
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
                className="relative w-full max-w-md bg-lumina-surface border border-lumina-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
                {/* CABECERA */}
                <div className="p-4 border-b border-lumina-border bg-white/5 flex justify-between items-center shrink-0">
                    <h3 className="text-lg font-semibold text-white">Asignar a...</h3>
                    <button onClick={onClose} className="text-lumina-muted hover:text-white"><X className="w-5 h-5"/></button>
                </div>

                {/* CUERPO DEL MODAL */}
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                    
                    {/* BUSCADOR */}
                    <div className="p-4 pb-2 shrink-0">
                        <label className="text-xs font-medium text-lumina-muted mb-1.5 block uppercase tracking-wider">Buscar Usuario</label>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-lumina-muted" />
                            <input 
                                type="text"
                                placeholder="Nombre o correo..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-lumina-bg border border-lumina-border rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-lumina-primary/50 outline-none placeholder:text-gray-600 transition-all"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* LISTA DE USUARIOS */}
                    <div className="px-2 space-y-1 min-h-[150px] max-h-[250px] overflow-y-auto custom-scrollbar border-b border-white/5 pb-2">
                        {isLoading ? (
                            <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-lumina-primary"/></div>
                        ) : users.length > 0 ? (
                            users.map(user => {
                                const isSelected = selectedUserId === user.id;
                                return (
                                    <button
                                        key={user.id}
                                        onClick={() => setSelectedUserId(user.id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left group border ${
                                            isSelected 
                                            ? "bg-lumina-primary/10 border-lumina-primary/50 ring-1 ring-lumina-primary/50" 
                                            : "bg-transparent border-transparent hover:bg-white/5"
                                        }`}
                                    >
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                                            isSelected ? "bg-lumina-primary text-white" : "bg-lumina-primary/10 text-lumina-primary"
                                        }`}>
                                            <UserIcon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium truncate ${isSelected ? "text-white" : "text-gray-200"}`}>
                                                {user.full_name}
                                            </p>
                                            <p className="text-xs text-lumina-muted truncate">{user.email}</p>
                                        </div>
                                        {isSelected && <CheckCircle2 className="w-5 h-5 text-lumina-primary animate-in fade-in zoom-in duration-200 shrink-0"/>}
                                    </button>
                                );
                            })
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center py-4">
                                <p className="text-lumina-muted text-sm">No se encontraron usuarios</p>
                            </div>
                        )}
                    </div>

                    {/* COMENTARIOS */}
                    <div className="p-4 pt-4 shrink-0 bg-white/[0.02]">
                        <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="w-4 h-4 text-lumina-primary" />
                            <label className="text-xs font-medium text-lumina-muted uppercase tracking-wider">Comentarios / Observaciones</label>
                        </div>
                        <textarea 
                            rows={3}
                            className="w-full bg-lumina-bg border border-lumina-border rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-lumina-primary/50 outline-none resize-none placeholder:text-gray-600 transition-all"
                            placeholder="Ej. Se entrega equipo con cargador original y funda de transporte..."
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                        />
                    </div>
                </div>

                {/* BOTONES */}
                <div className="p-4 border-t border-lumina-border bg-white/5 flex justify-end gap-3 shrink-0">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 text-sm text-lumina-muted hover:text-white transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleConfirm}
                        disabled={!selectedUserId || isLoadingAction}
                        className="px-6 py-2 bg-lumina-primary hover:bg-indigo-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-lumina-primary/20"
                    >
                        {isLoadingAction ? <Loader2 className="w-4 h-4 animate-spin"/> : null}
                        Confirmar
                    </button>
                </div>
            </motion.div>
        </div>
    );
};