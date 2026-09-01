import sys
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config.database import engine, Base
import app.models  # Registra todos los modelos

from app.routes.usuario_routes  import router as usuario_router
from app.routes.cancha_routes   import router as cancha_router
from app.routes.reserva_routes  import router as reserva_router
from app.routes.torneo_routes   import router as torneo_router
from app.routes.pago_routes     import router as pago_router
from app.routes.horario_routes  import router as horario_router
from app.routes.empleado_routes import router as empleado_router
from app.routes.reporte_routes  import router as reporte_router
from app.routes.resena_routes   import router as resena_router
from app.routes.password_reset_routes import router as password_reset_router

from app.middleware.error_handler import (
    http_exception_handler,
    validation_exception_handler,
    internal_exception_handler
)

# ================================================
# CREAR TABLAS Y DATOS INICIALES AUTOMÁTICAMENTE
# ================================================
Base.metadata.create_all(bind=engine)

def _seed_db():
    from app.config.database import SessionLocal
    from app.models.usuario_model import UsuarioModel, RolUsuario
    from app.models.cancha_model import CanchaModel
    from app.models.empleado_model import EmpleadoModel
    from app.utils.auth import hash_password

    db = SessionLocal()
    try:
        if not db.query(UsuarioModel).first():
            print("[DB] Sembrando datos iniciales en la base de datos...")
            admin = UsuarioModel(
                nombre="Admin",
                apellido="FutbolZone",
                email="admin@futbolzone.com",
                password_hash=hash_password("admin123"),
                rol=RolUsuario.admin
            )
            cliente = UsuarioModel(
                nombre="Carlos",
                apellido="Díaz",
                email="cliente@futbolzone.com",
                password_hash=hash_password("cliente123"),
                rol=RolUsuario.cliente
            )
            db.add_all([admin, cliente])

            canchas = [
                CanchaModel(nombre="Cancha Central", tipo="Fútbol 5", descripcion="Cancha principal con césped sintético premium", capacidad_jugadores=10, precio_hora=50000.0, tiene_iluminacion=True, tiene_techo=False),
                CanchaModel(nombre="Cancha Norte", tipo="Fútbol 7", descripcion="Cancha amplia con iluminación LED de foco nocturno", capacidad_jugadores=14, precio_hora=70000.0, tiene_iluminacion=True, tiene_techo=False),
                CanchaModel(nombre="Cancha Sur", tipo="Fútbol 11", descripcion="Cancha reglamentaria profesional para torneos", capacidad_jugadores=22, precio_hora=100000.0, tiene_iluminacion=True, tiene_techo=True),
                CanchaModel(nombre="Cancha Este", tipo="Fútbol 5", descripcion="Cancha sintética compacta con cubierta", capacidad_jugadores=10, precio_hora=45000.0, tiene_iluminacion=False, tiene_techo=True),
                CanchaModel(nombre="Cancha Oeste", tipo="Fútbol 7", descripcion="Cancha techada con iluminación LED y graderías", capacidad_jugadores=14, precio_hora=65000.0, tiene_iluminacion=True, tiene_techo=True),
            ]
            db.add_all(canchas)

            empleados = [
                EmpleadoModel(nombre="Juan", apellido="Pérez", cargo="Administrador", telefono="3001234567", email="juan.perez@futbolzone.com"),
                EmpleadoModel(nombre="María", apellido="González", cargo="Coordinador", telefono="3109876543", email="maria.gonzalez@futbolzone.com"),
                EmpleadoModel(nombre="Pedro", apellido="Ramírez", cargo="Mantenimiento", telefono="3205556677", email="pedro.ramirez@futbolzone.com"),
                EmpleadoModel(nombre="Sofía", apellido="Torres", cargo="Atención al cliente", telefono="3154443322", email="sofia.torres@futbolzone.com"),
                EmpleadoModel(nombre="Carlos", apellido="Vargas", cargo="Seguridad", telefono="3001112233", email="carlos.vargas@futbolzone.com"),
            ]
            db.add_all(empleados)

            db.commit()
            print("[DB] Datos iniciales sembrados con éxito en SQLite.")
    except Exception as e:
        print(f"[DB Error] Error al sembrar datos iniciales: {e}")
        db.rollback()
    finally:
        db.close()

_seed_db()


# ================================================
# APP
# ================================================
app = FastAPI(
    title="⚽ FutbolZone API",
    description="Backend para gestión de canchas sintéticas — FutbolZone",
    version="1.0.0"
)

# ================================================
# CORS — permite que el frontend HTML pueda consumir la API
# ================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# ================================================
# MANEJO DE ERRORES GLOBAL
# ================================================
app.add_exception_handler(StarletteHTTPException,  http_exception_handler)
app.add_exception_handler(RequestValidationError,  validation_exception_handler)
app.add_exception_handler(Exception,               internal_exception_handler)

# ================================================
# ROUTERS
# ================================================
app.include_router(usuario_router)
app.include_router(cancha_router)
app.include_router(reserva_router)
app.include_router(torneo_router)
app.include_router(pago_router)
app.include_router(horario_router)
app.include_router(empleado_router)
app.include_router(reporte_router)
app.include_router(resena_router)
app.include_router(password_reset_router)


@app.get("/", tags=["Root"])
def root():
    return {
        "success": True,
        "message": "FutbolZone API funcionando ⚽",
        "version": "1.0.0",
        "docs": "/docs"
    }


# ================================================
# CORRER: uvicorn main:app --reload --port 5000
# ================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
