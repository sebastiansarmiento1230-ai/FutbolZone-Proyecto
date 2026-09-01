from sqlalchemy.orm import Session
from datetime import datetime

from app.models.cancha_model import CanchaModel
from app.models.reserva_model import ReservaModel, EstadoReserva
from app.schemas.cancha_schema import CanchaSchema, CanchaUpdateSchema
from app.utils.response import api_response


def get_canchas(db: Session, solo_activas: bool = False):
    query = db.query(CanchaModel)
    if solo_activas:
        query = query.filter(CanchaModel.activa == True)
    canchas = query.all()
    data = [
        {
            "id": c.id,
            "nombre": c.nombre,
            "tipo": c.tipo,
            "descripcion": c.descripcion,
            "precio_hora": c.precio_hora,
            "capacidad": c.capacidad_jugadores,
            "iluminacion": c.tiene_iluminacion,
            "techo": c.tiene_techo,
            "direccion": getattr(c, "direccion", "Calle 63 # 28-45, Sede Central (El Campín)"),
            "activa": c.activa
        }
        for c in canchas
    ]
    return api_response(True, "Lista de canchas", data=data)


def get_cancha(id: int, db: Session):
    c = db.query(CanchaModel).filter(CanchaModel.id == id).first()
    if not c:
        return api_response(False, "Cancha no encontrada", error="Not found")
    data = {
        "id": c.id, "nombre": c.nombre, "tipo": c.tipo,
        "descripcion": c.descripcion, "precio_hora": c.precio_hora,
        "capacidad": c.capacidad_jugadores,
        "iluminacion": c.tiene_iluminacion, "techo": c.tiene_techo,
        "direccion": getattr(c, "direccion", "Calle 63 # 28-45, Sede Central (El Campín)"),
        "activa": c.activa
    }
    return api_response(True, "Cancha encontrada", data=data)


def create_cancha(body: CanchaSchema, db: Session):
    nueva = CanchaModel(
        nombre=body.nombre,
        tipo=body.tipo,
        descripcion=body.descripcion,
        capacidad_jugadores=body.capacidad_jugadores,
        precio_hora=body.precio_hora,
        tiene_iluminacion=body.tiene_iluminacion,
        tiene_techo=body.tiene_techo
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return api_response(True, "Cancha creada correctamente",
                        data={"id": nueva.id, "nombre": nueva.nombre})


def update_cancha(id: int, body: CanchaUpdateSchema, db: Session):
    cancha = db.query(CanchaModel).filter(CanchaModel.id == id).first()
    if not cancha:
        return api_response(False, "Cancha no encontrada", error="Not found")
    for campo, valor in body.model_dump(exclude_unset=True).items():
        setattr(cancha, campo, valor)
    db.commit()
    db.refresh(cancha)
    return api_response(True, "Cancha actualizada correctamente", data={"id": cancha.id})


def delete_cancha(id: int, db: Session):
    cancha = db.query(CanchaModel).filter(CanchaModel.id == id).first()
    if not cancha:
        return api_response(False, "Cancha no encontrada", error="Not found")
    cancha.activa = False
    db.commit()
    return api_response(True, "Cancha desactivada correctamente")


def get_disponibilidad(cancha_id: int, fecha: str, db: Session):
    from datetime import time as dtime
    cancha = db.query(CanchaModel).filter(CanchaModel.id == cancha_id).first()
    if not cancha:
        return api_response(False, "Cancha no encontrada", error="Not found")

    fecha_obj = datetime.strptime(fecha, "%Y-%m-%d").date()
    reservas = db.query(ReservaModel).filter(
        ReservaModel.cancha_id == cancha_id,
        ReservaModel.fecha == fecha_obj,
        ReservaModel.estado.in_([EstadoReserva.pendiente, EstadoReserva.confirmada])
    ).all()

    bloques_disponibles = []
    bloques_ocupados    = []

    for hora in range(6, 22):
        inicio = dtime(hora, 0)
        fin    = dtime(hora + 1, 0)
        ocupado = any(
            not (fin <= r.hora_inicio or inicio >= r.hora_fin) for r in reservas
        )
        bloque = {"inicio": str(inicio), "fin": str(fin)}
        if ocupado:
            bloques_ocupados.append(bloque)
        else:
            bloques_disponibles.append(bloque)

    return api_response(True, "Disponibilidad consultada", data={
        "cancha": cancha.nombre,
        "fecha": fecha,
        "disponibles": bloques_disponibles,
        "ocupados":    bloques_ocupados
    })
