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

# Usaremos un esquema simple para el dropdown
class CategoryDropdown(schemas.RoleBase):
    id: schemas.UUID

    class Config:
        from_attributes = True

# 1. GET ALL (Con búsqueda y paginación)
@router.get("/", response_model=schemas.PaginatedResponse[schemas.CategoryResponse], dependencies=[Depends(PermissionChecker("categories_read"))])
def read_categories(
    skip: int = 0, 
    limit: int = 10, 
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Category)
    
    if search:
        query = query.filter(models.Category.name.ilike(f"%{search}%"))
    
    total = query.count()

    categories = query.offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "page": (skip // limit) + 1,
        "limit": limit,
        "data": categories
    }

# Método para obtener el listado de categorías para el Select
@router.get("/select", response_model=List[CategoryDropdown])
def read_categories(db: Session = Depends(get_db)):
    # Traemos todos los roles para llenar selects
    return db.query(models.Category).all()

# --- MÉTODO AUXILIAR PARA VALIDACIÓN ---
@router.get("/validate-category-uniqueness", status_code=status.HTTP_200_OK, dependencies=[Depends(PermissionChecker("categories_read"))])
def validate_category_name(
    name: str, 
    category_id: Optional[UUID] = Query(None, description="ID del activo excluido (para edición)"),
    db: Session = Depends(get_db) 
):
    """
    Verifica que el nombre de la categoría sea único.
    Si exclude_id se proporciona (en update), ignora ese registro al buscar duplicados.
    """
    query = db.query(models.Category).filter(models.Category.name == name)
    
    existing_category = query.first()

    if category_id:
        # Excluir la categoría actual si estamos editando
        query = query.filter(models.Category.id != category_id)
        
    if existing_category:
        raise HTTPException(
            status_code=409,
            detail="Una categoría con ese nombre ya se encuentra registrada."
        )
    return {"message": "Nombre de categoría disponible."}

# 2. CREATE
@router.post("/", response_model=schemas.CategoryResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(PermissionChecker("categories_create"))])
def create_category(category_in: schemas.CategoryCreate, response: Response,db: Session = Depends(get_db)):

    # Se valida que el Nombre sea único
    existing_name = db.query(models.Category).filter(models.Category.name == category_in.name).first()
    if existing_name:
        raise HTTPException(status_code=409, detail=f"Una categoría con el nombre '{category_in.name}' ya existe.")
    
    new_category = models.Category(name=category_in.name)
    db.add(new_category)
    db.commit()
    db.refresh(new_category)

    response.headers["X-Process-Message"] = "Categoría registrada exitosamente."

    return new_category

# 3. UPDATE
@router.put("/{category_id}", response_model=schemas.CategoryResponse, dependencies=[Depends(PermissionChecker("categories_update"))])
def update_category(category_id: str, category_data: schemas.CategoryUpdate, response: Response, db: Session = Depends(get_db)):
    # Se busca la categoría a actualizar
    category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    
    # 2. Validar Código Interno Único (solo si se está cambiando)
    if category_data.name and category_data.name != category.name:
        existing = db.query(models.Category).filter(models.Category.name == category_data.name).first()
        if existing:
            raise HTTPException(status_code=409, detail=f"El nombre '{category_data.name}' ya está en uso.")

    category.name = category_data.name
    db.commit()
    db.refresh(category)

    response.headers["X-Process-Message"] = "Activo actualizado correctamente."

    return category

# 4. DELETE
@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(PermissionChecker("categories_delete"))])
def delete_category(category_id: str, response: Response, db: Session = Depends(get_db)):
    # 1. Buscar la categoría
    category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    
    # 2. VALIDACIÓN DE INTEGRIDAD REFERENCIAL (Protección)
    # Verificamos si existen activos que apunten a este category_id
    assets_count = db.query(models.Asset).filter(models.Asset.category_id == category_id).count()
    
    if assets_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, 
            detail=f"No se puede eliminar la categoría porque tiene {assets_count} activos asociados. Por favor, reasigna o elimina esos activos primero."
        )

    # 3. Si pasa la validación, procedemos a borrar
    db.delete(category)
    db.commit()

    response.headers["X-Process-Message"] = "La categoría ha sido dado de baja correctamente."
    
    return {"message": "Activo dado de baja"}