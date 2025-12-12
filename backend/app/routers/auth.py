from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app import models
from app.core.security import verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login")
def login(
    response: Response,
        form_data: OAuth2PasswordRequestForm = Depends(), 
        db: Session = Depends(get_db)
    ):
    """
    Endpoint estándar OAuth2 para obtener token.
    username: Se espera el email del usuario.
    password: La contraseña en texto plano.
    """
    # 1. Buscar usuario por email
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    
    # 2. Validaciones
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se encontró un usuario con las credenciales ingresadas.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="La contraseña ingresada es incorrecta.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario inactivo. Favor de comunicarse al área de soporte."
        )

    # 3. Generar Token
    # Guardamos el ID del usuario (sub) y sus roles/permisos en el token si quisiéramos
    # Por ahora solo el subject (email o id)
    access_token = create_access_token(data={"sub": str(user.id)})

    first_name = user.full_name.split(" ")[0] if user.full_name else "Usuario"
    response.headers["X-Process-Message"] = f"¡Bienvenido de nuevo, {first_name}!"

    return {"access_token": access_token, "token_type": "bearer"}