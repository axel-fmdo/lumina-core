from passlib.context import CryptContext

# Configuramos el contexto de encriptación usando bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica si una contraseña plana coincide con el hash guardado."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Convierte una contraseña plana en un hash seguro."""
    return pwd_context.hash(password)