from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app import models
from app.core.security import get_password_hash
from app.models import AssetStatus

# LISTA MAESTRA DE PERMISOS
SYSTEM_PERMISSIONS = [
    # --- USUARIOS ---
    {"name": "Ver Usuarios", "slug": "users_read", "description": "Acceso de lectura al módulo de usuarios"},
    {"name": "Crear Usuarios", "slug": "users_create", "description": "Capacidad de registrar nuevos usuarios"},
    {"name": "Editar Usuarios", "slug": "users_update", "description": "Capacidad de modificar usuarios existentes"},
    {"name": "Eliminar Usuarios", "slug": "users_delete", "description": "Capacidad de borrar usuarios"},
    
    # --- ROLES ---
    {"name": "Ver Roles", "slug": "roles_read", "description": "Ver listado de roles del sistema"},
    {"name": "Crear Roles", "slug": "roles_create", "description": "Crear nuevos roles de usuario"},
    {"name": "Editar Roles", "slug": "roles_update", "description": "Modificar nombre y descripción de roles"},
    {"name": "Eliminar Roles", "slug": "roles_delete", "description": "Eliminar roles del sistema"},

    # --- SEGURIDAD ---
    {"name": "Ver Matriz Seguridad", "slug": "security_read", "description": "Acceso a la matriz de permisos por rol"},

    # --- CATEGORÍAS ---
    {"name": "Ver Categorías", "slug": "categories_read", "description": "Ver listado de categorías"},
    {"name": "Crear Categorías", "slug": "categories_create", "description": "Crear nuevas categorías"},
    {"name": "Editar Categorías", "slug": "categories_update", "description": "Editar categorías existentes"},
    {"name": "Eliminar Categorías", "slug": "categories_delete", "description": "Eliminar categorías"},

    # --- ACTIVOS (ASSETS) ---
    {"name": "Ver Activos", "slug": "assets_read", "description": "Ver el inventario de activos"},
    {"name": "Crear Activos", "slug": "assets_create", "description": "Registrar nuevos activos en el inventario"},
    {"name": "Editar Activos", "slug": "assets_update", "description": "Actualizar información o estatus de activos"},
    {"name": "Eliminar Activos", "slug": "assets_delete", "description": "Dar de baja activos del sistema"},
    
    # --- SISTEMA ---
    {"name": "Ver Dashboard", "slug": "dashboard_read", "description": "Acceso al panel principal"},
    {"name": "Ver Configuración", "slug": "settings_read", "description": "Acceso al módulo de configuración"},
]

# CONFIGURACIÓN DE ROLES
ROLES_CONFIG = [
    {
        "name": "Super Admin",
        "description": "Acceso total al sistema",
        "permissions": ["*"] # Hereda roles_* y security_read automáticamente
    },
    {
        "name": "IT Manager",
        "description": "Gestión de activos e inventario",
        "permissions": [
            "dashboard_read",
            "categories_read", "categories_create", "categories_update", "categories_delete",
            "assets_read", "assets_create", "assets_update", "assets_delete",
            "users_read",
            "roles_read", 
            "security_read"
        ]
    },
    {
        "name": "Auditor",
        "description": "Solo lectura para revisión de inventarios",
        "permissions": [
            "dashboard_read",
            "categories_read",
            "assets_read",
            "users_read",
            "roles_read",
            "security_read"
        ]
    }
]

# LISTA DE CATEGORÍAS DEMO
DEMO_CATEGORIES = [
    "Cómputo",
    "Periféricos",
    "Móvil",
    "Mobiliario",
    "Redes"
]

# USUARIOS DEMO INICIALES
DEMO_USERS = [
    {
        "email": "admin@lumina.com",
        "full_name": "System Administrator",
        "password": "lumina1234",
        "role": "Super Admin"
    },
    {
        "email": "it@lumina.com",
        "full_name": "Gerente de TI",
        "password": "lumina12345",
        "role": "IT Manager"
    },
    {
        "email": "auditor@lumina.com",
        "full_name": "Auditor Externo",
        "password": "lumina123456",
        "role": "Auditor"
    }
]

