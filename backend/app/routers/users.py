from fastapi import APIRouter, Depends
from app import schemas
from app.core.deps import get_current_user, get_user_permissions
from app import models

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=schemas.UserProfile)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    """
    Obtiene el perfil del usuario logueado con sus roles y permisos calculados.
    """
    # Se determina la lista de permisos del usuario
    flat_permissions = get_user_permissions(current_user)
    
    # Se prepara la respuesta
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "is_active": current_user.is_active,
        "roles": [role.name for role in current_user.roles],
        "permissions": flat_permissions
    }