from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app import models, schemas
from app.core.deps import PermissionChecker

router = APIRouter(prefix="/roles", tags=["Roles"])

# Usaremos un esquema simple para el dropdown
class RoleDropdown(schemas.RoleBase):
    id: schemas.UUID

    class Config:
        from_attributes = True

@router.get("/", response_model=List[RoleDropdown], dependencies=[Depends(PermissionChecker("users_read"))])
def read_roles(db: Session = Depends(get_db)):
    # Traemos todos los roles para llenar selects
    return db.query(models.Role).all()