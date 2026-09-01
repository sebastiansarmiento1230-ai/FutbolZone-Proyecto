import secrets
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.usuario_model import UsuarioModel
from app.models.password_reset_model import PasswordResetPinModel
from app.schemas.password_reset_schema import SolicitarPinSchema, VerificarPinSchema, CambiarPasswordSchema
from app.utils.auth import hash_password
from app.utils.response import api_response
from app.utils.email_service import send_password_reset_pin_email


def solicitar_pin(body: SolicitarPinSchema, db: Session):
    """Genera un PIN de 6 dígitos, lo almacena con expiración de 15 min y lo envía por correo."""
    email_clean = body.email.strip().lower()
    
    usuario = db.query(UsuarioModel).filter(UsuarioModel.email == email_clean).first()
    if not usuario:
        return api_response(
            False,
            "No encontramos ninguna cuenta asociada a este correo electrónico.",
            error="User not found"
        )
    
    if not usuario.activo:
        return api_response(
            False,
            "Esta cuenta se encuentra temporalmente desactivada. Contacta al administrador.",
            error="Account disabled"
        )

    # 1. Invalidar pines anteriores no usados
    db.query(PasswordResetPinModel).filter(
        PasswordResetPinModel.email == email_clean,
        PasswordResetPinModel.usado == False
    ).update({"usado": True})

    # 2. Generar PIN criptográfico de 6 dígitos (100000 a 999999)
    pin = f"{secrets.randbelow(900000) + 100000}"
    expira_en = datetime.utcnow() + timedelta(minutes=15)

    # 3. Guardar en base de datos
    nuevo_pin = PasswordResetPinModel(
        email=email_clean,
        pin=pin,
        expira_en=expira_en,
        usado=False
    )
    db.add(nuevo_pin)
    db.commit()

    # 4. Enviar correo electrónico
    enviado_real = send_password_reset_pin_email(email_clean, usuario.nombre, pin)

    mensaje_respuesta = (
        f"Código de seguridad enviado a {email_clean}. Revisa tu bandeja de entrada."
        if enviado_real
        else f"Código PIN generado exitosamente para {email_clean}."
    )

    return api_response(
        True,
        mensaje_respuesta,
        data={
            "email": email_clean,
            "expira_minutos": 15,
            "correo_enviado_real": enviado_real,
            "pin_demo": pin if not enviado_real else None
        }
    )


def verificar_pin(body: VerificarPinSchema, db: Session):
    """Verifica si el PIN es correcto y aún no ha expirado."""
    email_clean = body.email.strip().lower()
    pin_clean = body.pin.strip()

    registro = db.query(PasswordResetPinModel).filter(
        PasswordResetPinModel.email == email_clean,
        PasswordResetPinModel.pin == pin_clean,
        PasswordResetPinModel.usado == False
    ).order_by(PasswordResetPinModel.id.desc()).first()

    if not registro:
        return api_response(False, "El código PIN ingresado es incorrecto.", error="Invalid PIN")

    if datetime.utcnow() > registro.expira_en:
        return api_response(False, "El código PIN ha expirado. Por favor solicita uno nuevo.", error="Expired PIN")

    return api_response(True, "Código PIN verificado correctamente.")


def cambiar_password_con_pin(body: CambiarPasswordSchema, db: Session):
    """Verifica el PIN y actualiza la contraseña del usuario con hash seguro."""
    email_clean = body.email.strip().lower()
    pin_clean = body.pin.strip()

    # 1. Validar PIN
    registro = db.query(PasswordResetPinModel).filter(
        PasswordResetPinModel.email == email_clean,
        PasswordResetPinModel.pin == pin_clean,
        PasswordResetPinModel.usado == False
    ).order_by(PasswordResetPinModel.id.desc()).first()

    if not registro:
        return api_response(False, "El código PIN es inválido o ya fue utilizado.", error="Invalid PIN")

    if datetime.utcnow() > registro.expira_en:
        return api_response(False, "El código PIN ha expirado. Solicita un nuevo código.", error="Expired PIN")

    # 2. Validar contraseña
    if len(body.nueva_password) < 6:
        return api_response(False, "La contraseña debe contener al menos 6 caracteres.", error="Short password")

    # 3. Buscar usuario
    usuario = db.query(UsuarioModel).filter(UsuarioModel.email == email_clean).first()
    if not usuario:
        return api_response(False, "Usuario no encontrado.", error="User not found")

    # 4. Actualizar contraseña y quemar el PIN
    usuario.password_hash = hash_password(body.nueva_password)
    registro.usado = True

    db.commit()
    db.refresh(usuario)

    return api_response(
        True,
        "¡Tu contraseña ha sido actualizada con éxito! Ya puedes iniciar sesión con tu nueva clave.",
        data={"email": usuario.email, "nombre": usuario.nombre}
    )
