from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import or_
from .. import models, schemas
from app.core.database import get_db
from app.core.deps import get_current_user, PermissionChecker

router = APIRouter(
    prefix="/categories",
    tags=["Categories"]
)

# Listar todas las categorías o filtrarlas (Protegido con 'categories_read')
@router.get("/", response_model=schemas.PaginatedResponse[schemas.CategoryResponse], dependencies=[Depends(PermissionChecker("categories_read"))])
def read_categories(
    skip: int = 0, 
    limit: int = 10, 
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Obtiene la lista de las Categorías registradas. Se pueden especificar parámetros de filtrado con search (nombre)
    """

    # Se determina la consulta base
    query = db.query(models.Category)
    
    # Si hay un parámetro de filtrado, se aplica
    if search:
        query = query.filter(models.Category.name.ilike(f"%{search}%"))
    
    try:
        total = query.count()

        categories = query.offset(skip).limit(limit).all()
        
        return {
            "total": total,
            "page": (skip // limit) + 1,
            "limit": limit,
            "data": categories
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error al obtener las Categorías.")

# Obtener todas las Categorías, respuesta personalizada para componentes Select en el Front
@router.get("/select", response_model=List[schemas.CategoryDropdown], dependencies=[Depends(PermissionChecker("categories_read"))])
def read_categories(
    db: Session = Depends(get_db)
):
    """
    Obtiene la lista de los Roles registrados. Respuesta para usar el componentes Select en el Front
    """

    try:
        # Traemos todas las categorías para llenar selects
        return db.query(models.Category).all()
    
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error al obtener las Categorías.")

# Validar que el nombre que se pretente registrar a una categoría no esté registrado (Protegido con 'categories_read')
@router.get("/validate-category-uniqueness", status_code=status.HTTP_200_OK, dependencies=[Depends(PermissionChecker("categories_read"))])
def validate_category_name(
    name: str, 
    category_id: Optional[UUID] = Query(None, description="ID del activo excluido (para edición)"),
    db: Session = Depends(get_db) 
):
    """
    Verifica que el nombre de la categoría sea único antes de realizar la creación/modificación del registro.
    """

    # Se determina la consulta base
    query = db.query(models.Category).filter(models.Category.name == name)
    
    try:
        existing_category = query.first()

        if category_id:
            # Excluir la categoría actual si estamos editando
            query = query.filter(models.Category.id != category_id)
            
        # Se valida que no exista una categoría con ese nombre
        if existing_category:
            raise HTTPException(
                status_code=409,
                detail="Una categoría con ese nombre ya se encuentra registrada."
            )
        return {"message": "Nombre de categoría disponible."}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error al validar el registro del nombre de la Categoría.")

# Crear una categoría (Protegido con 'categories_create')
@router.post("/", response_model=schemas.CategoryResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(PermissionChecker("categories_create"))])
def create_category(
    category_in: schemas.CategoryCreate, 
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Método para dar de alta un nuevo Rol.
    """

    # Se determina la consulta base
    existing_name = db.query(models.Category).filter(models.Category.name == category_in.name).first()
    
    # Se valida que el nombre no esté registrado
    if existing_name:
        raise HTTPException(status_code=409, detail=f"Una categoría con el nombre '{category_in.name}' ya existe.")
    
    try:
        # Se asignan los datos del nuevo registro
        new_category = models.Category(name=category_in.name)

        # Se hace el proceso de guardado
        db.add(new_category)
        db.commit()
        db.refresh(new_category)

        # Se envía el encabezado de que todo salió bien
        response.headers["X-Process-Message"] = "Categoría registrada exitosamente."

        return new_category
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al crear la Categoría.")

# Actualizar una categoría (Protegido con 'categories_update')
@router.put("/{category_id}", response_model=schemas.CategoryResponse, dependencies=[Depends(PermissionChecker("categories_update"))])
def update_category(
    category_id: str, 
    category_data: schemas.CategoryUpdate, 
    response: Response, 
    db: Session = Depends(get_db)
):
    """
    Método para actualizar una Categoría.
    """

    # Se busca la categoría a actualizar
    category = db.query(models.Category).filter(models.Category.id == category_id).first()
    
    #Se valida que exista la categoría
    if not category:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    
    # Se valida que el nombre no esté en uso
    if category_data.name and category_data.name != category.name:
        existing = db.query(models.Category).filter(models.Category.name == category_data.name).first()
        if existing:
            raise HTTPException(status_code=409, detail=f"El nombre '{category_data.name}' ya está en uso.")

    try:
        # Se hace la asingación de nuevos datos
        category.name = category_data.name

        #Se hace el proceso de guardado
        db.commit()
        db.refresh(category)

        # Se envía el encabezado de que todo salió bien
        response.headers["X-Process-Message"] = "Activo actualizado correctamente."

        return category
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al actualizar la Categoría.")

# Elimina una categoría (Protegido con 'categories_delete')
@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(PermissionChecker("categories_delete"))])
def delete_category(
    category_id: str, 
    response: Response, 
    db: Session = Depends(get_db)
):
    # Se establece la consulta base
    category = db.query(models.Category).filter(models.Category.id == category_id).first()
    
    # Se valida que exista la categoría
    if not category:
        raise HTTPException(status_code=404, detail="Categoría no encontrada.")
    
    # Se valida que la categoría a eliminar no esté en uso
    assets_count = db.query(models.Asset).filter(models.Asset.category_id == category_id).count()
    if assets_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, 
            detail=f"No se puede eliminar la categoría porque tiene {assets_count} activos asociados. Por favor, reasigna o elimina esos activos primero."
        )

    try:
        # Se realiza el proceso de borrado
        db.delete(category)
        db.commit()

        # Se envía el encabezado de que todo salió bien
        response.headers["X-Process-Message"] = "La Categoría ha sido dado de baja correctamente."
        
        return {"message": "Categoría dada de baja"}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al eliminar la Categoría.")