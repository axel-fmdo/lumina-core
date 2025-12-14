import { useEffect, useState } from "react";
import { Plus, Trash2, Edit, ChevronDown, Box, Smartphone, Monitor, Cpu, UserPlus, UserMinus } from "lucide-react";
import api from "../lib/axios";
import { Asset, AssetStatus } from "../types";
import { Table, Column } from "../components/ui/Table";
import { usePermission } from "../hooks/usePermission";
import { Pagination } from "../components/ui/Pagination";
import { DataToolbar } from "../components/ui/DataToolbar";
import { useTableParams } from "../hooks/useTableParams";
import { AssetModal } from "../components/assets/AssetModal";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { UserSelectModal } from "../components/assets/UserSelectModal";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// Helper para colores de estado (Badge)
const getStatusColor = (status: AssetStatus) => {
    switch (status) {
      case AssetStatus.AVAILABLE: return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case AssetStatus.ASSIGNED: return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case AssetStatus.MAINTENANCE: return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case AssetStatus.RETIRED: return "bg-red-500/10 text-red-400 border-red-500/20";
      default: return "bg-slate-500/10 text-slate-400";
    }
};

// Helper para iconos según categoría
const getCategoryIcon = (category: string) => {
    if (category.includes("Móvil")) return <Smartphone className="w-4 h-4" />;
    if (category.includes("Monitor")) return <Monitor className="w-4 h-4" />;
    return <Cpu className="w-4 h-4" />;
};

