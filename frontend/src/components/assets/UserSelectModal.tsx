import { useState, useEffect } from "react";
import { X, Search, User as UserIcon, Loader2, CheckCircle2 } from "lucide-react";
import { motion, easeInOut } from "framer-motion";
import api from "../../lib/axios";
import { User } from "../../types";

interface UserSelectModalProps {
    onClose: () => void;
    onSelect: (userId: string) => void;
    isLoadingAction: boolean;
}

export const UserSelectModal = ({ onClose, onSelect, isLoadingAction }: UserSelectModalProps) => {
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    // 👇 EFECTO DE BÚSQUEDA INTELIGENTE (Server-Side)
    useEffect(() => {
        // Creamos un temporizador para no llamar a la API por cada letra (Debounce)
        const delayDebounceFn = setTimeout(async () => {
            setIsLoading(true);
            try {
                // Pasamos el término de búsqueda al backend
                // Si searchTerm está vacío, el backend devolverá los primeros 10 por defecto
                const { data } = await api.get("/users/", {
                    params: {
                        skip: 0,
                        limit: 10, // Traemos solo 10 resultados para ser eficientes
                        search: searchTerm || undefined // Solo enviamos si hay texto
                    }
                });
                
                // 👇 CORRECCIÓN CLAVE: Accedemos a data.data
                // Tu backend devuelve { data: [...], total: ... }, así que la lista está en data.data
                if (data && Array.isArray(data.data)) {
                    setUsers(data.data);
                } else {
                    setUsers([]);
                }

            } catch (error) {
                console.error("Error buscando usuarios", error);
                setUsers([]);
            } finally {
                setIsLoading(false);
            }
        }, 300); // Espera 300ms después de que dejes de escribir

        // Limpieza: si escribes rápido, cancela el temporizador anterior
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]); // Se ejecuta cada vez que cambia searchTerm

    const handleConfirm = () => {
        if (selectedUserId) {
            onSelect(selectedUserId);
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
                {/* Header */}
                <div className="p-4 border-b border-lumina-border bg-white/5 flex justify-between items-center shrink-0">
                    <h3 className="text-lg font-semibold text-white">Asignar a...</h3>
                    <button onClick={onClose} className="text-lumina-muted hover:text-white"><X className="w-5 h-5"/></button>
                </div>

                {/* Search Input */}
                <div className="p-4 pb-2 shrink-0">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-lumina-muted" />
                        <input 
                            type="text"
                            placeholder="Buscar por nombre o correo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-lumina-bg border border-lumina-border rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-lumina-primary/50 outline-none placeholder:text-gray-600"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Lista de Usuarios */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {isLoading ? (
                        <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-lumina-primary"/></div>
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
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                                        isSelected ? "bg-lumina-primary text-white" : "bg-lumina-primary/10 text-lumina-primary"
                                    }`}>
                                        <UserIcon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0"> {/* min-w-0 ayuda al truncado */}
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
                        <div className="text-center py-8">
                            <p className="text-lumina-muted text-sm">No se encontraron usuarios</p>
                            {searchTerm && <p className="text-xs text-gray-600 mt-1">Intenta con otro término</p>}
                        </div>
                    )}
                </div>

                {/* Footer */}
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