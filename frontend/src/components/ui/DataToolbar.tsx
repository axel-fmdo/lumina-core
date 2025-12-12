import { Search, X, RefreshCcw } from "lucide-react";
import { ReactNode } from "react";

interface DataToolbarProps {
    placeholder: string;
    searchTerm: string;
    onSearchChange: (value: string) => void;
    onReset: () => void;
    children?: ReactNode; // Para inyectar filtros extra
}

export const DataToolbar = ({ placeholder, searchTerm, onSearchChange, onReset, children }: DataToolbarProps) => {
    const resetSearchBar = () => {
        onSearchChange("");
    };
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Buscador Global */}
        <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-lumina-muted" />
            <input
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 w-full rounded-lg border border-lumina-border bg-lumina-bg/50 px-3 py-2 pl-9 text-sm text-white placeholder:text-lumina-muted focus:outline-none focus:ring-2 focus:ring-lumina-primary/50 transition-all"
            />
            {searchTerm && (
                <button onClick={resetSearchBar} className="absolute right-3 top-2.5 text-lumina-muted hover:text-white">
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
        
        {/* Área para filtros adicionales (Children) */}
        <div className="flex items-center gap-4 flex-1 justify-left">
            {children}

            {/* Botón para borrar todos los filtros */}
            <button 
                onClick={onReset}
                title="Restablecer filtro"
                className="h-10 w-10 rounded-lg border bg-lumina-primary hover:bg-indigo-600 text-white hover:text-white transition-all flex items-center justify-center shrink-0"
            >
                <RefreshCcw className="w-4 h-4 font-bold" />
        </button>
        </div>
    </div>
  );
};