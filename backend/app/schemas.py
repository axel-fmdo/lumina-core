from enum import Enum
from typing import List, Optional, Generic, TypeVar
from pydantic import BaseModel, Field
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

# Replicamos el Enum para que Pydantic lo valide
class AssetStatusEnum(str, Enum):
    AVAILABLE = "Disponible"
    ASSIGNED = "Asignado"
    MAINTENANCE = "En Mantenimiento"
    RETIRED = "De Baja"

# Modelo base para un Activo
class AssetBase(BaseModel):
    name: str
    internal_code: str
    serial_number: Optional[str] = None
    category: str
    model: Optional[str] = None
    status: AssetStatusEnum = AssetStatusEnum.AVAILABLE
    description: Optional[str] = None
    cost: float = Field(default=0.0, ge=0, description="El costo no puede ser negativo")

class AssetCreate(AssetBase):
    pass # Se podrían agregar campos obligatorios extra aquí

# Esquema para ACTUALIZAR un Activo
class AssetUpdate(BaseModel):
    name: Optional[str] = None
    internal_code: Optional[str] = None
    serial_number: Optional[str] = None
    category: Optional[str] = None
    status: Optional[AssetStatusEnum] = None
    description: Optional[str] = None
    cost: Optional[float] = Field(default=None, ge=0)
    assigned_to_id: Optional[UUID] = None # Para asignar/desasignar

# Modelo de usuario para emplear en la respuesta de Activos
class UserSimple(BaseModel):
    id: UUID
    full_name: str
    email: str
    
    class Config:
        from_attributes = True

# Esquema para RESPONDER con un Activo
class AssetResponse(AssetBase):
    id: UUID
    assigned_to_id: Optional[UUID] = None
    assigned_to:Optional[UserSimple] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Esquema de asignación de un Activo a un Usuario
class AssetAssign(BaseModel):
    user_id: UUID