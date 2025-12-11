from typing import List, Optional
from pydantic import BaseModel
from uuid import UUID

# --- ESQUEMAS BASES ---
class PermissionBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None

class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

# --- ESQUEMAS DE RESPUESTA ---

class UserProfile(BaseModel):
    id: UUID
    email: str
    full_name: Optional[str] = None
    is_active: bool
    roles: List[str]  # Enviaremos solo los nombres de los roles
    permissions: List[str] # Lista plana de permisos

    class Config:
        from_attributes = True