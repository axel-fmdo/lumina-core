import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Se lee la URL de conexión desde las variables de entorno
DATABASE_URL = os.getenv("DATABASE_URL")

# Se crea el motor de conexión
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# Se crea la fábrica de sesiones
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Se crea la clase base para nuestros modelos
Base = declarative_base()

# Dependencia para obtener la DB en los endpoints
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()