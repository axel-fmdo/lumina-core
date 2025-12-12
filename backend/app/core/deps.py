from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core import security
from app import models
from typing import Callable

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Se dedocifica el token
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Se busca al usuario
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception
        
    return user

# Función auxiliar para generar la lista de permisos de un usuario
def get_user_permissions(user: models.User) -> list[str]:
    permissions = set() # Uso de set para evitar duplicados
    for role in user.roles:
        for perm in role.permissions:
            permissions.add(perm.slug)
    return list(permissions)

# Verificador de permisos
class PermissionChecker:
    def __init__(self, required_permission: str):
        self.required_permission = required_permission

    def __call__(self, user: models.User = Depends(get_current_user)):
        # Se obtienen los permisos del usuario
        user_permissions = get_user_permissions(user)
        
        # Si es Super Admin, pasa siempre (valida por el nombre)
        is_super_admin = any(role.name == "Super Admin" for role in user.roles)
        if is_super_admin:
            return True

        # Se busca el permiso específico
        if self.required_permission not in user_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"No tienes permisos para realizar esta acción. Requieres: '{self.required_permission}'"
            )
        return True