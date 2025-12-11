from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app import models
from app.core.security import get_password_hash

# Lista de Permisos Base del Sistema (Formato snake_case)
INITIAL_PERMISSIONS = [
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
    
    # --- SISTEMA / DASHBOARD ---
    {"name": "Ver Dashboard", "slug": "dashboard_read", "description": "Acceso a las métricas principales"},
    {"name": "Ver Configuración", "slug": "settings_read", "description": "Acceso al módulo de configuración"},
]

def seed_db():
    db = SessionLocal()
    try:
        print("Iniciando sembrado de base de datos iniciales...")

        # 1. Crear Permisos
        permissions_map = {} 
        for perm_data in INITIAL_PERMISSIONS:
            perm = db.query(models.Permission).filter_by(slug=perm_data["slug"]).first()
            if not perm:
                perm = models.Permission(**perm_data)
                db.add(perm)
                print(f"   + Permiso creado: {perm_data['slug']}")
            permissions_map[perm_data["slug"]] = perm
        
        db.commit()

        # 2. Crear Rol Super Admin
        admin_role = db.query(models.Role).filter_by(name="Super Admin").first()
        if not admin_role:
            admin_role = models.Role(name="Super Admin", description="Acceso total al sistema")
            # Asignar TODOS los permisos al admin
            for perm in permissions_map.values():
                admin_role.permissions.append(perm)
            
            db.add(admin_role)
            db.commit()
            print("   + Rol 'Super Admin' creado y permisos asignados.")
        else:
            # Si el rol ya existe, nos aseguramos de actualizarle los nuevos permisos si faltan
            # Esto es útil si corres el seed varias veces
            existing_slugs = [p.slug for p in admin_role.permissions]
            for perm in permissions_map.values():
                if perm.slug not in existing_slugs:
                    admin_role.permissions.append(perm)
                    print(f"   ^ Permiso {perm.slug} agregado al Admin existente.")
            db.commit()

        # 3. Crear Usuario Admin Inicial
        admin_email = "admin@lumina.com"
        user = db.query(models.User).filter_by(email=admin_email).first()
        if not user:
            user = models.User(
                email=admin_email,
                full_name="System Administrator",
                hashed_password=get_password_hash("admin123"),
                is_active=True
            )
            user.roles.append(admin_role)
            db.add(user)
            db.commit()
            print(f"   + Usuario Admin creado: {admin_email}")
        else:
            print(f"   . Usuario Admin ya existe.")

        print("Sembrado completado exitosamente.")

    except Exception as e:
        print(f"Error durante el sembrado: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()