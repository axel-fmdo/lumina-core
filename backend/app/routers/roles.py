from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, status, HTTPException, Query, Response
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app import models, schemas
from app.core.deps import PermissionChecker

router = APIRouter(prefix="/roles", tags=["Roles"])

# Listar todos los roles o filtrarlos (Protegido con 'roles_read')
@router.get("/", response_model=schemas.PaginatedResponse[schemas.RoleResponse], dependencies=[Depends(PermissionChecker("roles_read"))])
def read_roles(
    skip: int = 0, 
    limit: int = 100, 
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Obtiene la lista de los Roles registrados. Se pueden especificar parámetros de filtrado con search (nombre)
    """

    # Se realiza la consulta base con joinedload para traer los permisos de cada ron y mandarlos en la respuesta
    query = db.query(models.Role).options(joinedload(models.Role.permissions))
    
    try:
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
    
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error al obtener los Roles.")

# Obtener todos los Roles, respuesta personalizada para componentes Select en el Front
@router.get("/select", response_model=List[schemas.RoleDropdown], dependencies=[Depends(PermissionChecker("roles_read"))])
def read_roles(
    db: Session = Depends(get_db)
):
    """
    Obtiene la lista de los Roles registrados. Respuesta para usar el componentes Select en el Front
    """
    try:
        # Traemos todos los roles para llenar selects
        return db.query(models.Role).all()
    
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error al obtener los Roles.")

# Validar que el nombre que se pretente registrar a un rol no esté registrado (Protegido con 'roles_read')
@router.get("/validate-role-uniqueness", dependencies=[Depends(PermissionChecker("roles_read"))], status_code=status.HTTP_200_OK)
def validate_category_name(
    name: str, 
    role_id: Optional[UUID] = Query(None, description="ID del Rol excluido (para edición)"),
    db: Session = Depends(get_db) 
):
    """
    Verifica que el nombre del rol sea único antes de realizar la creación/modificación del registro.
    """

    # Se determina la consulta base
    query = db.query(models.Role).filter(models.Role.name == name)
    
    try:
        existing_category = query.first()

        if role_id:
            # Excluir el rol actual si se está editando
            query = query.filter(models.Role.id != role_id)
            
        # Validar que no exista ya un rol con ese nombre
        if existing_category:
            raise HTTPException(
                status_code=409,
                detail="Un Rol con ese nombre ya se encuentra registrado."
            )
        return {"message": "Nombre de Rol disponible."}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error al validar el registro del nombre del Rol.")

# Obtener todos los permisos registrados en el sistema como parte del tratamiento de actualización de los accesos de un rol
@router.get("/permissions", response_model=List[schemas.PermissionResponse], dependencies=[Depends(PermissionChecker("roles_read"))])
def read_all_permissions_catalog(
    db: Session = Depends(get_db)
):
    """
    Retorna todos los permisos existentes del sistema
    """

    try:
        return db.query(models.Permission).all()
    
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error al obtener los Permisos.")

# Crear un rol (Protegido con 'roles_create')
@router.post("/", response_model=schemas.RoleResponse, dependencies=[Depends(PermissionChecker("roles_create"))], status_code=status.HTTP_201_CREATED)
def create_role(
    role_in: schemas.RoleCreate, 
    response: Response, 
    db: Session = Depends(get_db)
):
    """
    Método para dar de alta un nuevo Rol.
    """

    # Se determina la consulta base
    existing_name = db.query(models.Role).filter(models.Role.name == role_in.name).first()
    
    # Se valida que el nombre no esté registrado
    if existing_name:
        raise HTTPException(status_code=409, detail=f"Un Rol con el nombre '{role_in.name}' ya existe.")
    
    try:
        # Se crea el objeto con los datos del nuevo rol (sin permisos)
        new_role = models.Role(
            name=role_in.name, 
            description=role_in.description
        )
        
        # Se hace el proceso de guardado
        db.add(new_role)
        db.commit()
        db.refresh(new_role)

        # Se envía el encabezado de que todo salió bien
        response.headers["X-Process-Message"] = "Rol registrado exitosamente."

        return new_role
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al guardar el Rol.")

# Actualizar un rol (Protegido con 'roles_update')
@router.put("/{role_id}", response_model=schemas.RoleResponse, dependencies=[Depends(PermissionChecker("roles_update"))])
def update_role(
    role_id: str, 
    role_in: schemas.RoleUpdate, 
    response: Response, 
    db: Session = Depends(get_db)
):
    """
    Método para actualizar un Rol.
    """

    # Se determina la consulta base
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Rol no encontrado.")
        
    # Se valida que el nombre nuevo no esté registrado
    existing_name = db.query(models.Role).filter(models.Role.name == role_in.name).first()
    if existing_name:
        raise HTTPException(status_code=409, detail=f"Un Rol con el nombre '{role_in.name}' ya existe.")
        
    try:
        # Se realiza la actualizacoón de datos
        if role_in.name:
            role.name = role_in.name
        if role_in.description is not None:
            role.description = role_in.description
        
         # Se hace el proceso de guardado
        db.commit()
        db.refresh(role)

        # Se envía el encabezado de que todo salió bien
        response.headers["X-Process-Message"] = "Rol actualizado correctamente."

        return role
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al actualizar el Rol.")

# Actualizar los permisos un rol (Protegido con 'roles_update')
@router.put("/{role_id}/permissions", response_model=schemas.RoleResponse, dependencies=[Depends(PermissionChecker("roles_update"))])
def update_role_permissions(
    role_id: str, 
    payload: schemas.RolePermissionsUpdate, 
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Método para actualizar los permisos de un Rol. Recibe el arreglo de permisos.
    """

    # Se determina la consulta base
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    
    # Se valida que exista el rol
    if not role:
        raise HTTPException(status_code=404, detail="Rol no encontrado.")

    try:
        # Se obtienen todos los permisos existentes
        new_permissions = db.query(models.Permission).filter(
            models.Permission.slug.in_(payload.permissions)
        ).all()

        # Se valida que no haya permisos adicionales no registrados
        if len(new_permissions) != len(payload.permissions):
            pass

        # Se asigna el nuevo set de permisos al rol
        role.permissions = new_permissions

        # Se hace el proceso de guardado
        db.commit()
        db.refresh(role)

        # Se envía el encabezado de que todo salió bien
        response.headers["X-Process-Message"] = "Los permisos del Rol se actualizaron correctamente."

        return role
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al actualizar los permisos del Rol.")

# Elimina un rol (Protegido con 'roles_delete')
@router.delete("/{role_id}",dependencies=[Depends(PermissionChecker("roles_delete"))], status_code=status.HTTP_204_NO_CONTENT)
def delete_role(
    role_id: str, 
    response: Response, 
    db: Session = Depends(get_db)
):
    """
    Método para eliminar un Rol.
    """

    # Se determina la consulta base
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    
    # Se valida que exista el rol
    if not role:
        raise HTTPException(status_code=404, detail="Rol no encontrado.")
    
    try:
        # Se valida que el rol no esté en uso
        users_count = db.query(models.User).filter(models.User.roles.any(id=role_id)).count()
        if users_count > 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, 
                detail=f"No se puede eliminar: hay {users_count} usuarios asignados a este Rol."
            )

        # Se realiza la eliminación
        db.delete(role)
        db.commit()

        # Se envía el encabezado de que todo salió bien
        response.headers["X-Process-Message"] = "El Rol ha sido dado de baja correctamente."

        return None
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al eliminar el Rol.")