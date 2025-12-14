import { useEffect, useState } from "react";
import { Plus, Trash2, Edit, ChevronDown, Users } from "lucide-react";
import api from "../lib/axios";
import { User } from "../types";
import { Table, Column } from "../components/ui/Table";
import { usePermission } from "../hooks/usePermission";
import { Pagination } from "../components/ui/Pagination";
import { DataToolbar } from "../components/ui/DataToolbar";
import { useTableParams } from "../hooks/useTableParams";
import { UserModal } from "../components/users/UserModal";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { AnimatePresence } from "framer-motion";

export const UsersView = () => {
    const { page, limit, search, role, setSearch, setRole, setPage, setLimit, resetFilters, apiParams } = useTableParams();
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [rolesLoaded, setRolesLoaded] = useState(false);
    const [totalUsers, setTotalUsers] = useState(0);
    const [loading, setLoading] = useState(true);
    const { hasPermission } = usePermission();
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);

    // Función para cargar datos
    const fetchUsers = async () => {
        try {
        setLoading(true);
        const { data } = await api.get("/users/get_all_users", { params: apiParams});
        setUsers(data.data);
        setTotalUsers(data.total);
        } catch (error) {
        console.error("Error cargando usuarios", error);
        } finally {
        setLoading(false);
        }
    };

    useEffect(() => {
        if (!rolesLoaded) {
            const response = api.get("/roles/").then((res) => setRoles(res.data));

            if(response){
                setRolesLoaded(true);
            }
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [apiParams.skip, apiParams.limit, apiParams.search, apiParams.role]);

    //Función para ejecutr el borrado
    const handleDeleteUser = async () => {
        if(!userToDelete) return;

        try{
            setIsDeleting(true);
            await api.delete(`/users/${userToDelete.id}`);
            setUserToDelete(null);
            fetchUsers(); // Recargar la lista
        } catch (error) {
            console.error("Error al eliminar el usuario: ", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const closeModals = () => {
        setIsCreateModalOpen(false);
        setUserToEdit(null);
    }

    // Definición de columnas para la tabla
    const columns: Column<User>[] = [
        { 
            header: "Nombre", 
            accessorKey: "full_name",
            render: (user) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-lumina-primary/20 flex items-center justify-center text-lumina-primary text-xs font-bold">
                        {user.full_name.charAt(0)}
                    </div>
                    <span className="font-medium text-white">{user.full_name}</span>
                </div>
            )
        },
        { header: "Email", accessorKey: "email" },
        { 
            header: "Rol", 
            render: (user) => (
                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {user.roles[0] || "N/A"}
                </span>
            )
        },
        { 
            header: "Estado", 
            render: (user) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                    user.is_active 
                    ? "bg-green-500/10 text-green-400 border-green-500/20" 
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}>
                    {user.is_active ? "Activo" : "Inactivo"}
                </span>
            ) 
        },
        {
            header: "Acciones",
            className: "text-right",
            render: (user) => (
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {hasPermission('users_update') && (
                        <button 
                            onClick={() => setUserToEdit(user)}
                            className="p-2 hover:bg-white/10 rounded-lg text-lumina-muted hover:text-white transition-colors"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                    )}
                    {hasPermission('users_delete') && (
                        <button
                            onClick={() => setUserToDelete(user)} 
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
                        <Users className="w-6 h-6 text-lumina-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Usuarios</h1>
                        <p className="text-lumina-muted">Gestión de accesos al sistema</p>
                    </div>
                </div>
                {hasPermission('users_create') && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-lumina-primary hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-lumina-primary/25 active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Nuevo Usuario
                    </button>
                )}
            </div>

            {/* Barra de Herramientas */}
            <DataToolbar
                placeholder="Buscar usuarios por nombre o correo..."
                searchTerm={search} 
                onSearchChange={setSearch} 
                onReset={resetFilters}
            >
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative">
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="h-10 rounded-lg border border-lumina-border bg-lumina-bg/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-lumina-primary/50 transition-all appearance-none cursor-pointer min-w-[150px]"
                        >
                            <option value="">Todos los Roles</option>
                            {roles.map(role => (
                                <option key={role.id} value={role.name}>{role.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/70"/>
                    </div>
                </div>
            </DataToolbar>

            <div className="flex flex-col shadow-2xl rounded-xl">
                {/* Tabla */}
                <Table data={users} columns={columns} isLoading={loading} />

                {/* 6. Paginador */}
                <Pagination 
                    total={totalUsers}
                    page={page}
                    limit={limit}
                    onPageChange={setPage}
                    onLimitChange={setLimit}
                />
            </div>

            {/* Modal para crear un usuario */}
            <AnimatePresence mode="wait">
                {(isCreateModalOpen || !!userToEdit) && (
                    <UserModal
                        onClose={closeModals}
                        onSuccess={() => {
                            fetchUsers(); // Recargar la tabla
                        }}
                        userToEdit={userToEdit}
                    />
                )}
            </AnimatePresence>

            {/* Modal para eliminar un usuario */}
            <ConfirmModal
                isOpen={!!userToDelete}
                onClose={() => setUserToDelete(null)}
                onConfirm={handleDeleteUser}
                title="Eliminar Usuario"
                description={`¿Estás seguro de que deseas eliminar a "${userToDelete?.full_name}"? Esta acción no se puede deshacer.`}
                confirmText="Sí, eliminar"
                variant="danger"
                isLoading={isDeleting}
            />
        </div>
    );
};