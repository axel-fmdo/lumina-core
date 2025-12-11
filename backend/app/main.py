from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app import models
# Importaciones del Router
from app.routers import auth, users

# Crear las tablas en la BD al iniciar (Solo para desarrollo)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Lumina Asset Manager API")

# Configuración de CORS
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router de autenticación
app.include_router(auth.router)

#Router de usuarios
app.include_router(users.router)

@app.get("/")
def read_root():
    return {"system": "Lumina", "status": "Online", "version": "0.1.0"}
