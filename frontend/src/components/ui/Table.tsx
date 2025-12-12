import { ReactNode } from "react";
import { cn } from "../../lib/utils";

// Definimos qué forma tiene una columna
export interface Column<T> {
  header: string;
  accessorKey?: keyof T; // La llave del objeto (ej: "email")
  render?: (item: T) => ReactNode; // Función opcional para renderizado custom (ej: badges)
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
}

export const Table = <T extends { id: string }>({ data, columns, isLoading }: TableProps<T>) => {
  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center glass-panel rounded-xl">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
        <div className="w-full p-8 text-center glass-panel rounded-xl text-lumina-muted">
            No se encontraron registros.
        </div>
    )
  }

  return (
    <div className="w-full overflow-hidden rounded-t-xl border border-b-0 border-lumina-border/50">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-lumina-text">
          {/* HEADER */}
          <thead className="bg-lumina-surface/80 uppercase text-xs font-semibold text-lumina-muted tracking-wider backdrop-blur-md">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={cn("px-6 py-4", col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* BODY */}
          <tbody className="divide-y divide-lumina-border/30 bg-lumina-bg/40 backdrop-blur-sm">
            {data.map((item) => (
              <tr 
                key={item.id} 
                className="hover:bg-white/5 transition-colors duration-150 group"
              >
                {columns.map((col, idx) => (
                  <td key={idx} className={cn("px-6 py-4 whitespace-nowrap", col.className)}>
                    {/* Si hay funcion render, la usa. Si no, imprime el texto directo */}
                    {col.render 
                        ? col.render(item) 
                        : (col.accessorKey ? String(item[col.accessorKey]) : "")
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};