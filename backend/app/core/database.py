import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Leemos la URL de conexión desde las variables de entorno (definidas en docker-compose)
DATABASE_URL = os.getenv("DATABASE_URL")

# Creamos el motor de conexión
# pool_pre_ping=True ayuda a reconectar si la base de datos cierra la conexión
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# Creamos la fábrica de sesiones
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Creamos la clase base para nuestros modelos
Base = declarative_base()

# Dependencia para obtener la DB en los endpoints (Dependency Injection)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()