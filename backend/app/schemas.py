from typing import List, Optional, Generic, TypeVar
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

T = TypeVar("T")

# Esquema genérico para respuestas en la paginación
class PaginatedResponse(BaseModel, Generic[T]):
    total: int
    page: int
    limit: int
    data: List[T]

    class Config:
        from_attributes = True

# Esquema para CREAR un permiso (Input)
class PermissionBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None

# Esquema para CREAR un rol (Input)
class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

# Esquema para CREAR un usuario (Input)
class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role_id: UUID

# Esquema para LISTAR usuarios (Output)
class UserList(BaseModel):
    id: UUID
    email: str
    full_name: str
    is_active: bool
    roles: List[str] # Solo los nombres de los roles
    created_at: Optional[datetime] = None # Necesitas importar datetime arriba

    class Config:
        from_attributes = True

# Esquema para LISTAR el perfil del usuario (Output)
class UserProfile(BaseModel):
    id: UUID
    email: str
    full_name: Optional[str] = None
    is_active: bool
    roles: List[str]  # Enviaremos solo los nombres de los roles
    permissions: List[str] # Lista plana de permisos

    class Config:
        from_attributes = True

# Esquema para ACTUALIZAR un usuario
class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    role_id: Optional[UUID] = None