import { useState, useEffect, useMemo } from "react";
import api from "../lib/axios";
import { Role, Permission } from "../types";
import { Shield, AlertTriangle, ChevronDown, Save, CheckCircle2, Lock } from "lucide-react";

export const SecurityView = () => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    
    const [selectedRoleId, setSelectedRoleId] = useState("");
    const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
    
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Efecto de carga con los roles y los permisos
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [rolesPaginatedRes, permsRes] = await Promise.all([
                    api.get("/roles/", { params: { limit: 100 } }), 
                    api.get("/roles/permissions") 
                ]);
                
                const rolesList = rolesPaginatedRes.data.data || rolesPaginatedRes.data;
                
                setRoles(rolesList); 
                setAllPermissions(permsRes.data);
                
            } catch (error) {
                console.error("Error inicializando seguridad: ", error);
            }
        };
        fetchData();
    }, []);

    // Función para manejar los cambios en el selector de roles
    const handleRoleChange = (roleId: string) => {
        setSelectedRoleId(roleId);
        
        if (!roleId) {
            setSelectedSlugs([]);
            return;
        }

        const role = roles.find(r => r.id === roleId);
        
        if (role && role.permissions) {
            const currentPerms = role.permissions.map(p => p.slug);
            setSelectedSlugs(currentPerms);
        } else {
            setSelectedSlugs([]);
        }
    };

    // Método para cambiar el estado de cada uno de los checks de los permisos
    const togglePermission = (slug: string) => {
        setSelectedSlugs(prev => {
            if (prev.includes(slug)) {
                return prev.filter(s => s !== slug); // Quitar
            } else {
                return [...prev, slug]; // Agregar
            }
        });
    };

    // Función para salvar los cambios
    const handleSave = async () => {
        if (!selectedRoleId) return;
        setSaving(true);
        try {
            const payload = { permissions: selectedSlugs };
            const res = await api.put(`/roles/${selectedRoleId}/permissions`, payload);
            
            // Se actualiza el rol en el estado local para reflejar los cambios sin recargar
            setRoles(prevRoles => prevRoles.map(r => 
                r.id === selectedRoleId ? res.data : r
            ));
            
        } catch (error) {
            console.error("Error guardando permisos: ", error);
        } finally {
            setSaving(false);
        }
    };

    // Agrupación de permisos por módulo
    const groupedPermissions = useMemo(() => {
        const groups: Record<string, Permission[]> = {};
        allPermissions.forEach(p => {
            const key = p.slug.split('_')[0].toUpperCase();
            if (!groups[key]) groups[key] = [];
            groups[key].push(p);
        });
        return groups;
    }, [allPermissions]);

    return (
        <div className="space-y-6 pb-20">
            
            {/* CABECERA */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                        <Shield className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Seguridad</h1>
                        <p className="text-gray-400 text-sm">Control de acceso y privilegios por rol</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-white/5 p-2 rounded-xl border border-white/10">
                    <div className="hidden sm:flex items-center gap-2 px-3 border-r border-white/10">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span className="text-xs text-amber-200/80 font-medium">Zona de Administración</span>
                    </div>
                    
                    <div className="relative min-w-[200px]">
                        <select
                            value={selectedRoleId}
                            onChange={(e) => handleRoleChange(e.target.value)}
                            className="w-full h-10 pl-4 pr-10 rounded-lg border border-white/10 bg-black/40 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                        >
                            <option value="">Seleccionar Rol</option>
                            {roles.map(role => (
                                <option key={role.id} value={role.id}>{role.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/50"/>
                    </div>
                </div>
            </div>

            {/* CONTENIDO DE LA VISTA */}
            {!selectedRoleId ? (
                // SIN ROL SELECCIONADO
                <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
                    <div className="p-4 bg-white/5 rounded-full mb-4">
                        <Lock className="w-8 h-8 text-gray-500" />
                    </div>
                    <h3 className="text-lg font-medium text-white">Ningún rol seleccionado</h3>
                    <p className="text-gray-500 max-w-sm mt-1">Selecciona un rol del menú superior para visualizar y editar sus permisos de acceso.</p>
                </div>
            ) : (
                // CON ROL SELECCIONADO
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {Object.entries(groupedPermissions).map(([groupName, permissions]) => (
                        <div key={groupName} className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden flex flex-col">
                            {/* Cabecera del Grupo */}
                            <div className="px-4 py-3 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                                <h3 className="font-semibold text-indigo-300 text-sm tracking-wider">{groupName}</h3>
                                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-400">
                                    {permissions.filter(p => selectedSlugs.includes(p.slug)).length} / {permissions.length}
                                </span>
                            </div>
                            
                            {/* LISTA DE PERMISOS */}
                            <div className="p-4 space-y-3 flex-1">
                                {permissions.map(perm => {
                                    const isChecked = selectedSlugs.includes(perm.slug);
                                    return (
                                        <label 
                                            key={perm.id} 
                                            className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors border ${
                                                isChecked 
                                                    ? "bg-indigo-500/10 border-indigo-500/30" 
                                                    : "hover:bg-white/5 border-transparent"
                                            }`}
                                        >
                                            <div className="relative flex items-center mt-0.5">
                                                <input 
                                                    type="checkbox"
                                                    className="peer sr-only"
                                                    checked={isChecked}
                                                    onChange={() => togglePermission(perm.slug)}
                                                />
                                                {/* CHECKBOX */}
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                                                    isChecked 
                                                        ? "bg-indigo-500 border-indigo-500 text-white" 
                                                        : "border-gray-600 bg-transparent"
                                                }`}>
                                                    {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                                                </div>
                                            </div>
                                            <div>
                                                <p className={`text-sm font-medium transition-colors ${isChecked ? "text-white" : "text-gray-400"}`}>
                                                    {perm.name}
                                                </p>
                                                <p className="text-xs text-gray-600 mt-0.5 leading-tight">
                                                    {perm.description || "Sin descripción"}
                                                </p>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* BOTÓN DE GUARDADO FLOTANTE */}
            {selectedRoleId && (
                <div className="fixed bottom-6 right-6 z-10 animate-in slide-in-from-bottom-10">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-full shadow-lg shadow-indigo-900/50 font-medium transition-all transform hover:scale-105 disabled:opacity-70 disabled:hover:scale-100"
                    >
                        {saving ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Guardar Cambios
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};