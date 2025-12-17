import uuid
import enum
from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, Table, Float, Enum as SqEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

# --- TABLAS PIVOTE (Relaciones Muchos a Muchos) ---

# Relación: Un Rol tiene muchos Permisos / Un Permiso está en muchos Roles
role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", UUID(as_uuid=True), ForeignKey("roles.id"), primary_key=True),
    Column("permission_id", UUID(as_uuid=True), ForeignKey("permissions.id"), primary_key=True)
)

# Relación: Un Usuario tiene muchos Roles
user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True),
    Column("role_id", UUID(as_uuid=True), ForeignKey("roles.id"), primary_key=True)
)

# --- MODELOS PRINCIPALES ---

class Permission(Base):
    __tablename__ = "permissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, index=True) 
    slug = Column(String, unique=True, index=True) 
    description = Column(String, nullable=True)

class Role(Base):
    __tablename__ = "roles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, index=True)
    description = Column(String, nullable=True)
    
    # Relación: Los roles tienen permisos
    permissions = relationship("Permission", secondary=role_permissions, backref="roles")

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Auditoría
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relación: Los usuarios tienen roles
    roles = relationship("Role", secondary=user_roles, backref="users")

    # Relación: Los usuarios tienen activos
    assigned_assets = relationship("Asset", back_populates="assigned_to")

# Definición de los Estados posibles de un Activo
class AssetStatus(str, enum.Enum):
    AVAILABLE = "Disponible"
    ASSIGNED = "Asignado"
    MAINTENANCE = "En Mantenimiento"
    RETIRED = "De Baja"

class Asset(Base):
    __tablename__ = "assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    internal_code = Column(String, unique=True, index=True, nullable=False)
    serial_number = Column(String, unique=True, index=True, nullable=True)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=False)
    model = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    cost = Column(Float, nullable=True)
    
    # Estado y Ciclo de Vida
    status = Column(SqEnum(AssetStatus), default=AssetStatus.AVAILABLE, nullable=False)
    acquisition_date = Column(DateTime, nullable=True)
    
    # Auditoría
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relación: Los activos tienen categoría
    category = relationship("Category", back_populates="assets")
    
    # Relación: Un activo puede pertenecer a un usuario
    assigned_to_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Propiedad para acceder a los usuarios desde activos
    assigned_to = relationship("User", back_populates="assigned_assets") 

class Category(Base):
    __tablename__ = "categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relación inversa: Una categoría tiene muchos activos
    assets = relationship("Asset", back_populates="category")

# Enum para el tipo de movimiento
class AssetActionType(str, enum.Enum):
    ASSIGN = "Asignación"
    UNASSIGN = "Devolución"
    MAINTENANCE = "Mantenimiento"
    RETIRED = "Baja"

class AssetHistory(Base):
    __tablename__ = "asset_histories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id"), nullable=False)
    assigned_to_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    action_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    action_type = Column(SqEnum(AssetActionType), nullable=False)
    comments = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relaciones para poder mostrar nombres en el historial
    asset = relationship("Asset")
    assigned_to = relationship("User", foreign_keys=[assigned_to_id])
    action_by = relationship("User", foreign_keys=[action_by_id])