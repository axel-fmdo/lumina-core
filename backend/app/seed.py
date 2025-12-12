from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app import models
from app.core.security import get_password_hash

# 1. LISTA MAESTRA DE PERMISOS
# Definimos todos los permisos que existen en el sistema
SYSTEM_PERMISSIONS = [
    # --- USUARIOS ---
    {"name": "Ver Usuarios", "slug": "users_read", "description": "Acceso de lectura al módulo de usuarios"},
    {"name": "Crear Usuarios", "slug": "users_create", "description": "Capacidad de registrar nuevos usuarios"},
    {"name": "Editar Usuarios", "slug": "users_update", "description": "Capacidad de modificar usuarios existentes"},
    {"name": "Eliminar Usuarios", "slug": "users_delete", "description": "Capacidad de borrar usuarios (Soft delete)"},
    
    # --- ACTIVOS (ASSETS) ---
    {"name": "Ver Activos", "slug": "assets_read", "description": "Ver el inventario de activos"},
    {"name": "Crear Activos", "slug": "assets_create", "description": "Registrar nuevos activos en el inventario"},
    {"name": "Editar Activos", "slug": "assets_update", "description": "Actualizar información o estatus de activos"},
    {"name": "Eliminar Activos", "slug": "assets_delete", "description": "Dar de baja activos del sistema"},
    
    # --- SISTEMA ---
    {"name": "Ver Dashboard", "slug": "dashboard_read", "description": "Acceso al panel principal"},
    {"name": "Ver Configuración", "slug": "settings_read", "description": "Acceso al módulo de configuración"},
]

# 2. CONFIGURACIÓN DE ROLES
# Aquí definimos qué permisos (slugs) tiene cada rol
ROLES_CONFIG = [
    {
        "name": "Super Admin",
        "description": "Acceso total al sistema",
        "permissions": ["*"] # El asterisco indica TODOS
    },
    {
        "name": "IT Manager",
        "description": "Gestión de activos e inventario",
        "permissions": [
            "dashboard_read",
            "assets_read", "assets_create", "assets_update", "assets_delete",
            "users_read"
        ]
    },
    {
        "name": "Auditor",
        "description": "Solo lectura para revisión de inventarios",
        "permissions": [
            "dashboard_read",
            "assets_read",
            "users_read"
        ]
    }
]

# 3. USUARIOS DEMO INICIALES
DEMO_USERS = [
    {
        "email": "admin@lumina.com",
        "full_name": "System Administrator",
        "password": "admin123",
        "role": "Super Admin"
    },
    {
        "email": "it@lumina.com",
        "full_name": "Gerente de TI",
        "password": "lumina1234",
        "role": "IT Manager"
    },
    {
        "email": "auditor@lumina.com",
        "full_name": "Auditor Externo",
        "password": "lumina12345",
        "role": "Auditor"
    }
]

def seed_db():
    db = SessionLocal()
    try:
        print("Iniciando sembrado de base de datos (Demo Ready)...")

        # --- A. CREAR PERMISOS ---
        all_permissions_map = {} 
        for perm_data in SYSTEM_PERMISSIONS:
            perm = db.query(models.Permission).filter_by(slug=perm_data["slug"]).first()
            if not perm:
                perm = models.Permission(**perm_data)
                db.add(perm)
                print(f"   + Permiso creado: {perm_data['slug']}")
            all_permissions_map[perm_data["slug"]] = perm
        
        db.commit()

        # --- B. CREAR ROLES Y ASIGNAR PERMISOS ---
        for role_conf in ROLES_CONFIG:
            role = db.query(models.Role).filter_by(name=role_conf["name"]).first()
            if not role:
                role = models.Role(name=role_conf["name"], description=role_conf["description"])
                db.add(role)
                print(f"   + Rol creado: {role_conf['name']}")
            
            # Asignar permisos al rol (Limpiamos y reasignamos para asegurar consistencia)
            role.permissions = [] # Limpiamos permisos anteriores en memoria
            
            if "*" in role_conf["permissions"]:
                # Asignar TODOS
                role.permissions = list(all_permissions_map.values())
            else:
                # Asignar Específicos
                for slug in role_conf["permissions"]:
                    if slug in all_permissions_map:
                        role.permissions.append(all_permissions_map[slug])
            
            db.commit() # Guardamos la relación

        # --- C. CREAR USUARIOS DEMO ---
        for user_data in DEMO_USERS:
            user = db.query(models.User).filter_by(email=user_data["email"]).first()
            if not user:
                # Buscar el rol para asignarlo
                role_obj = db.query(models.Role).filter_by(name=user_data["role"]).first()
                if not role_obj:
                    print(f"Error: Rol '{user_data['role']}' no encontrado para usuario {user_data['email']}")
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
                print(f"   + Usuario creado: {user_data['email']} ({user_data['role']})")
            else:
                print(f"   . Usuario existente: {user_data['email']}")

        print("Sembrado completado exitosamente.")

    except Exception as e:
        print(f"Error durante el sembrado: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()