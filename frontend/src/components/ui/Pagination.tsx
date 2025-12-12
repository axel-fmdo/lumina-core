import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationProps {
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export const Pagination = ({ total, page, limit, onPageChange, onLimitChange }: PaginationProps) => {
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  if (total === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-4 text-sm text-lumina-muted border border-t-0 border-lumina-border/50 rounded-b-xl bg-lumina-surface/30 backdrop-blur-sm">
      
      {/* Info y Selector de Límite */}
      <div className="flex items-center gap-4">
        <span>Mostrando {start} - {end} de {total}</span>
        <select 
          value={limit} 
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="bg-lumina-bg border border-lumina-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-lumina-primary"
        >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
        </select>
        <span>por pág.</span>
      </div>

      {/* Controles de Navegación */}
      <div className="flex items-center gap-1">
        <button 
            onClick={() => onPageChange(1)} 
            disabled={page === 1}
            className="p-2 hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed"
        >
            <ChevronsLeft className="w-4 h-4" />
        </button>
        <button 
            onClick={() => onPageChange(page - 1)} 
            disabled={page === 1}
            className="p-2 hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed"
        >
            <ChevronLeft className="w-4 h-4" />
        </button>
        
        <span className="px-4 font-medium text-white">
            Página {page} de {totalPages}
        </span>

        <button 
            onClick={() => onPageChange(page + 1)} 
            disabled={page >= totalPages}
            className="p-2 hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed"
        >
            <ChevronRight className="w-4 h-4" />
        </button>
        <button 
            onClick={() => onPageChange(totalPages)} 
            disabled={page >= totalPages}
            className="p-2 hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed"
        >
            <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};