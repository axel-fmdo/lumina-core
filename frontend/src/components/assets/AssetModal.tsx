import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Category } from "../../types";
import { z } from "zod";
import { X, Save, Loader2, ChevronDown, AlertTriangle } from "lucide-react";
import { motion, easeInOut, AnimatePresence } from "framer-motion";
import api from "../../lib/axios";
import { Asset, AssetStatus } from "../../types";
import { toast } from "sonner";

// Esquema de Validación (Zod)
const assetSchema = z.object({
    name: z.string().min(1, "El nombre es requerido."),
    internal_code: z.string().min(1, "El código interno es requerido."),
    serial_number: z.string().optional().nullable().transform(e => e === "" ? null : e),
    category_id: z.string().min(1, "Selecciona una categoría."),
    model: z.string().optional(),
    status: z.nativeEnum(AssetStatus),
    cost: z.number()
       .or(z.nan()) // Permitimos que entre NaN (campo vacío)
       .refine((val) => !Number.isNaN(val), { message: "Ingresa un monto válido" }) // Validamos nosotros en español
       .refine((val) => val >= 0, { message: "El costo no puede ser negativo" }) // Validamos rango
       .optional(),
    description: z.string().optional()
});

type AssetFormData = z.infer<typeof assetSchema>;

interface AssetModalProps {
  onClose: () => void;
  onSuccess: () => void; // Para recargar la tabla al terminar
  assetToEdit?: Asset | null; // Para editar un usuario existente
}

