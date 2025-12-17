import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';

export const usePermission = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  /**
   * Parámetros a usar para validar si tiene los permisos el usuario
   * @param permissionSlug
   * @returns 
   */
  
  // Método que valida si tiene el permiso proporcionado
  const hasPermission = (permissionSlug: string): boolean => {
    if (!user) return false;

    // Si es Super Admin, siempre tiene permiso
    if (user.roles.includes('Super Admin')) return true;

    return user.permissions.includes(permissionSlug);
  };

  // Método que valida si tiene algunos de los permisos proporcionados
  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user) return false;

    // Si es Super Admin, siempre tiene permiso
    if (user.roles.includes('Super Admin')) return true;
    
    return permissions.some(p => user.permissions.includes(p));
  };

  // Método que valida si tiene todos los permisos proporcionado
  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!user) return false;

    // Si es Super Admin, siempre tiene permiso
    if (user.roles.includes('Super Admin')) return true;
    
    return permissions.every(p => user.permissions.includes(p));
  };

  return { hasPermission, hasAnyPermission, hasAllPermissions, user };
};