# ACTIVOS DEMO
DEMO_ASSETS = [
    {
        "name": "MacBook Pro M3",
        "internal_code": "LAP-001",
        "serial_number": "FVFD123456",
        "category_name": "Cómputo", 
        "status": AssetStatus.AVAILABLE,
        "model": "M3 Pro 14-inch",
        "cost": 2400.00
    },
    {
        "name": "Monitor Dell 27 4K",
        "internal_code": "MON-001",
        "serial_number": "DL-998877",
        "category_name": "Periféricos",
        "status": AssetStatus.AVAILABLE,
        "model": "U2723QE",
        "cost": 450.00
    },
    {
        "name": "iPhone 15 Pro",
        "internal_code": "MOV-001",
        "serial_number": "IMEI-334455",
        "category_name": "Móvil",
        "status": AssetStatus.MAINTENANCE,
        "model": "Pro 256GB Titanium",
        "cost": 1100.00
    },
    {
        "name": "Silla Herman Miller",
        "internal_code": "MOB-001",
        "serial_number": "HM-AERON-01",
        "category_name": "Mobiliario",
        "status": AssetStatus.ASSIGNED,
        "model": "Aeron Size B",
        "cost": 1200.00
    }
]

def seed_db():
    db = SessionLocal()
    try:
        print("Iniciando sembrado de base de datos...")

        # --- CREAR PERMISOS ---
        print("   > Gestionando Permisos...")
        all_permissions_map = {} 
        for perm_data in SYSTEM_PERMISSIONS:
            perm = db.query(models.Permission).filter_by(slug=perm_data["slug"]).first()
            if not perm:
                perm = models.Permission(**perm_data)
                db.add(perm)
                print(f"     + Permiso creado: {perm_data['slug']}")
            all_permissions_map[perm_data["slug"]] = perm
        db.commit()

        # --- CREAR ROLES ---
        print("   > Gestionando Roles...")
        for role_conf in ROLES_CONFIG:
            role = db.query(models.Role).filter_by(name=role_conf["name"]).first()
            if not role:
                role = models.Role(name=role_conf["name"], description=role_conf["description"])
                db.add(role)
            
            # Actualizar permisos del rol
            role.permissions = [] 
            if "*" in role_conf["permissions"]:
                role.permissions = list(all_permissions_map.values())
            else:
                for slug in role_conf["permissions"]:
                    if slug in all_permissions_map:
                        role.permissions.append(all_permissions_map[slug])
            db.commit()

        # --- CREAR CATEGORÍAS ---
        print("   > Gestionando Categorías...")
        categories_map = {} 
        for cat_name in DEMO_CATEGORIES:
            cat = db.query(models.Category).filter(models.Category.name == cat_name).first()
            if not cat:
                cat = models.Category(name=cat_name)
                db.add(cat)
                db.commit()
                db.refresh(cat)
                print(f"     + Categoría creada: {cat_name}")
            categories_map[cat_name] = cat 

        # --- CREAR USUARIOS ---
        print("   > Gestionando Usuarios...")
        for user_data in DEMO_USERS:
            user = db.query(models.User).filter_by(email=user_data["email"]).first()
            if not user:
                role_obj = db.query(models.Role).filter_by(name=user_data["role"]).first()
                if not role_obj:
                    print(f"     Error: Rol '{user_data['role']}' no encontrado.")
                    continue

                new_user = models.User(
                    email=user_data["email"],
                    full_name=user_data["full_name"],
                    hashed_password=get_password_hash(user_data["password"]),
                    is_active=True
                )
                new_user.roles.append(role_obj)
                db.add(new_user)
                db.commit()
                print(f"     + Usuario creado: {user_data['email']}")

        # --- CREAR ACTIVOS ---
        print("   > Gestionando Activos...")
        for asset_data in DEMO_ASSETS:
            asset = db.query(models.Asset).filter_by(internal_code=asset_data["internal_code"]).first()
            
            if not asset:
                cat_name = asset_data.pop("category_name")
                if cat_name in categories_map:
                    category_obj = categories_map[cat_name]
                    new_asset = models.Asset(
                        category_id=category_obj.id,
                        **asset_data
                    )
                    db.add(new_asset)
                    db.commit()
                    print(f"     + Activo creado: {asset_data['name']} ({cat_name})")
                else:
                    print(f"     - Error: La categoría '{cat_name}' no existe para el activo {asset_data['name']}")

        print("Sembrado completado exitosamente.")

    except Exception as e:
        print(f"Error crítico durante el sembrado: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()