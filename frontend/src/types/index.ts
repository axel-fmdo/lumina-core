//Interfaz para los usuarios
export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  roles: string[];
  created_at?: string;
}