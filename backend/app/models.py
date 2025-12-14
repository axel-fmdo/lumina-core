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
    name = Column(String, unique=True, index=True) # Ej: "Crear Usuarios"
    slug = Column(String, unique=True, index=True) # Ej: "users:create" (Para validación en código)
    description = Column(String, nullable=True)

class Role(Base):
    __tablename__ = "roles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, index=True) # Ej: "Administrador"
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
    
    # Auditoría automática
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relación: Los usuarios tienen roles
    roles = relationship("Role", secondary=user_roles, backref="users")

# Definición de los Estados Posibles de un Activo
class AssetStatus(str, enum.Enum):
    AVAILABLE = "Disponible"
    ASSIGNED = "Asignado"
    MAINTENANCE = "En Mantenimiento"
    RETIRED = "De Baja"

class Asset(Base):
    __tablename__ = "assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Identificación
    name = Column(String, nullable=False) # Ej: "MacBook Pro M1"
    description = Column(String, nullable=True)
    internal_code = Column(String, unique=True, index=True, nullable=False) # Ej: "LUM-001"
    serial_number = Column(String, unique=True, index=True, nullable=True)
    
    # Detalles
    category = Column(String, nullable=False) # Ej: "Cómputo", "Mobiliario"
    model = Column(String, nullable=True)
    image_url = Column(String, nullable=True) # Para foto del activo
    cost = Column(Float, nullable=True)
    
    # Estado y Ciclo de Vida
    status = Column(SqEnum(AssetStatus), default=AssetStatus.AVAILABLE, nullable=False)
    acquisition_date = Column(DateTime, nullable=True)
    
    # Auditoría
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # --- RELACIONES ---
    
    # Relación: Un activo puede pertenecer a UN usuario (Muchos a Uno)
    assigned_to_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Propiedad para acceder al objeto User desde el Asset (asset.assigned_to.full_name)
    assigned_to = relationship("User", backref="assets") 
    # Nota: 'backref="assets"' crea automáticamente 'user.assets' para ver qué tiene un usuario.