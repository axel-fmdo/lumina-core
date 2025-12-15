//Interfaz para los usuarios
export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  roles: string[];
  created_at?: string;
}

//Interfaz para los permisos
export interface Permission {
  id: string;
  name: string;
  slug: string;
  description: string;
}

//Interfaz para los roles
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

//Interfaz para el formulario de creción base de permisos
export interface RoleData {
  id: string;
  name: string;
  description: string;
}

//Opciones de estado para los Activos
export enum AssetStatus {
  AVAILABLE = "Disponible",
  ASSIGNED = "Asignado",
  MAINTENANCE = "En Mantenimiento",
  RETIRED = "De Baja"
}

//Interfaz de respuesta para Asset
export interface UserSimple {
    id: string;
    full_name: string;
    email: string;
}

//Interfaz para las Categorías
export interface Category {
  id: string;
  name: string;
  created_at?: string;
  // Agrega otros campos si los tienes
}

//Interfaz para los Activos
export interface Asset {
  id: string;
  name: string;
  internal_code: string;
  serial_number?: string;
  category: Category;
  model?: string;
  cost?: number;
  description?: string;
  status: AssetStatus;
  assigned_to_id?: string;
  assigned_to?: UserSimple | null;
  created_at: string;
}
