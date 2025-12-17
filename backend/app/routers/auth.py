from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app import models
from app.core.security import verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])

# Validar las credenciales de acceso de una persona
@router.post("/login")
def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    """
    Endpoint estándar OAuth2 para validar credenciales de acceso y obtener el token de sesión.
    """
    # Se buscar al usuario por su email
    user = db.query(models.User).filter(models.User.email == form_data.username).first()

    try:
        # Se valida que exista el usuario
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No se encontró un Usuario con las credenciales ingresadas.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Se valida la contraseña
        if not verify_password(form_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="La contraseña ingresada es incorrecta.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Se valida que esté activo
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Usuario inactivo. Favor de comunicarse al área de soporte."
            )

        # Se genera el token
        access_token = create_access_token(data={"sub": str(user.id)})

        first_name = user.full_name.split(" ")[0] if user.full_name else "Usuario"
        response.headers["X-Process-Message"] = f"¡Bienvenido, {first_name}!"

        return {"access_token": access_token, "token_type": "bearer"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error al validar los datos para iniciar sesión.")