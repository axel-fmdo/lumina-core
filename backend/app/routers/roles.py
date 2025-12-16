from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, status, HTTPException, Query, Response
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app import models, schemas
from app.core.deps import PermissionChecker

router = APIRouter(prefix="/roles", tags=["Roles"])

# Usaremos un esquema simple para el dropdown
class RoleDropdown(schemas.RoleBase):
    id: schemas.UUID

    class Config:
        from_attributes = True

# 1. GET ALL (Tabla Principal)
@router.get("/", response_model=schemas.PaginatedResponse[schemas.RoleResponse], dependencies=[Depends(PermissionChecker("roles_read"))])
def read_roles(
    skip: int = 0, 
    limit: int = 100, 
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # Usamos joinedload para traer los permisos y mostrarlos en la tabla (ej: "Tiene 5 permisos")
    query = db.query(models.Role).options(joinedload(models.Role.permissions))
    
    if search:
        query = query.filter(models.Role.name.ilike(f"%{search}%"))
        
    total = query.count()
    roles = query.offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "page": (skip // limit) + 1,
        "limit": limit,
        "data": roles
    }

@router.get("/select", response_model=List[RoleDropdown])
def read_roles(db: Session = Depends(get_db)):
    # Traemos todos los roles para llenar selects
    return db.query(models.Role).all()

# --- MÉTODO AUXILIAR PARA VALIDACIÓN ---
@router.get("/validate-role-uniqueness", dependencies=[Depends(PermissionChecker("roles_read"))], status_code=status.HTTP_200_OK)
def validate_category_name(
    name: str, 
    role_id: Optional[UUID] = Query(None, description="ID del Rol excluido (para edición)"),
    db: Session = Depends(get_db) 
):
    """
    Verifica que el nombre del rol sea único.
    Si exclude_id se proporciona (en update), ignora ese registro al buscar duplicados.
    """
    query = db.query(models.Role).filter(models.Role.name == name)
    
    existing_category = query.first()

    if role_id:
        # Excluir el rol actual si estamos editando
        query = query.filter(models.Role.id != role_id)
        
    if existing_category:
        raise HTTPException(
            status_code=409,
            detail="Un Rol con ese nombre ya se encuentra registrado."
        )
    return {"message": "Nombre de Rol disponible."}

@router.get("/permissions", response_model=List[schemas.PermissionResponse])
def read_all_permissions_catalog(db: Session = Depends(get_db)):
    """Retorna TODOS los permisos disponibles para pintar la matriz"""
    return db.query(models.Permission).all()

# 2. CREATE ROLE (Solo nombre y descripción)
@router.post("/", response_model=schemas.RoleResponse, dependencies=[Depends(PermissionChecker("roles_create"))], status_code=status.HTTP_201_CREATED)
def create_role(role_in: schemas.RoleCreate, response: Response, db: Session = Depends(get_db)):
    
    existing_name = db.query(models.Role).filter(models.Role.name == role_in.name).first()
    if existing_name:
        raise HTTPException(status_code=409, detail=f"Un Rol con el nombre '{role_in.name}' ya existe.")
    
    # Crear objeto (sin permisos, nace vacío)
    new_role = models.Role(
        name=role_in.name, 
        description=role_in.description
    )
    
    db.add(new_role)
    db.commit()
    db.refresh(new_role)

    response.headers["X-Process-Message"] = "Rol registrado exitosamente."

    return new_role

# 3. UPDATE ROLE BASIC INFO (Solo nombre y descripción)
@router.put("/{role_id}", response_model=schemas.RoleResponse, dependencies=[Depends(PermissionChecker("roles_update"))])
def update_role(role_id: str, role_in: schemas.RoleUpdate, response: Response, db: Session = Depends(get_db)):
    
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
        
    # Validar duplicado solo si cambió el nombre
    existing_name = db.query(models.Role).filter(models.Role.name == role_in.name).first()
    if existing_name:
        raise HTTPException(status_code=409, detail=f"Un Rol con el nombre '{role_in.name}' ya existe.")
        
    if role_in.name:
        role.name = role_in.name
    if role_in.description is not None:
        role.description = role_in.description
    
    db.commit()
    db.refresh(role)

    response.headers["X-Process-Message"] = "Rol actualizado correctamente."

    return role

# 3.1 UPDATE ROLE ADVANCE INFO (Permisos del rol)
@router.put("/{role_id}/permissions", response_model=schemas.RoleResponse, dependencies=[Depends(PermissionChecker("roles_update"))])
def update_role_permissions(
    role_id: str, 
    payload: schemas.RolePermissionsUpdate, 
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Recibe una lista de slugs (ej: ['users_read', 'assets_create']).
    Borra los permisos anteriores del rol y asigna SOLO los que vienen en la lista.
    """
    # 1. Buscar el Rol
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Rol no encontrado")

    # 2. Buscar los objetos Permission correspondientes a los slugs recibidos
    new_permissions = db.query(models.Permission).filter(
        models.Permission.slug.in_(payload.permissions)
    ).all()

    # 3. Verificar si algún slug enviado no existe (Opcional, pero buena práctica)
    if len(new_permissions) != len(payload.permissions):
        pass

    # 4. Asignación de permisos con relación en la tabla pivote
    role.permissions = new_permissions

    db.commit()
    db.refresh(role) # Recargar para devolver el objeto con los permisos actualizados

    response.headers["X-Process-Message"] = "Los permisos del Rol se actualizaron correctamente."

    return role

# 4. DELETE ROLE
@router.delete("/{role_id}",dependencies=[Depends(PermissionChecker("roles_delete"))], status_code=status.HTTP_204_NO_CONTENT)
def delete_role(role_id: str, response: Response, db: Session = Depends(get_db)):
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    
    # Validación de Integridad: No borrar si hay usuarios usándolo
    users_count = db.query(models.User).filter(models.User.roles.any(id=role_id)).count()
    if users_count > 0:
         raise HTTPException(
             status_code=status.HTTP_409_CONFLICT, 
             detail=f"No se puede eliminar: hay {users_count} usuarios asignados a este Rol."
         )

    db.delete(role)
    db.commit()

    response.headers["X-Process-Message"] = "El Rol ha sido dado de baja correctamente."

    return None