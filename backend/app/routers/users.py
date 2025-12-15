from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Response, Query
from sqlalchemy.orm import Session
from app import schemas, models
from app.core.database import get_db
from app.core.deps import get_current_user, get_user_permissions, PermissionChecker
from app.core.security import get_password_hash
from sqlalchemy import or_
from typing import Optional
from uuid import UUID

router = APIRouter(prefix="/users", tags=["Users"])

# Obtener el perfil del usuario logueado
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

# Listar a todos los usuarios o los filtrados (Protegido con 'users_read')
@router.get("/", response_model=schemas.PaginatedResponse[schemas.UserList], dependencies=[Depends(PermissionChecker("users_read"))])
def read_users(
    skip: int = 0, 
    limit: int = 10, 
    search: Optional[str] = None,
    role: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # Se determina la consulta base
    query = db.query(models.User).filter(models.User.is_active == True)

    # En caso de que haya un término de búsqueda, se aplica el filtro
    if role:
        # Se realiza un JOIN con la tabla de roles y se filtra por nombre
        query = query.join(models.User.roles).filter(models.Role.name == role)
    if search:
        search_filter = f"%{search}%"
        # Busca en email o en nombre (case insensitive con ilike)
        query = query.filter(
            or_(
                models.User.email.ilike(search_filter),
                models.User.full_name.ilike(search_filter)
            )
        )

    # Se establece el total (antes de paginar)
    total = query.count()

    # Se aplica la paginación
    users = query.offset(skip).limit(limit).all()
    
    # Se arma el arreglo con los resultados
    results = []
    for user in users:
        results.append({
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "is_active": user.is_active,
            "roles": [role.name for role in user.roles],
            "created_at": user.created_at
        })

    # Se retorna la respuesta paginada
    return {
        "total": total,
        "page": (skip // limit) + 1,
        "limit": limit,
        "data": results
    }

@router.get("/validate-email-uniqueness", status_code=status.HTTP_200_OK, dependencies=[Depends(PermissionChecker("users_read"))])
def check_email_uniqueness(
    email: str, 
    user_id: Optional[UUID] = Query(None, description="ID del usuario excluido (para edición)"),
    db: Session = Depends(get_db)
):
    """Verifica si un email ya existe en la base de datos."""
    
    query = db.query(models.User).filter(models.User.email == email)
    
    if user_id:
        # Excluir al usuario actual si estamos editando
        query = query.filter(models.User.id != user_id)
        
    existing_user = query.first()
    
    if existing_user:
        raise HTTPException(
            status_code=409, 
            detail="El correo electrónico ya se encuentra registrado."
        )
        
    return {"message": "Email disponible."}

# Crear un usuario (Protegido con 'users_create')
@router.post("/", response_model=schemas.UserProfile, dependencies=[Depends(PermissionChecker("users_create"))])
def create_user(user_in: schemas.UserCreate, response: Response, db: Session = Depends(get_db)):
    # Se validar si existe el email
    user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=409,
            detail="El usuario con este email ya existe."
        )
    
    # Se validar si existe el rol
    role = db.query(models.Role).filter(models.Role.id == user_in.role_id).first()
    if not role:
         raise HTTPException(status_code=404, detail="Rol no encontrado")

    # Se crea el usuario
    new_user = models.User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        is_active=True
    )
    
    # Se asigna el rol
    new_user.roles.append(role)
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    response.headers["X-Process-Message"] = "Usuario registrado exitosamente."
    
    # Se calculan los permisos
    flat_permissions = get_user_permissions(new_user)
    
    # Se construye la respuesta
    return {
        "id": new_user.id,
        "email": new_user.email,
        "full_name": new_user.full_name,
        "is_active": new_user.is_active,
        "roles": [role.name for role in new_user.roles],
        "permissions": flat_permissions
    }

# Actualizar un usuario (Protegido con 'users_update')
@router.put("/{user_id}", response_model=schemas.UserProfile, dependencies=[Depends(PermissionChecker("users_update"))])
def update_user(
    user_id: UUID,
    user_in: schemas.UserUpdate,
    response: Response,
    db: Session = Depends(get_db)
):
    # Se busca al usuario
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Se realizan las actualizaciones de los campos generales
    if user_in.full_name:
        user.full_name = user_in.full_name
    if user_in.email:
        # Validar que el email no esté tomado por OTRO usuario
        existing_email = db.query(models.User).filter(models.User.email == user_in.email).first()
        if existing_email and existing_email.id != user_id:
             raise HTTPException(status_code=409, detail="Este correo ya está en uso por otro usuario.")
        user.email = user_in.email

    # Actualizar constraseña si se proporciona una
    if user_in.password:
        user.hashed_password = get_password_hash(user_in.password)

    # Actualizar el rol si se proporciona uno
    if user_in.role_id:
        role = db.query(models.Role).filter(models.Role.id == user_in.role_id).first()
        if not role:
            raise HTTPException(status_code=404, detail="Rol no encontrado")
        
        # Se reemplaza la lista de roles (Asumiendo 1 rol principal)
        user.roles = [role]

    db.commit()
    db.refresh(user)

    response.headers["X-Process-Message"] = "Datos del usuario actualizados"

    # Armado de la respuesta
    from app.core.deps import get_user_permissions
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "is_active": user.is_active,
        "roles": [role.name for role in user.roles],
        "permissions": get_user_permissions(user)
    }

# Elimina un usuario (Protegido con 'users_delete')
@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(PermissionChecker("users_delete"))])
def delete_user(
    user_id: UUID,
    response: Response,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user) # Se identifica al usuario que hace la petición
):
    # Se busca al usuario
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Se valida que el usuario a eliminar no sea el que manda la petición
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes eliminar tu propia cuenta mientras está activa.")

    # Se valida que el usuario no sea Super Admin
    is_target_super_admin = any(role.name == "Super Admin" for role in user.roles)
    
    if is_target_super_admin:
        raise HTTPException(
            status_code=400, 
            detail="Por seguridad, no se permite eliminar usuarios con el rol Super Admin."
        )

    # Se procede con la eliminación
    user.is_active = False
    db.add(user)
    db.commit()

    response.headers["X-Process-Message"] = "Usuario eliminado correctamente"
    
    return None