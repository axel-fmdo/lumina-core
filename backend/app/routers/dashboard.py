from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc
from typing import List
from app.core.database import get_db
from app.core.deps import PermissionChecker
from app import models, schemas

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

@router.get("/", response_model=schemas.DashboardResponse, dependencies=[Depends(PermissionChecker("dashboard_read"))])
def get_dashboard_data(
    db: Session = Depends(get_db)
):
    """
    Método para obtener la data del Dashboard.
    """
    try:
        # Consulta de  el total de activos
        total_assets = db.query(func.count(models.Asset.id)).scalar()
        
        # Consulta sobre el valor total de los activos (si es None, pone 0)
        total_value = db.query(func.sum(models.Asset.cost)).scalar() or 0.0
        
        # Conteo de la cantidad de activos por estado (omitiendo los dados de baja)
        assigned = db.query(func.count(models.Asset.id)).filter(models.Asset.status == models.AssetStatus.ASSIGNED).scalar()
        available = db.query(func.count(models.Asset.id)).filter(models.Asset.status == models.AssetStatus.AVAILABLE).scalar()
        maintenance = db.query(func.count(models.Asset.id)).filter(models.Asset.status == models.AssetStatus.MAINTENANCE).scalar()

        # Distribución de estados por categoría
        cat_stats = db.query(
            models.Category.name,
            func.count(models.Asset.id).label("count"),
            func.sum(models.Asset.cost).label("value")
        ).join(models.Asset).group_by(models.Category.id, models.Category.name).all()
        
        # Formateo de respuesta de categorías
        category_distribution = [
            {"name": row.name, "count": row.count, "value": row.value or 0} 
            for row in cat_stats
        ]

        # Obtener los últimos 7 movimientos de activos realizados
        recent_activity = db.query(models.AssetHistory)\
            .options(
                joinedload(models.AssetHistory.assigned_to),
                joinedload(models.AssetHistory.action_by),
                joinedload(models.AssetHistory.asset)
            )\
            .order_by(desc(models.AssetHistory.created_at))\
            .limit(7)\
            .all()

        return {
            "stats": {
                "total_assets": total_assets,
                "total_value": total_value,
                "assigned_count": assigned,
                "available_count": available,
                "maintenance_count": maintenance
            },
            "category_distribution": category_distribution,
            "recent_activity": recent_activity
        }
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al obtener los datos del Tablero.")