export const AssetsView = () => {
    const { page, limit, search, category, status, setSearch, setCategory, setStatus, setPage, setLimit, resetFilters, apiParams } = useTableParams();
    const [assets, setAssets] = useState<Asset[]>([]);
    //const [categories, setCategories] = useState<Category[]>([]);  //Pendiente de endpoint
    //const [categoriesLoaded, setCategoriesLoaded] = useState(false);
    const [totalAssets, setTotalAssets] = useState(0);
    const [loading, setLoading] = useState(true);
    const { hasPermission } = usePermission();
    const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [assetToEdit, setAssetToEdit] = useState<Asset | null>(null);
    //Estados para la asignación de equipos
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedAssetForAction, setSelectedAssetForAction] = useState<Asset | null>(null);
    const [isActionLoading, setIsActionLoading] = useState(false);
    //Estados para la desvinculación de equipos
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [assetToReturn, setAssetToReturn] = useState<Asset | null>(null);
    const [isReturnLoading, setIsReturnLoading] = useState(false);

    // Función para cargar datos
    const fetchAssets = async () => {
        try {
        setLoading(true);
        const { data } = await api.get("/assets/get_all_assets", { params: apiParams});
        setAssets(data.data);
        setTotalAssets(data.total);
        } catch (error) {
        console.error("Error cargando activos", error);
        } finally {
        setLoading(false);
        }
    };

    /*useEffect(() => {
        if (!categoriesLoaded) {
            const response = api.get("/categories/").then((res) => setCategories(res.data));

            if(response){
                setCategoriesLoaded(true);
            }
        }
    }, []); */

    useEffect(() => {
        fetchAssets();
    }, [apiParams.skip, apiParams.limit, apiParams.search, apiParams.category, apiParams.status]);

    //Funciones para la lógica de asignación de equipos
    const openAssignModal = (asset: Asset) => {
        setSelectedAssetForAction(asset);
        setIsAssignModalOpen(true);
    };

    const handleAssignUser = async (userId: string) => {
        if (!selectedAssetForAction) return;

        setIsActionLoading(true);
        try {
            await api.post(`/assets/${selectedAssetForAction.id}/assign`, { user_id: userId });
            toast.success("Activo asignado correctamente");
            setIsAssignModalOpen(false);
            setSelectedAssetForAction(null);
            fetchAssets(); // Recargar tabla para ver cambios
        } catch (error: any) {
            toast.error("Error al asignar", { description: error.response?.data?.detail });
        } finally {
            setIsActionLoading(false);
        }
    };

    //Funciones para la lógica de devolver equipos
    const handleRequestReturn = (asset: Asset) => {
        setAssetToReturn(asset);
        setIsReturnModalOpen(true);
    };

    const executeReturnAsset = async () => {
        if (!assetToReturn) return;

        setIsReturnLoading(true);
        try {
            await api.post(`/assets/${assetToReturn.id}/return`);
            toast.success(`Activo ${assetToReturn.internal_code} devuelto`);
            fetchAssets();
            setIsReturnModalOpen(false);
            setAssetToReturn(null);
        } catch (error: any) {
            toast.error("Error al devolver", { description: error.response?.data?.detail });
        } finally {
            setIsReturnLoading(false);
        }
    };

    //Función para ejecutr el borrado
    const handleDeleteAsset = async () => {
        if(!assetToDelete) return;

        try{
            setIsDeleting(true);
            await api.delete(`/assets/${assetToDelete.id}`);
            setAssetToDelete(null);
            fetchAssets(); // Recargar la lista
        } catch (error) {
            console.error("Error al eliminar el activo: ", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const closeModals = () => {
        setIsCreateModalOpen(false);
        setAssetToEdit(null);
    };

    // 6. Definición de Columnas
    const columns: Column<Asset>[] = [
        {
            header: "Código",
            accessorKey: "internal_code",
            render: (asset) => (
                <span className="font-mono text-xs text-lumina-primary bg-lumina-primary/10 px-2 py-1 rounded border border-lumina-primary/20">
                    {asset.internal_code}
                </span>
            )
        },
        {
            header: "Activo",
            render: (asset) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-lumina-surface border border-lumina-border flex items-center justify-center text-lumina-muted">
                        {getCategoryIcon(asset.category)}
                    </div>
                    <div>
                        <div className="text-sm font-medium text-white">{asset.name}</div>
                        {asset.serial_number && (
                            <div className="text-xs text-lumina-muted">S/N: {asset.serial_number}</div>
                        )}
                    </div>
                </div>
            )
        },
        { header: "Categoría", accessorKey: "category" },
        {
            header: "Estado",
            render: (asset) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(asset.status)}`}>
                    {asset.status}
                </span>
            )
        },
        {
            header: "Asignado A",
            accessorKey: "assigned_to",
            render: (asset: Asset) => {
                // Si no hay usuario asignado (null o undefined)
                if (!asset.assigned_to) {
                    return <span className="text-lumina-muted text-sm">-</span>;
                }

                // Si hay usuario, mostramos Avatar + Nombre
                return (
                    <div className="flex items-center gap-2">
                        {/* Avatar con inicial */}
                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold border border-indigo-500/30 shrink-0">
                            {asset.assigned_to.full_name.charAt(0).toUpperCase()}
                        </div>
                        {/* Nombre truncado */}
                        <span className="text-gray-300 text-sm truncate max-w-[140px]" title={asset.assigned_to.full_name}>
                            {asset.assigned_to.full_name}
                        </span>
                    </div>
                );
            }
        },
        {
            header: "Acciones",
            className: "text-right",
            render: (asset) => (
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* ASIGNAR (Solo si Available) */}
                    {asset.status === AssetStatus.AVAILABLE && (
                        <button 
                            onClick={() => openAssignModal(asset)}
                            className="p-1.5 text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors tooltip"
                            title="Asignar a Usuario"
                        >
                            <UserPlus className="w-4 h-4" />
                        </button>
                    )}

                    {/* DEVOLVER (Solo si Assigned) */}
                    {asset.status === AssetStatus.ASSIGNED && (
                        <button 
                             onClick={() => handleRequestReturn(asset)}
                            className="p-1.5 text-amber-400 hover:bg-amber-400/10 rounded-lg transition-colors"
                            title="Devolver / Desvincular"
                        >
                            <UserMinus className="w-4 h-4" />
                        </button>
                    )}

                    {hasPermission('assets_update') && (
                        <button 
                            onClick={() => setAssetToEdit(asset)}
                            className="p-2 hover:bg-white/10 rounded-lg text-lumina-muted hover:text-white transition-colors"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                    )}
                    {hasPermission('assets_delete') && (
                        <button
                            onClick={() => setAssetToDelete(asset)} 
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
                            <Box className="w-6 h-6 text-lumina-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Activos</h1>
                            <p className="text-lumina-muted">Gestión de hardware y equipos de la empresa</p>
                        </div>
                    </div>
                    {hasPermission('assets_create') && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 bg-lumina-primary hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-lumina-primary/25 active:scale-95"
                        >
                            <Plus className="w-5 h-5" />
                            Nuevo Activo
                        </button>
                    )}
                </div>
    
                {/* Barra de Herramientas */}
                <DataToolbar
                    placeholder="Buscar activos por nombre, código o serie..."
                    searchTerm={search} 
                    onSearchChange={setSearch} 
                    onReset={resetFilters}
                >
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative">
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="h-10 rounded-lg border border-lumina-border bg-lumina-bg/50 px-3 pr-9 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-lumina-primary/50 transition-all appearance-none cursor-pointer w-auto"
                            >
                                <option value="">Todas las categorías</option>
                                <option value="Cómputo">Cómputo</option>
                                <option value="Periféricos">Periféricos</option>
                                <option value="Móvil">Móvil</option>
                                <option value="Mobiliario">Mobiliario</option>
                            </select>
                            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/70"/>
                        </div>
                        <div className="relative">
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="h-10 rounded-lg border border-lumina-border bg-lumina-bg/50 px-3 pr-9 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-lumina-primary/50 transition-all appearance-none cursor-pointer w-auto"
                            >
                                <option value="">Todos los estados</option>
                                {Object.values(AssetStatus).map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/70"/>
                        </div>
                    </div>
                </DataToolbar>
    
                <div className="flex flex-col shadow-2xl rounded-xl">
                    {/* Tabla */}
                    <Table data={assets} columns={columns} isLoading={loading} />
    
                    {/* 6. Paginador */}
                    <Pagination 
                        total={totalAssets}
                        page={page}
                        limit={limit}
                        onPageChange={setPage}
                        onLimitChange={setLimit}
                    />
                </div>
    
                {/* Modal para crear un Activo */}
                <AnimatePresence mode="wait">
                    {(isCreateModalOpen || !!assetToEdit) && (
                        <AssetModal
                            onClose={closeModals}
                            onSuccess={() => {
                                fetchAssets(); // Recargar la tabla
                            }}
                            assetToEdit={assetToEdit}
                        />
                    )}
                </AnimatePresence>

                {/* Modal para asingar el Activo a un Usuario */}
                <AnimatePresence mode="wait">
                    {isAssignModalOpen && (
                        <UserSelectModal 
                            onClose={() => { setIsAssignModalOpen(false); setSelectedAssetForAction(null); }}
                            onSelect={handleAssignUser}
                            isLoadingAction={isActionLoading}
                        />
                    )}
                </AnimatePresence>

                {/* Modal para devincular el Activo de un Usario */}
                <AnimatePresence mode="wait">
                    {isReturnModalOpen && assetToReturn && (
                        <ConfirmModal 
                            onClose={() => setIsReturnModalOpen(false)}
                            onConfirm={executeReturnAsset}
                            title="Confirmar Devolución"
                            description={`¿Estás seguro de desvincular el activo "${assetToReturn.name}" (${assetToReturn.internal_code}) del usuario actual? Pasará a estado Disponible.`}
                            confirmText="Sí, Devolver"
                            variant="warning"
                            isLoading={isReturnLoading}
                        />
                    )}
                </AnimatePresence>
    
                {/* Modal para eliminar un usuario */}
                <AnimatePresence mode="wait">
                    {!!assetToDelete && (
                        <ConfirmModal
                            onClose={() => setAssetToDelete(null)}
                            onConfirm={handleDeleteAsset}
                            title="Eliminar Activo"
                            description={`¿Estás seguro de que deseas eliminar el activo "${assetToDelete?.internal_code} -${assetToDelete?.name}"? Esta acción no se puede deshacer.`}
                            confirmText="Sí, dar de baja"
                            variant="danger"
                            isLoading={isDeleting}
                        />
                    )}
                </AnimatePresence>
        </div>
    );
}