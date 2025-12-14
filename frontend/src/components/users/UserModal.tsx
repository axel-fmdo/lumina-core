import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Save, Loader2, ChevronDown, AlertTriangle } from "lucide-react";
import { motion, easeInOut, AnimatePresence } from "framer-motion";
import api from "../../lib/axios";
import { User } from "../../types";

// Esquema de Validación (Zod)
const userSchema = z.object({
  full_name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres")
    .optional()
    .or(z.literal("")),
  role_id: z.string().min(1, "Debes seleccionar un rol"),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserModalProps {
  onClose: () => void;
  onSuccess: () => void; // Para recargar la tabla al terminar
  userToEdit?: User | null; // Para editar un usuario existente
}

interface Role {
  id: string;
  name: string;
}

export const UserModal = ({ onClose, onSuccess, userToEdit }: UserModalProps) => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const isEditMode = !!userToEdit;

    const { register, handleSubmit, reset, trigger, setError, clearErrors, formState: { errors, isValid } } = useForm<UserFormData>({
        resolver: zodResolver(userSchema),
        mode: "onChange"
    });

    // Función ara validación asíncrona onBlur
    const checkUniqueness = async (field: 'email' , value: string | null | undefined) => {
        // A. Si está vacío, limpiamos errores manuales y dejamos que Zod maneje el "Requerido"
        if (!value) return true; 

        // B. Primero validamos el formato (Zod)
        const isFormatValid = await trigger(field); 
        if (!isFormatValid) return false; // Si Zod falla (ej. muy corto), no llamamos al backend

        // C. Llamamos al Backend
        try {
            await api.get('/users/validate-email-uniqueness', {
                params: { 
                    email: value,
                    user_id: userToEdit?.id // Excluir el actual si editamos
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
                    message: error.response.data.detail || `El correo ya está en uso.` 
                });
                return false;
            }
            return true;
        }
    };

    // Cargar roles y/o el usuario al abrir el modal
    useEffect(() => {

        let isMounted = true;

        api.get("/roles/").then((res) => {
            if (!isMounted) return;
            setRoles(res.data);

            // Solo reseteamos si estamos montados y abiertos
            if (userToEdit) {
                const userRoleName = userToEdit.roles[0];
                const matchingRole = res.data.find((r: Role) => r.name === userRoleName);
                
                reset({
                    full_name: userToEdit.full_name,
                    email: userToEdit.email,
                    role_id: matchingRole?.id || "",
                    password: "" 
                });
            } else {
                reset({
                    full_name: "",
                    email: "",
                    password: "",
                    role_id: ""
                });
            }
        });

    return () => { isMounted = false; };
    }, [ userToEdit]);

    const onSubmit = async (data: UserFormData) => {
        const [isEmailUnique] = await Promise.all([
            checkUniqueness('email', data.email),
        ]);

        if (!isEmailUnique) {
            return;
        }
        try {
            setIsLoading(true);

            if (isEditMode && userToEdit) {
                // Limpiamos password si viene vacío para que el backend lo ignore
                const payload = { ...data };
                if (!payload.password) delete payload.password;

                const result = await api.put(`/users/${userToEdit.id}`, payload);

                if(result){
                    onSuccess(); // Recargar tabla
                    onClose();   // Cerrar modal
                }
            } else {
                const result = await api.post("/users/", data);

                if(result){
                    onSuccess(); // Recargar tabla
                    onClose();   // Cerrar modal
                }
            }
        } catch (error) {
        console.error("Error creando el usuario: ", error);
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
                            Nombre Completo <span className="text-red-500">*</span>
                        </label>
                        <input 
                            {...register("full_name")}
                            className={`w-full bg-lumina-bg/50 border rounded-lg px-4 py-2 text-white outline-none transition-all ${
                                errors.full_name 
                                ? "border-red-500/50 focus:ring-2 focus:ring-red-500/50"
                                : "border-lumina-border focus:ring-2 focus:ring-lumina-primary/50"
                            }`}
                        />
                        {errors.full_name && <p className="text-xs text-red-400">{errors.full_name.message}</p>}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-lumina-muted">
                            Correo Electrónico <span className="text-red-500">*</span>
                        </label>
                        <input 
                            {...register("email")}
                            onBlur={(e) => {
                                    register("email").onBlur(e);
                                    checkUniqueness('email', e.target.value)
                                }}
                            type="email"
                            className={`w-full bg-lumina-bg/50 border rounded-lg px-4 py-2 text-white outline-none transition-all ${
                                errors.email 
                                ? "border-red-500/50 focus:ring-2 focus:ring-red-500/50"
                                : "border-lumina-border focus:ring-2 focus:ring-lumina-primary/50"
                            }`}
                            placeholder="usuario@empresa.com"
                        />
                        {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-lumina-muted">
                            Contraseña <span className="text-red-500">*</span>
                            </label>
                        <input 
                            {...register("password")}
                            type="password"
                            className={`w-full bg-lumina-bg/50 border rounded-lg px-4 py-2 text-white outline-none transition-all ${
                                errors.password 
                                ? "border-red-500/50 focus:ring-2 focus:ring-red-500/50"
                                : "border-lumina-border focus:ring-2 focus:ring-lumina-primary/50"
                            }`}
                            placeholder={isEditMode ? "Dejar vacía para mantener la actual" : ""}
                        />
                        {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
                    </div>

                    {/* Rol */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-lumina-muted">
                            Rol Asignado <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <select 
                            {...register("role_id")}
                            className={`w-full bg-lumina-bg/50 border rounded-lg px-4 py-2 text-white outline-none appearance-none transition-all ${
                                errors.role_id 
                                ? "border-red-500/50 focus:ring-2 focus:ring-red-500/50"
                                : "border-lumina-border focus:ring-2 focus:ring-lumina-primary/50"
                            }`}
                        >
                            <option value="">Selecciona un Rol</option>
                            {roles.map(role => (
                                <option key={role.id} value={role.id}>{role.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/70"/>
                        </div>
                        {errors.role_id && <p className="text-xs text-red-400">{errors.role_id.message}</p>}
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
                            {isEditMode ? "Actualizar Usuario" : "Guardar Usuario"}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};