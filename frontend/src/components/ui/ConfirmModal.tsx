import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "info"; // Para cambiar colores según la acción
  isLoading?: boolean;
}

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger",
  isLoading = false
}: ConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            
          {/* BACKDROP (Fondo oscuro borroso) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* MODAL PANEL */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative w-full max-w-md overflow-hidden rounded-2xl border bg-lumina-surface shadow-2xl ${
                variant === 'danger' ? 'border-red-500/30' : 'border-lumina-primary/30'
            }`}
          >
            {/* Header Visual */}
            <div className={`h-2 w-full ${variant === 'danger' ? 'bg-red-500' : 'bg-lumina-primary'}`} />

            <div className="p-6">
                <div className="flex items-start gap-4">
                    {/* Icono */}
                    <div className={`p-3 rounded-full ${
                        variant === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-lumina-primary/10 text-lumina-primary'
                    }`}>
                        <AlertTriangle className="w-6 h-6" />
                    </div>

                    {/* Textos */}
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">
                            {title}
                        </h3>
                        <p className="mt-2 text-sm text-lumina-muted">
                            {description}
                        </p>
                    </div>
                    
                    {/* Botón Cerrar (X) */}
                    <button onClick={onClose} className="text-lumina-muted hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Footer de Botones */}
                <div className="mt-8 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-lumina-muted hover:bg-white/5 hover:text-white transition-colors disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`px-4 py-2 rounded-lg text-sm font-medium text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                            variant === 'danger' 
                            ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' 
                            : 'bg-lumina-primary hover:bg-indigo-600 shadow-lumina-primary/20'
                        }`}
                    >
                        {isLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        {confirmText}
                    </button>
                </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};