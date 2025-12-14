import { useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useDebounce } from "./useDebounce";

export const useTableParams = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Leer valores de la URL o usar defaults
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const search = searchParams.get("search") || "";
  const role = searchParams.get("role") || "";
  const category = searchParams.get("category") || "";
  const status = searchParams.get("status") || "";
  
  // Estado local para el input de búsqueda (para no actualizar URL en cada tecla)
  const [searchTerm, setSearchTerm] = useState(search);
  
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Sincronizar Búsqueda con URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    } else {
      params.delete("search");
    }
    // Al buscar, siempre reseteamos a página 1
    if (debouncedSearch !== search) {
        params.set("page", "1");
    }
    setSearchParams(params);
  }, [debouncedSearch]);

  const setPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    setSearchParams(params);
  };

  const setLimit = (newLimit: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("limit", newLimit.toString());
    params.set("page", "1"); // Cambiar limite resetea página
    setSearchParams(params);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const setRole = (newRole: string) => {
    const params = new URLSearchParams(searchParams);
    if(newRole){
      params.set("role", newRole);
    } else {
      params.delete("role");
    }
    params.set("page", "1");
    setSearchParams(params);
  };

  const setCategory = (newCategory: string) => {
    const params = new URLSearchParams(searchParams);
    if(newCategory){
      params.set("category", newCategory);
    } else {
      params.delete("category");
    }
    params.set("page", "1");
    setSearchParams(params);
  }

  const setStatus = (newStatus: string) => {
    const params = new URLSearchParams(searchParams);
    if(newStatus){
      params.set("status", newStatus);
    } else {
      params.delete("status");
    }
    params.set("page", "1");
    setSearchParams(params);
  }

  const resetFilters = () => {
    setSearchTerm("");
    setSearchParams({ page: "1", limit: "10" });
  };

  return {
    page,
    limit,
    search: searchTerm,
    role,
    category,
    status,
    setPage,
    setLimit,
    setSearch: handleSearch,
    setRole,
    setCategory,
    setStatus,
    resetFilters,
    apiParams: {
        skip: (page - 1) * limit,
        limit,
        search: debouncedSearch || undefined,
        role: role || undefined,
        category: category || undefined,
        status: status || undefined,
    }
  };
};