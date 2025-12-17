import { motion, easeInOut } from "framer-motion";
import { AlertTriangle, Info, Trash2, X } from "lucide-react";

interface ConfirmModalProps {
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "info" | "warning"; 
  isLoading?: boolean;
}

export const ConfirmModal = ({
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger",
  isLoading = false
}: ConfirmModalProps) => {

  // Estilos del modal
  const styles = {
    danger: {
      border: "border-red-500/30",
      bar: "bg-red-500",
      iconBg: "bg-red-500/10 text-red-500",
      button: "bg-red-500 hover:bg-red-600 shadow-red-500/20",
      icon: <Trash2 className="w-6 h-6" />
    },
    warning: {
      border: "border-amber-500/30",
      bar: "bg-amber-500",
      iconBg: "bg-amber-500/10 text-amber-500",
      button: "bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/20",
      icon: <AlertTriangle className="w-6 h-6" />
    },
    info: {
      border: "border-lumina-primary/30",
      bar: "bg-lumina-primary",
      iconBg: "bg-lumina-primary/10 text-lumina-primary",
      button: "bg-lumina-primary hover:bg-indigo-600 shadow-lumina-primary/20",
      icon: <Info className="w-6 h-6" />
    }
  };

  const currentStyle = styles[variant];

  return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            
          {/* BACKDROP */}
          <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={!isLoading ? onClose : undefined}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* MODAL PANEL */}
          <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: easeInOut }}
              className={`relative w-full max-w-md overflow-hidden rounded-2xl border bg-lumina-surface shadow-2xl ${currentStyle.border}`}
          >
            {/* CABECERA */}
            <div className={`h-2 w-full ${currentStyle.bar}`} />

            <div className="p-6">
                <div className="flex items-start gap-4">
                    {/* ÍCONO */}
                    <div className={`p-3 rounded-full shrink-0 ${currentStyle.iconBg}`}>
                        {currentStyle.icon}
                    </div>

                    {/* TEXTO */}
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">
                            {title}
                        </h3>
                        <p className="mt-2 text-sm text-lumina-muted">
                            {description}
                        </p>
                    </div>
                    
                    {/* BOTÓN PARA CERRARr */}
                    <button onClick={onClose} className="text-lumina-muted hover:text-white transition-colors" disabled={isLoading}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* BOTONES */}
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
                        className={`px-4 py-2 rounded-lg text-sm font-medium text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${currentStyle.button}`}
                    >
                        {isLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        {confirmText}
                    </button>
                </div>
            </div>

          </motion.div>
        </div>
  );
};