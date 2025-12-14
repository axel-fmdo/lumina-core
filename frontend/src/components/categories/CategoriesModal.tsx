import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Save, Loader2, AlertTriangle } from "lucide-react";
import { motion, easeInOut, AnimatePresence } from "framer-motion";
import api from "../../lib/axios";
import { Category } from "../../types";

// Esquema de Validación (Zod)
const categorySchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryModalProps {
  onClose: () => void;
  onSuccess: () => void; // Para recargar la tabla al terminar
  categoryToEdit?: Category | null; // Para editar un usuario existente
}

export const CategoryModal = ({ onClose, onSuccess, categoryToEdit }: CategoryModalProps) => {
    const [isLoading, setIsLoading] = useState(false);

    const isEditMode = !!categoryToEdit;

    const { register, handleSubmit, reset, trigger, setError, clearErrors, formState: { errors, isValid } } = useForm<CategoryFormData>({
        resolver: zodResolver(categorySchema),
        mode: "onChange"
    });

    // Función ara validación asíncrona onBlur
    const checkUniqueness = async (field: 'name' , value: string | null | undefined) => {
        // A. Si está vacío, limpiamos errores manuales y dejamos que Zod maneje el "Requerido"
        if (!value) return true; 

        // B. Primero validamos el formato (Zod)
        const isFormatValid = await trigger(field); 
        if (!isFormatValid) return false; // Si Zod falla (ej. muy corto), no llamamos al backend

        // C. Llamamos al Backend
        try {
            await api.get('/categories/validate-category-uniqueness', {
                params: { 
                    name: value,
                    category_id: categoryToEdit?.id // Excluir el actual si editamos
                }
            });
            // Si tiene éxito, limpiamos cualquier error previo de unicidad
            clearErrors(field); 
            return true;

        } catch (error: any) {
            if (error.response?.status === 409) {
                // D. INYECTAMOS EL ERROR VISUAL Y EL MENSAJE
                setError(field, { 
                    type: "manual", 
                    message: error.response.data.detail || `El nombre ya está en uso.` 
                });
                return false;
            }
            return true;
        }
    };

    // Cargar roles y/o el usuario al abrir el modal
    useEffect(() => {

        // Solo reseteamos si estamos montados y abiertos
        if (categoryToEdit) {
            // Modo Edición: Llenar formulario
            reset({
                name: categoryToEdit.name,
            });
        } else {
                // Modo Creación: Limpiar
            reset({
                name: "",
            });
        }
    }, [ categoryToEdit]);

    const onSubmit = async (data: CategoryFormData) => {
        const [isNamelUnique] = await Promise.all([
            checkUniqueness('name', data.name),
        ]);

        if (!isNamelUnique) {
            return;
        }
        try {
            setIsLoading(true);

            if (isEditMode && categoryToEdit) {

                const result = await api.put(`/categories/${categoryToEdit.id}`, data);

                if(result){
                    onSuccess(); // Recargar tabla
                    onClose();   // Cerrar modal
                }
            } else {
                const result = await api.post("/categories/", data);

                if(result){
                    onSuccess(); // Recargar tabla
                    onClose();   // Cerrar modal
                }
            }
        } catch (error) {
        console.error("Error creando la categoría: ", error);
        } finally {
        setIsLoading(false);
        }
    };

    const handleClose = (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        reset(); 
        onClose();
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2}}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, ease: easeInOut }}
                className="relative w-full max-w-lg bg-lumina-surface border border-lumina-border/50 rounded-2xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-lumina-border/50 flex justify-between items-center bg-white/5">
                    <h3 className="text-lg font-semibold text-white">{isEditMode ? "Editar Usuario" : "Nuevo Usuario"}</h3>
                    <button type="button" onClick={handleClose} className="text-lumina-muted hover:text-white"><X className="w-5 h-5"/></button>
                </div>

                <AnimatePresence>
                    {!isValid && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3 flex items-center gap-3 overflow-hidden shrink-0"
                        >
                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                            <div className="text-sm text-amber-200/90">
                                <p className="font-medium">Formulario Incompleto</p>
                                <p className="text-xs opacity-80">Por favor completa los campos requeridos y corrige los errores.</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                    
                    {/* Nombre */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-lumina-muted">
                            Nombre de la Categoría <span className="text-red-500">*</span>
                        </label>
                        <input 
                            {...register("name")}
                            onBlur={(e) => {
                                register("name").onBlur(e);
                                checkUniqueness('name', e.target.value)
                            }}
                            className={`w-full bg-lumina-bg/50 border rounded-lg px-4 py-2 text-white outline-none transition-all ${
                                errors.name
                                ? "border-red-500/50 focus:ring-2 focus:ring-red-500/50"
                                : "border-lumina-border focus:ring-2 focus:ring-lumina-primary/50"
                            }`}
                        />
                        {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
                    </div>

                    {/* Acciones */}
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={handleClose} className="px-4 py-2 text-sm text-lumina-muted hover:text-white transition-colors">Cancelar</button>
                        <button 
                            type="submit" 
                            disabled={isLoading || !isValid}
                            className="px-6 py-2 bg-lumina-primary hover:bg-indigo-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-lg shadow-lumina-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                            {isEditMode ? "Actualizar Categoría" : "Guardar Categoría"}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};