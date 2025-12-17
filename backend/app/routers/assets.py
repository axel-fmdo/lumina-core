from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Response, Query, Body
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, desc
from datetime import datetime
from app.core.database import get_db
from app import models, schemas
from app.core.deps import get_current_user, PermissionChecker

router = APIRouter(
    prefix="/assets",
    tags=["Assets"]
)

# Listar todos los activos registrados o filtrarlos (Protegido con assets_read)
@router.get("/", response_model=schemas.PaginatedResponse[schemas.AssetResponse], dependencies=[Depends(PermissionChecker("assets_read"))])
def read_assets(
    skip: int = 0, 
    limit: int = 10, 
    search: Optional[str] = None,
    status: Optional[models.AssetStatus] = None,
    category_id: Optional[UUID] = None,
    db: Session = Depends(get_db)
):
    """
    Obtiene la lista de los Activos registrados. Se pueden especificar parámetros de filtrado con search (nombre, serial o código), status o categoría
    """

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

    try:
        total = query.count()
        assets = query.offset(skip).limit(limit).all()

        # Se retorna la respuesta paginada
        return {
            "total": total,
            "page": (skip // limit) + 1,
            "limit": limit,
            "data": assets,
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error al obtener los Activos.")

# Validar que el código interno o serial que se pretente registrar a un activo no esté registrado (Protegido con 'assets_read')
@router.get("/validate-asset-uniqueness", status_code=status.HTTP_200_OK, dependencies=[Depends(PermissionChecker("assets_read"))])
def check_asset_uniqueness(
    value: str, 
    field: str = Query(..., description="Campo a validar: 'internal_code' o 'serial_number'"),
    asset_id: Optional[UUID] = Query(None, description="ID del activo excluido (para edición)"),
    db: Session = Depends(get_db)
):
    """
    Verifica que el código interno o el serial del activo sea único antes de realizar la creación/modificación del registro.
    """
    
    # Se valida que los datos recibidos sean los esperados
    if field not in ['internal_code', 'serial_number']:
        raise HTTPException(status_code=400, detail="Campo de validación inválido.")

    # Convertir el nombre del campo a la columna del modelo
    if field == 'internal_code':
        column = models.Asset.internal_code
    elif field == 'serial_number':
        column = models.Asset.serial_number
    
    # Se determina la cosulta base
    query = db.query(models.Asset).filter(column == value)
    
    try:
        if asset_id:
            # Excluir el activo actual si estamos editando
            query = query.filter(models.Asset.id != asset_id)
            
        existing_asset = query.first()

        # Si se encuentran coincidencias se manda el mensaje correspondiente
        if existing_asset:
            raise HTTPException(
                status_code=409, 
                detail=f"El {field.replace('_', ' ')} '{value}' ya está en uso."
            )
            
        return {"message": "Valor disponible."}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error al validar el registro de claves del Activo.")

# Obtener el historial de préstamos y devoluciones de un activo (Protegido con 'assets_read')
@router.get("/{asset_id}/history", response_model=List[schemas.AssetHistoryResponse], dependencies=[Depends(PermissionChecker("assets_read"))])
def read_asset_history(
    asset_id: str,
    db: Session = Depends(get_db)
):
    """
    Obtiene el historial completo de movimientos de un activo específico ordenado del más reciente al más antiguo.
    """

    # Se valida que el activo exista
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Activo no encontrado")

    try:
        # Se determina la consulta base
        history = db.query(models.AssetHistory)\
            .filter(models.AssetHistory.asset_id == asset_id)\
            .options(
                # Se anidan las relaciones para mostrar los nombres de usuarios
                joinedload(models.AssetHistory.assigned_to),
                joinedload(models.AssetHistory.action_by)
            )\
            .order_by(desc(models.AssetHistory.created_at))\
            .all()

        # Se regresa lo obtenido
        return history
    
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error al obtener el historial de movimientos del Activo.")

# Crear un activo (Protegido con 'assets_create')
@router.post("/", response_model=schemas.AssetResponse, dependencies=[Depends(PermissionChecker("assets_create"))])
def create_asset(
    asset_in: schemas.AssetCreate, 
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Método para dar de alta un nuevo Activo.
    """

    # Se valida que la categoría a la que se quiere agregar el activo exista
    category_exists = db.query(models.Category).filter(models.Category.id == asset_in.category_id).first()
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

    try:
        # Se crea el modelo del nuevo registro
        new_asset = models.Asset(
            name=asset_in.name,
            internal_code=asset_in.internal_code,
            serial_number=asset_in.serial_number,
            model=asset_in.model,
            cost=asset_in.cost,
            status=asset_in.status,
            category_id=asset_in.category_id
        )
        
        # Se realiza el proceso de guardado
        db.add(new_asset)
        db.commit()
        db.refresh(new_asset)

        # Se envía el encabezado de que todo salió bien
        response.headers["X-Process-Message"] = "Activo registrado correctamente."

        return new_asset
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al guardar el Activo.")

# Asignar un equipo a un usuario (Protegido con 'assets_read')
@router.post("/{asset_id}/assign", status_code=status.HTTP_200_OK, dependencies=[Depends(PermissionChecker("assets_read"))])
def assign_asset(
    asset_id: UUID,
    assign_data: schemas.AssetAssign, # Recibimos user_id y opcional un comentario
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Método para dar asignarle un Activo a un Usuario.
    """

    # Se valida que exista el activo
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Activo no encontrado.")

    # Se valida que el activo esté disponible
    if asset.status != models.AssetStatus.AVAILABLE:
        raise HTTPException(
            status_code=400, 
            detail=f"El activo no está disponible para asignación (Estado actual: {asset.status.value})."
        )

    # Se valida que exista el usuario
    user = db.query(models.User).filter(models.User.id == assign_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    
    try:
        # Se actualiza el Estado del activo
        asset.assigned_to_id = user.id
        asset.status = models.AssetStatus.ASSIGNED 

        # Se crea el registro en Historial
        history = models.AssetHistory(
            asset_id=asset.id,
            assigned_to_id=user.id,
            action_by_id=current_user.id,
            action_type=models.AssetActionType.ASSIGN,
            comments=assign_data.comments
        )

        # Se realiza el proceso de guardado
        db.add(history)
        db.commit()
        db.refresh(asset)

        # Se envía el encabezado de que todo salió bien
        return {"message": "Activo asignado correctamente.", "asset": asset}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al asignar el activo.")

# Devolver un equipo asignado a un usuario (Protegido con 'assets_read')
@router.post("/{asset_id}/return", status_code=status.HTTP_200_OK, dependencies=[Depends(PermissionChecker("assets_read"))])
def return_asset(
    asset_id: UUID,
    comments: Optional[str] = Body(None, embed=True),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Método para devolver un Activo asignado a un Usuario.
    """

    # Se valida que exista el activo
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Activo no encontrado.")

    # Se valida que esté asignado
    if asset.status != models.AssetStatus.ASSIGNED:
        raise HTTPException(
            status_code=400, 
            detail="Este activo no se encuentra asignado actualmente."
        )
    
    previous_user_id = asset.assigned_to_id # Guardamos quién lo tenía para el historial

    try:
        # Se libera el activo
        asset.assigned_to_id = None
        asset.status = models.AssetStatus.AVAILABLE

        # Se registra en el historial
        history = models.AssetHistory(
            asset_id=asset.id,
            assigned_to_id=previous_user_id, # Quién lo devolvió
            action_by_id=current_user.id,
            action_type=models.AssetActionType.UNASSIGN,
            comments=comments
        )

        # Se realiza el proceso de guardado
        db.add(history)
        db.commit()
        db.refresh(asset)

         # Se envía el encabezado de que todo salió bien
        return {"message": "Activo devuelto al inventario correctamente.", "asset": asset}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(500, "Error al procesar la devolución")

# Actualizar un activo (Protegido con 'assets_update')
@router.put("/{asset_id}", response_model=schemas.AssetResponse, dependencies=[Depends(PermissionChecker("assets_update"))])
def update_asset(
    asset_id: UUID, 
    asset_in: schemas.AssetUpdate, 
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Método para actualizar un Activo.
    """

    # Se determina la consulta base
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    
    # Se valida que el activo exista
    if not asset:
        raise HTTPException(status_code=404, detail="Activo no encontrado.")
    
    # Se valida que el costo a actualizar no sea negativo
    if asset_in.cost is not None and asset_in.cost < 0:
        raise HTTPException(status_code=400, detail="El costo no puede ser negativo.")

    # Se valida que el código interno no esté registrado
    if asset_in.internal_code and asset_in.internal_code != asset.internal_code:
        existing = db.query(models.Asset).filter(models.Asset.internal_code == asset_in.internal_code).first()
        if existing:
            raise HTTPException(status_code=409, detail=f"El código '{asset_in.internal_code}' ya está en uso.")

    # Se valida que el número de serie no esté registrado
    if asset_in.serial_number and asset_in.serial_number != asset.serial_number:
        existing = db.query(models.Asset).filter(models.Asset.serial_number == asset_in.serial_number).first()
        if existing:
            raise HTTPException(status_code=409, detail=f"El serial '{asset_in.serial_number}' ya está registrado.")

    try:
        # Se arma el esquema de actualización
        update_data = asset_in.dict(exclude_unset=True) # Solo campos enviados
        for key, value in update_data.items():
            setattr(asset, key, value)

        # Se guardan los cambios
        db.commit()
        db.refresh(asset)
        
        # Se envía el encabezado de que todo salió bien
        response.headers["X-Process-Message"] = "Activo actualizado correctamente."
        
        return asset
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al actualizar el Rol.")

# Elimina un activo (Protegido con 'assets_delete')
@router.delete("/{asset_id}", status_code=status.HTTP_200_OK, dependencies=[Depends(PermissionChecker("assets_delete"))])
def delete_asset(
    asset_id: UUID, 
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Método para dar de baja un Activo.
    """

    # Se determina la consulta base
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Activo no encontrado")

    try: 
        # Se da de baja el activo
        asset.status = models.AssetStatus.RETIRED  # Cambiar estado a De Baja
        asset.assigned_to_id = None  # Desvincular de cualquier usuario
        
        # Se agrega una nota automática en la descripción
        asset.description = f"{asset.description or ''} [DADO DE BAJA: {datetime.now()}]"

        db.add(asset)
        db.commit()
        
        # Se envía el encabezado de que todo salió bien
        response.headers["X-Process-Message"] = "El activo ha sido dado de baja correctamente."
        
        return {"message": "Activo dado de baja"}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al dar de baja el Activo.")