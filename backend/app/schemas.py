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

# --- USUARIOS Y ROLES ---

class PermissionBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None

class PermissionResponse(PermissionBase):
    id: UUID

    class Config:
        from_attributes = True

class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoleCreate(RoleBase):
    pass

class RoleUpdate(RoleBase):
    name: Optional[str] = None
    description: Optional[str] = None

class RolePermissionsUpdate(BaseModel):
    # Recibimos una lista de slugs (ej: ["users:read", "assets:create"])
    permissions: List[str]

class RoleResponse(RoleBase):
    id: UUID
    # Incluimos los permisos aquí para que cuando selecciones el perfil el front sepa cuáles switches prender.
    permissions: List[PermissionResponse] = [] 

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role_id: UUID

class UserList(BaseModel):
    id: UUID
    email: str
    full_name: str
    is_active: bool
    roles: List[str] 
    created_at: Optional[datetime] = None 

    class Config:
        from_attributes = True

class UserProfile(BaseModel):
    id: UUID
    email: str
    full_name: Optional[str] = None
    is_active: bool
    roles: List[str]  
    permissions: List[str] 

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    role_id: Optional[UUID] = None

# Modelo de usuario simple para respuestas anidadas
class UserSimple(BaseModel):
    id: UUID
    full_name: str
    email: str
    
    class Config:
        from_attributes = True


# --- CATEGORÍAS --- 

class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: str

class CategoryResponse(CategoryBase):
    id: UUID
    created_at: datetime
    class Config:
        from_attributes = True


# --- ACTIVOS ---

class AssetStatusEnum(str, Enum):
    AVAILABLE = "Disponible"
    ASSIGNED = "Asignado"
    MAINTENANCE = "En Mantenimiento"
    RETIRED = "De Baja"

# Modelo base (Input general)
class AssetBase(BaseModel):
    name: str
    internal_code: str
    serial_number: Optional[str] = None
    
    # Aquí SÍ usamos category_id (UUID) porque es lo que enviamos al crear
    category_id: UUID 
    
    model: Optional[str] = None
    status: AssetStatusEnum = AssetStatusEnum.AVAILABLE
    description: Optional[str] = None
    cost: float = Field(default=0.0, ge=0, description="El costo no puede ser negativo")

class AssetCreate(AssetBase):
    pass 

class AssetUpdate(BaseModel):
    name: Optional[str] = None
    internal_code: Optional[str] = None
    serial_number: Optional[str] = None
    category_id: Optional[UUID] = None
    status: Optional[AssetStatusEnum] = None
    description: Optional[str] = None
    cost: Optional[float] = Field(default=None, ge=0)
    assigned_to_id: Optional[UUID] = None 

class AssetAssign(BaseModel):
    user_id: UUID

# Esquema de Respuesta (Output)
class AssetResponse(BaseModel): 
    id: UUID
    name: str
    internal_code: str
    serial_number: Optional[str] = None
    
    category: Optional[CategoryResponse] 
    
    model: Optional[str] = None
    status: AssetStatusEnum
    description: Optional[str] = None
    cost: float
    
    # Usuario anidado
    assigned_to: Optional[UserSimple] = None 
    
    created_at: datetime
    
    class Config:
        from_attributes = True