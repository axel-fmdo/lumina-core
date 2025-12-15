import { useEffect, useState } from "react";
import { Plus, Trash2, Edit, UserCog } from "lucide-react";
import api from "../lib/axios";
import { RoleData, type Role } from "../types";
import { Table, Column } from "../components/ui/Table";
import { usePermission } from "../hooks/usePermission";
import { Pagination } from "../components/ui/Pagination";
import { DataToolbar } from "../components/ui/DataToolbar";
import { useTableParams } from "../hooks/useTableParams";
import { RoleModal } from "../components/roles/RolesModal";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { AnimatePresence } from "framer-motion";

export const RolesView = () => {
    const { page, limit, search, setSearch, setPage, setLimit, resetFilters, apiParams } = useTableParams();
    const [roles, setRoles] = useState<RoleData[]>([]);
    const [totalRoles, setTotalRoles] = useState(0);
    const [loading, setLoading] = useState(true);
    const { hasPermission } = usePermission();
    const [roleToDelete, setRoleToDelete] = useState<RoleData | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [roleToEdit, setRoleToEdit] = useState<RoleData | null>(null);

    // Función para cargar datos
    const fetchRoles = async () => {
        try {
        setLoading(true);
        const { data } = await api.get("/roles/", { params: apiParams});
            setRoles(data.data);
            setTotalRoles(data.total);
            } catch (error) {
            console.error("Error cargando roles", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, [apiParams.skip, apiParams.limit, apiParams.search]);

    //Función para ejecutr el borrado
    const handleDeleteRole = async () => {
        if(!roleToDelete) return;

        try{
            setIsDeleting(true);
            const response = await api.delete(`/roles/${roleToDelete.id}`);
            
            if(response){
                setRoleToDelete(null);
                fetchRoles(); // Recargar la lista
            }
        } catch (error) {
            console.error("Error al eliminar el rol: ", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const closeModals = () => {
        setIsCreateModalOpen(false);
        setRoleToEdit(null);
    }

    // Definición de columnas para la tabla
    const columns: Column<RoleData>[] = [
        { 
            header: "Nombre", 
            accessorKey: "name",
            render: (role) => (
                <div className="flex items-center gap-3">
                    <span className="font-medium text-white">{role.name}</span>
                </div>
            )
        },
        { 
            header: "Descripción", 
            accessorKey: "description",
            render: (role) => (
                <div className="flex items-center gap-3">
                    <span className="font-medium text-white">{role.description}</span>
                </div>
            )
        },
        {
            header: "Acciones",
            className: "text-right",
            render: (role) => (
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {hasPermission('roles_update') && (
                        <button 
                            onClick={() => setRoleToEdit(role)}
                            className="p-2 hover:bg-white/10 rounded-lg text-lumina-muted hover:text-white transition-colors"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                    )}
                    {hasPermission('roles_delete') && (
                        <button
                            onClick={() => setRoleToDelete(role)} 
                            className="p-2 hover:bg-red-500/20 rounded-lg text-lumina-muted hover:text-red-400 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-lumina-primary/10 rounded-lg">
                        <UserCog className="w-6 h-6 text-lumina-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Roles</h1>
                        <p className="text-lumina-muted">Gestión de los roles del sistema</p>
                    </div>
                </div>
                {hasPermission('roles_create') && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-lumina-primary hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-lumina-primary/25 active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Nuevo Rol
                    </button>
                )}
            </div>

            {/* Barra de Herramientas */}
            <DataToolbar
                placeholder="Buscar rol..."
                searchTerm={search} 
                onSearchChange={setSearch} 
                onReset={resetFilters}
            >
            </DataToolbar>

            <div className="flex flex-col shadow-2xl rounded-xl">
                {/* Tabla */}
                <Table data={roles} columns={columns} isLoading={loading} />

                {/* 6. Paginador */}
                <Pagination 
                    total={totalRoles}
                    page={page}
                    limit={limit}
                    onPageChange={setPage}
                    onLimitChange={setLimit}
                />
            </div>

            {/* Modal para crear un usuario */}
            {<AnimatePresence mode="wait">
                {(isCreateModalOpen || !!roleToEdit) && (
                    <RoleModal
                        onClose={closeModals}
                        onSuccess={() => {
                            fetchRoles(); // Recargar la tabla
                        }}
                        roleToEdit={roleToEdit}
                    />
                )}
            </AnimatePresence>}

            {/* Modal para eliminar un usuario */}
            <AnimatePresence mode="wait">
                {(!!roleToDelete) && (
                    <ConfirmModal
                        onClose={() => setRoleToDelete(null)}
                        onConfirm={handleDeleteRole}
                        title="Eliminar Rol"
                        description={`¿Estás seguro de que deseas eliminar el rol "${roleToDelete?.name}"? Esta acción no se puede deshacer.`}
                        confirmText="Sí, eliminar"
                        variant="danger"
                        isLoading={isDeleting}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};