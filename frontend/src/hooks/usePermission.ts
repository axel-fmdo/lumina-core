import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';

export const usePermission = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  /**
   * Verifica si el usuario tiene un permiso específico.
   * @param permissionSlug El slug del permiso a validar (ej: 'users_create')
   * @returns true si tiene el permiso o es Super Admin
   */
  const hasPermission = (permissionSlug: string): boolean => {
    if (!user) return false;

    // Si es Super Admin, siempre tiene permiso
    if (user.roles.includes('Super Admin')) return true;

    return user.permissions.includes(permissionSlug);
  };

  /**
   * Verifica si tiene AL MENOS UNO de los permisos en una lista.
   */
  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user) return false;
    if (user.roles.includes('Super Admin')) return true;
    
    return permissions.some(p => user.permissions.includes(p));
  };

  // Retornamos también el usuario por si necesitamos mostrar el nombre
  return { hasPermission, hasAnyPermission, user };
};