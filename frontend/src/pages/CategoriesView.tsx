import { useEffect, useState } from "react";
import { Plus, Trash2, Edit, Tags } from "lucide-react";
import api from "../lib/axios";
import { Category } from "../types";
import { Table, Column } from "../components/ui/Table";
import { usePermission } from "../hooks/usePermission";
import { Pagination } from "../components/ui/Pagination";
import { DataToolbar } from "../components/ui/DataToolbar";
import { useTableParams } from "../hooks/useTableParams";
import { CategoryModal } from "../components/categories/CategoriesModal";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { AnimatePresence } from "framer-motion";

export const CategoriesView = () => {
    const { page, limit, search, setSearch, setPage, setLimit, resetFilters, apiParams } = useTableParams();
    const [categories, setCategories] = useState<Category[]>([]);
    const [totalCategories, setTotalCategories] = useState(0);
    const [loading, setLoading] = useState(true);
    const { hasPermission } = usePermission();
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);

    // Función para cargar datos
    const fetchCategories = async () => {
        try {
            setLoading(true);
            const { data } = await api.get("/categories/", { params: apiParams});

            if(data){
                setCategories(data.data);
                setTotalCategories(data.total);
            }
            
        } catch (error) {
            console.error("Error cargando categorías", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, [apiParams.skip, apiParams.limit, apiParams.search]);

    // Función para ejecutr el borrado
    const handleDeleteCategory = async () => {
        if(!categoryToDelete) return;

        try{
            setIsDeleting(true);
            const response = await api.delete(`/categories/${categoryToDelete.id}`);

            if(response){
                setCategoryToDelete(null);
                fetchCategories();
            }
            
        } catch (error) {
            console.error("Error al eliminar la categoría: ", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const closeModals = () => {
        setIsCreateModalOpen(false);
        setCategoryToEdit(null);
    }

    // Definición de columnas para la tabla Categorías
    const columns: Column<Category>[] = [
        { 
            header: "Nombre", 
            accessorKey: "name",
            render: (user) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-lumina-primary/20 flex items-center justify-center text-lumina-primary text-xs font-bold">
                        {user.name.charAt(0)}
                    </div>
                    <span className="font-medium text-white">{user.name}</span>
                </div>
            )
        },
        {
            header: "Acciones",
            className: "text-right",
            render: (category) => (
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {hasPermission('categories_update') && (
                        <button 
                            onClick={() => setCategoryToEdit(category)}
                            className="p-2 hover:bg-white/10 rounded-lg text-lumina-muted hover:text-white transition-colors"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                    )}
                    {hasPermission('categories_delete') && (
                        <button
                            onClick={() => setCategoryToDelete(category)} 
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
                        <Tags className="w-6 h-6 text-lumina-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Categorías</h1>
                        <p className="text-lumina-muted">Gestión de las categorías de activos</p>
                    </div>
                </div>
                {hasPermission('categories_create') && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-lumina-primary hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-lumina-primary/25 active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Nueva Categoría
                    </button>
                )}
            </div>

            {/* BARRA CON BUSCADOR */}
            <DataToolbar
                placeholder="Buscar categoría..."
                searchTerm={search} 
                onSearchChange={setSearch} 
                onReset={resetFilters}
            >
            </DataToolbar>

            <div className="flex flex-col shadow-2xl rounded-xl">
                {/* TABLA */}
                <Table data={categories} columns={columns} isLoading={loading} />

                {/* PAGINADOR */}
                <Pagination 
                    total={totalCategories}
                    page={page}
                    limit={limit}
                    onPageChange={setPage}
                    onLimitChange={setLimit}
                />
            </div>

            {/* MODAL PARA CREAR UNA CATEGORÍA */}
            {<AnimatePresence mode="wait">
                {(isCreateModalOpen || !!categoryToEdit) && (
                    <CategoryModal
                        onClose={closeModals}
                        onSuccess={() => {
                            fetchCategories();
                        }}
                        categoryToEdit={categoryToEdit}
                    />
                )}
            </AnimatePresence>}

            {/* MODAL PARA ELIMINAR UNA CATEGORÍA */}
            <AnimatePresence mode="wait">
                {(!!categoryToDelete) && (
                    <ConfirmModal
                        onClose={() => setCategoryToDelete(null)}
                        onConfirm={handleDeleteCategory}
                        title="Eliminar Categoría"
                        description={`¿Estás seguro de que deseas eliminar la Categoría "${categoryToDelete?.name}"? Esta acción no se puede deshacer.`}
                        confirmText="Sí, eliminar"
                        variant="danger"
                        isLoading={isDeleting}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};