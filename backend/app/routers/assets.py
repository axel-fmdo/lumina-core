from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Response, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from datetime import datetime
from app.core.database import get_db
from app import models, schemas
from app.core.deps import get_current_user, PermissionChecker

router = APIRouter(
    prefix="/assets",
    tags=["Assets"]
)

# Listar todos los activos registrados o con filtros (Protegido con assets_read)
@router.get("/", response_model=schemas.PaginatedResponse[schemas.AssetResponse], dependencies=[Depends(PermissionChecker("assets_read"))])
def read_assets(
    skip: int = 0, 
    limit: int = 10, 
    search: Optional[str] = None,
    status: Optional[models.AssetStatus] = None, # Filtro por Enum
    category_id: Optional[UUID] = None,
    db: Session = Depends(get_db)
):
    # Se determina la consulta base
    query = db.query(models.Asset).options(joinedload(models.Asset.assigned_to),joinedload(models.Asset.category))

    # Si hay busqueda, se filtra por nombre, referencia interna o número de serie
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                models.Asset.name.ilike(search_filter),
                models.Asset.internal_code.ilike(search_filter),
                models.Asset.serial_number.ilike(search_filter)
            )
        )
    
    # Si hay un filtro de categoría de aplica
    if category_id:
        query = query.filter(models.Asset.category_id == category_id)
    
    # Si hay in filtro de estado se aplica
    if status:
        query = query.filter(models.Asset.status == status)

    # Se establece el total antes de paginar
    total = query.count()
    assets = query.offset(skip).limit(limit).all()

    # Se retorna la respuesta paginada
    return {
        "total": total,
        "page": (skip // limit) + 1,
        "limit": limit,
        "data": assets,
    }

@router.get("/validate-asset-uniqueness", status_code=status.HTTP_200_OK)
def check_asset_uniqueness(
    value: str, 
    field: str = Query(..., description="Campo a validar: 'internal_code' o 'serial_number'"),
    asset_id: Optional[UUID] = Query(None, description="ID del activo excluido (para edición)"),
    db: Session = Depends(get_db)
):
    """Verifica la unicidad del código interno o número de serie."""
    
    if field not in ['internal_code', 'serial_number']:
        raise HTTPException(status_code=400, detail="Campo de validación inválido.")

    # Convertir el nombre del campo a la columna del modelo
    if field == 'internal_code':
        column = models.Asset.internal_code
    elif field == 'serial_number':
        column = models.Asset.serial_number
    
    query = db.query(models.Asset).filter(column == value)
    
    if asset_id:
        # Excluir el activo actual si estamos editando
        query = query.filter(models.Asset.id != asset_id)
        
    existing_asset = query.first()

    if existing_asset:
        raise HTTPException(
            status_code=409, 
            detail=f"El {field.replace('_', ' ')} '{value}' ya está en uso."
        )
        
    return {"message": "Valor disponible."}

# Crear un Activo nuevo (Protegico con assets_create)
@router.post("/", response_model=schemas.AssetResponse, dependencies=[Depends(PermissionChecker("assets_create"))])
def create_asset(
    asset: schemas.AssetCreate,
    asset_in: schemas.AssetCreate, 
    response: Response,
    db: Session = Depends(get_db)
):
    # Validar que la categoría exista antes de insertar
    category_exists = db.query(models.Category).filter(models.Category.id == asset.category_id).first()
    if not category_exists:
        raise HTTPException(status_code=400, detail="La categoría seleccionada no existe.")

    # Se valida que el Código Interno sea único
    existing_code = db.query(models.Asset).filter(models.Asset.internal_code == asset_in.internal_code).first()
    if existing_code:
        raise HTTPException(status_code=409, detail=f"El código interno '{asset_in.internal_code}' ya existe.")

    # Se valida que el Número de Serie sea único
    if asset_in.serial_number:
        existing_serial = db.query(models.Asset).filter(models.Asset.serial_number == asset_in.serial_number).first()
        if existing_serial:
             raise HTTPException(status_code=409, detail=f"El número de serie '{asset_in.serial_number}' ya está registrado.")

    # Se crea el modelo
    new_asset = models.Asset(**asset_in.dict())
    
    db.add(new_asset)
    db.commit()
    db.refresh(new_asset)

    # Header para Toast Verde en el Front
    response.headers["X-Process-Message"] = "Activo registrado correctamente."

    return new_asset

# Asignar un equipo a un usuario
@router.post("/{asset_id}/assign", status_code=status.HTTP_200_OK)
def assign_asset(
    asset_id: UUID,
    assign_data: schemas.AssetAssign, # Recibimos user_id
    db: Session = Depends(get_db),
    # current_user... (Si quieres restringir quién puede asignar)
):
    # 1. Buscar el Activo
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Activo no encontrado")

    # 2. Validar que el activo esté DISPONIBLE
    # No puedes asignar algo que ya está asignado, dañado o de baja
    if asset.status != models.AssetStatus.AVAILABLE:
        raise HTTPException(
            status_code=400, 
            detail=f"El activo no está disponible para asignación (Estado actual: {asset.status.value})."
        )

    # 3. Buscar al Usuario (Empleado)
    user = db.query(models.User).filter(models.User.id == assign_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    # 4. Realizar la Asignación
    asset.assigned_to_id = user.id
    asset.status = models.AssetStatus.ASSIGNED # Cambiar estado automáticamente
    
    # (Opcional) Agregar nota automática al historial/descripción
    # asset.description = f"{asset.description or ''}\n[ASIGNADO: {datetime.now()} a {user.full_name}]"

    db.commit()
    db.refresh(asset)

    return {"message": "Activo asignado correctamente", "asset": asset}

# Devolver un activo
@router.post("/{asset_id}/return", status_code=status.HTTP_200_OK)
def return_asset(
    asset_id: UUID,
    db: Session = Depends(get_db)
):
    # 1. Buscar el Activo
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Activo no encontrado")

    # 2. Validar que esté ASIGNADO actualmente
    if asset.status != models.AssetStatus.ASSIGNED:
        raise HTTPException(
            status_code=400, 
            detail="Este activo no se encuentra asignado actualmente."
        )

    # 3. Realizar la Devolución
    asset.assigned_to_id = None # Romper el vínculo
    asset.status = models.AssetStatus.AVAILABLE # Volver a disponible
    
    db.commit()
    db.refresh(asset)

    return {"message": "Activo devuelto al inventario correctamente", "asset": asset}

# Actualizar un Activo (Protegido con assets_update)
@router.put("/{asset_id}", response_model=schemas.AssetResponse, dependencies=[Depends(PermissionChecker("assets_update"))])
def update_asset(
    asset_id: UUID, 
    asset_in: schemas.AssetUpdate, 
    response: Response,
    db: Session = Depends(get_db)
):
    
    # 1. Buscar el activo
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Activo no encontrado.")
    
    if asset_in.cost is not None and asset_in.cost < 0:
        raise HTTPException(status_code=400, detail="El costo no puede ser negativo.")

    # 2. Validar Código Interno Único (solo si se está cambiando)
    if asset_in.internal_code and asset_in.internal_code != asset.internal_code:
        existing = db.query(models.Asset).filter(models.Asset.internal_code == asset_in.internal_code).first()
        if existing:
            raise HTTPException(status_code=409, detail=f"El código '{asset_in.internal_code}' ya está en uso.")

    # 3. Validar Serial (solo si se está cambiando y no es nulo)
    if asset_in.serial_number and asset_in.serial_number != asset.serial_number:
        existing = db.query(models.Asset).filter(models.Asset.serial_number == asset_in.serial_number).first()
        if existing:
            raise HTTPException(status_code=409, detail=f"El serial '{asset_in.serial_number}' ya está registrado.")

    # 4. Actualizar campos dinámicamente
    update_data = asset_in.dict(exclude_unset=True) # Solo campos enviados
    for key, value in update_data.items():
        setattr(asset, key, value)

    db.commit()
    db.refresh(asset)
    
    response.headers["X-Process-Message"] = "Activo actualizado correctamente."
    return asset

# Eliminar un Activo (cambiar su estado)
@router.delete("/{asset_id}", status_code=status.HTTP_200_OK, dependencies=[Depends(PermissionChecker("assets_delete"))])
def delete_asset(
    asset_id: UUID, 
    response: Response,
    db: Session = Depends(get_db)
):
    # 1. Buscar el activo
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Activo no encontrado")

    # 2. Aplicar la lógica de "Baja"
    asset.status = models.AssetStatus.RETIRED  # Cambiar estado a De Baja
    asset.assigned_to_id = None  # Desvincular de cualquier usuario (Importante)
    
    # Se agregar una nota automática en la descripción
    asset.description = f"{asset.description or ''} [DADO DE BAJA: {datetime.now()}]"

    db.add(asset)
    db.commit()
    
    # 3. Respuesta con Mensaje
    response.headers["X-Process-Message"] = "El activo ha sido dado de baja correctamente."
    
    return {"message": "Activo dado de baja"}