export const AssetModal = ({ onClose, onSuccess, assetToEdit}: AssetModalProps) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const isEditMode = !!assetToEdit;

    const { register, handleSubmit, reset, trigger, formState: { errors, isValid }, setError, clearErrors } = useForm<AssetFormData>({
        resolver: zodResolver(assetSchema) as any,
        mode: "onChange",
        defaultValues: {
            status: AssetStatus.AVAILABLE,
            cost: 0
        }
    });

    // Función ara validación asíncrona onBlur
    const checkUniqueness = async (field: 'internal_code' | 'serial_number', value: string | null | undefined) => {
        // A. Si está vacío, limpiamos errores manuales y dejamos que Zod maneje el "Requerido"
        if (!value) return true; 

        // B. Primero validamos el formato (Zod)
        const isFormatValid = await trigger(field); 
        if (!isFormatValid) return false; // Si Zod falla (ej. muy corto), no llamamos al backend

        // C. Llamamos al Backend
        try {
            await api.get('/assets/validate-asset-uniqueness', {
                params: { 
                    value: value, 
                    field: field, 
                    asset_id: assetToEdit?.id // Excluir el actual si editamos
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
                    message: error.response.data.detail || `El valor ya está en uso.` 
                });
                return false;
            }
            return true;
        }
    };

    // Cargar categorías y/o el activo al abrir el modal
    useEffect(() => {        
        let isMounted = true;

        api.get("/categories/select").then((res) => {
            if (!isMounted) return;
            setCategories(res.data);

            // Solo reseteamos si estamos montados y abiertos
            if (assetToEdit) {
                // Modo Edición: Llenar formulario
                reset({
                name: assetToEdit.name,
                internal_code: assetToEdit.internal_code,
                serial_number: assetToEdit.serial_number || "",
                category_id: assetToEdit.category.id,
                model: assetToEdit.model || "",
                status: assetToEdit.status,
                cost: assetToEdit.cost || 0,
                description: assetToEdit.description || "",
                });
            } else {
                // Modo Creación: Limpiar
                reset({
                name: "",
                internal_code: "",
                serial_number: "",
                category_id: "",
                model: "",
                status: AssetStatus.AVAILABLE,
                cost: 0,
                description: ""
                });
            }
        });

        return () => { isMounted = false; };
    }, [ assetToEdit]);

    const onError = (errors: any) => {
        // Si hay error específicamente en el costo
        if (errors.cost) {
            toast.error("Atención", { 
                description: errors.cost.message || "Verifica el campo de costo" 
            });
        }
        
        // Opcional: Si quieres avisar de errores generales
        // else {
        //    toast.warning("Formulario incompleto", { description: "Por favor revisa los campos marcados en rojo" });
        // }
    };

    const onSubmit = async (data: AssetFormData) => {
        const [isCodeUnique, isSerialUnique] = await Promise.all([
            checkUniqueness('internal_code', data.internal_code),
            checkUniqueness('serial_number', data.serial_number)
        ]);

        if (!isCodeUnique || !isSerialUnique) {
            return;
        }

        try {
            setIsLoading(true);

            if (isEditMode && assetToEdit) {

                const result = await api.put(`/assets/${assetToEdit.id}`, data);

                if(result){
                    onSuccess(); // Recargar tabla
                    onClose();   // Cerrar modal
                }
            } else {
                const result = await api.post("/assets/", data);

                if(result){
                    onSuccess(); // Recargar tabla
                    onClose();   // Cerrar modal
                }
            }
        } catch (error: any) {
            // Manejar errores de validación de unicidad que se colaron (409)
            const errorDetail = error.response?.data?.detail;
            if (error.response?.status === 409 && typeof errorDetail === 'string') {
                // Ejemplo: El código 'LAP-001' ya está en uso.
                if (errorDetail.includes('código')) {
                    setError('internal_code', { type: 'manual', message: errorDetail });
                } else if (errorDetail.includes('serial')) {
                    setError('serial_number', { type: 'manual', message: errorDetail });
                }
            }
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
                    <h3 className="text-lg font-semibold text-white">{isEditMode ? "Editar Activo" : "Nuevo Activo"}</h3>
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
                <form onSubmit={handleSubmit(onSubmit, onError)} className="p-6 space-y-4">
                    
                    {/* Nombre y Código Interno */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-lumina-muted">Nombre <span className="text-red-500">*</span></label>
                            <input 
                                {...register("name")} 
                                className={`w-full bg-lumina-bg/50 border rounded-lg px-4 py-2 text-white outline-none transition-all ${
                                    errors.name 
                                    ? "border-red-500/50 focus:ring-2 focus:ring-red-500/50"
                                    : "border-lumina-border focus:ring-2 focus:ring-lumina-primary/50"
                                }`}  
                            />
                            {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-lumina-muted">Código Interno <span className="text-red-500">*</span></label>
                            <input 
                                {...register("internal_code")}
                                onBlur={(e) => {
                                    register("internal_code").onBlur(e);
                                    checkUniqueness('internal_code', e.target.value)
                                }}
                                className={`w-full bg-lumina-bg/50 border rounded-lg px-4 py-2 text-white outline-none transition-all ${
                                    errors.internal_code 
                                    ? "border-red-500/50 focus:ring-2 focus:ring-red-500/50"
                                    : "border-lumina-border focus:ring-2 focus:ring-lumina-primary/50"
                                }`} 
                            />
                            {errors.internal_code && <p className="text-xs text-red-400">{errors.internal_code.message}</p>}
                        </div>
                    </div>

                    {/* Categoría y Estatus */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-lumina-muted">Categoría <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <select 
                                    {...register("category_id")} 
                                    className={`w-full bg-lumina-bg/50 border rounded-lg px-4 py-2 text-white outline-none appearance-none transition-all ${
                                        errors.category_id 
                                        ? "border-red-500/50 focus:ring-2 focus:ring-red-500/50"
                                        : "border-lumina-border focus:ring-2 focus:ring-lumina-primary/50"
                                    }`} 
                                >
                                    <option value="">Seleccionar Categoría</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>{category.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/70"/>
                            </div>
                            {errors.category_id && <p className="text-xs text-red-400">{errors.category_id.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-lumina-muted">Estado <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <select 
                                    {...register("status")}
                                    disabled={assetToEdit?.status === AssetStatus.ASSIGNED} 
                                    className={`w-full bg-lumina-bg/50 border rounded-lg px-4 py-2 text-white outline-none appearance-none transition-all ${
                                        errors.status
                                        ? "border-red-500/50 focus:ring-2 focus:ring-red-500/50"
                                        : "border-lumina-border focus:ring-2 focus:ring-lumina-primary/50"
                                    }`} 
                                >
                                    {Object.values(AssetStatus)
                                        .filter(status => {
                                            // 1. Siempre ocultar 'Asignado' de la lista de selección manual
                                            // (A menos que sea el estado actual, para que se vea en el input desactivado)
                                            if (status === AssetStatus.ASSIGNED && assetToEdit?.status !== AssetStatus.ASSIGNED) return false;

                                            // 2. En Modo Creación: Ocultar 'De Baja' (RETIRED)
                                            if (!isEditMode && status === AssetStatus.RETIRED) return false;

                                            return true;
                                        })
                                        .map((status) => (
                                            <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/70"/>
                            </div>
                            {errors.status && <p className="text-xs text-red-400">{errors.status.message}</p>}
                        </div>
                    </div>

                    {/* Modelo, Serial y Costo */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-lumina-muted">Modelo</label>
                            <input 
                                {...register("model")} 
                                className={`w-full bg-lumina-bg/50 border rounded-lg px-4 py-2 text-white outline-none transition-all ${
                                    errors.model
                                    ? "border-red-500/50 focus:ring-2 focus:ring-red-500/50"
                                    : "border-lumina-border focus:ring-2 focus:ring-lumina-primary/50"
                                }`} 
                            />
                            {errors.model && <p className="text-xs text-red-400">{errors.model.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-lumina-muted">Serial</label>
                            <input 
                                {...register("serial_number")} 
                                onBlur={(e) => {
                                    register("serial_number").onBlur(e);
                                    checkUniqueness('serial_number', e.target.value);
                                }}
                                className={`w-full bg-lumina-bg/50 border rounded-lg px-4 py-2 text-white outline-none transition-all ${
                                    errors.serial_number
                                    ? "border-red-500/50 focus:ring-2 focus:ring-red-500/50"
                                    : "border-lumina-border focus:ring-2 focus:ring-lumina-primary/50"
                                }`} 
                            />
                            {errors.serial_number && <p className="text-xs text-red-400">{errors.serial_number.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-lumina-muted">Costo ($)</label>
                            <input 
                                type="number" 
                                step="0.01" 
                                {...register("cost", { valueAsNumber: true})} 
                                className={`w-full bg-lumina-bg/50 border rounded-lg px-4 py-2 text-white outline-none transition-all ${
                                    errors.cost 
                                    ? "border-red-500/50 focus:ring-2 focus:ring-red-500/50"
                                    : "border-lumina-border focus:ring-2 focus:ring-lumina-primary/50"
                                }`}  
                            />
                            {errors.cost && <p className="text-xs text-red-400">{errors.cost.message}</p>}
                        </div>
                    </div>

                    {/* Descripción */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-lumina-muted">Descripción / Notas</label>
                        <textarea 
                            {...register("description")} 
                            rows={3} 
                            className={`w-full bg-lumina-bg/50 border rounded-lg px-4 py-2 text-white outline-none transition-all ${
                                errors.description
                                ? "border-red-500/50 focus:ring-2 focus:ring-red-500/50"
                                : "border-lumina-border focus:ring-2 focus:ring-lumina-primary/50"
                            }`}  
                            placeholder="Detalles adicionales sobre el estado físico, proveedor, etc." 
                        />
                        {errors.description && <p className="text-xs text-red-400">{errors.description.message}</p>}
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
                            {isEditMode ? "Actualizar Activo" : "Guardar Activo"}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}