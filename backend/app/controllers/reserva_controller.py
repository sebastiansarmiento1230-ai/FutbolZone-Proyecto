from sqlalchemy.orm import Session
from datetime import datetime

from app.models.reserva_model import ReservaModel, EstadoReserva
from app.models.cancha_model import CanchaModel
from app.models.usuario_model import UsuarioModel
from app.schemas.reserva_schema import ReservaSchema, ReservaUpdateSchema
from app.utils.response import api_response


def _reserva_dict(r: ReservaModel, con_nombres: bool = True):
    d = {
        "id": r.id,
        "usuario_id": r.usuario_id,
        "cancha_id": r.cancha_id,
        "fecha": str(r.fecha),
        "hora_inicio": str(r.hora_inicio),
        "hora_fin": str(r.hora_fin),
        "precio_total": r.precio_total,
        "estado": r.estado,
        "notas": r.notas,
        "creado_en": str(r.creado_en) if r.creado_en else None
    }
    if con_nombres:
        d["cliente"] = f"{r.usuario.nombre} {r.usuario.apellido}" if r.usuario else ""
        d["cancha_nombre"] = r.cancha.nombre if r.cancha else ""
    return d


def get_reservas(db: Session):
    reservas = db.query(ReservaModel).all()
    return api_response(True, "Lista de reservas", data=[_reserva_dict(r) for r in reservas])


def get_reserva(id: int, db: Session):
    r = db.query(ReservaModel).filter(ReservaModel.id == id).first()
    if not r:
        return api_response(False, "Reserva no encontrada", error="Not found")
    return api_response(True, "Reserva encontrada", data=_reserva_dict(r))


def get_reservas_usuario(usuario_id: int, db: Session):
    reservas = db.query(ReservaModel).filter(ReservaModel.usuario_id == usuario_id).all()
    return api_response(True, "Mis reservas", data=[_reserva_dict(r) for r in reservas])


def create_reserva(body: ReservaSchema, usuario_id: int, db: Session):
    cancha = db.query(CanchaModel).filter(
        CanchaModel.id == body.cancha_id,
        CanchaModel.activa == True
    ).first()
    if not cancha:
        return api_response(False, "Cancha no encontrada o no disponible", error="Not found")

    # Verificar conflicto de horario
    conflicto = db.query(ReservaModel).filter(
        ReservaModel.cancha_id == body.cancha_id,
        ReservaModel.fecha     == body.fecha,
        ReservaModel.estado.in_([EstadoReserva.pendiente, EstadoReserva.confirmada]),
        ReservaModel.hora_inicio < body.hora_fin,
        ReservaModel.hora_fin    > body.hora_inicio
    ).first()
    if conflicto:
        return api_response(False, "La cancha ya está reservada en ese horario", error="Conflict")

    # Calcular precio automáticamente con soporte para kit y árbitro
    if body.precio_total is not None and body.precio_total > 0:
        precio = float(body.precio_total)
    else:
        inicio_dt = datetime.combine(datetime.today(), body.hora_inicio)
        fin_dt    = datetime.combine(datetime.today(), body.hora_fin)
        horas     = (fin_dt - inicio_dt).seconds / 3600
        costo_cancha = horas * cancha.precio_hora
        extra_kit = 15000 if (body.incluye_kit or (body.notas and 'Kit: Sí' in body.notas)) else 0
        extra_arbitro = 30000 if (body.incluye_arbitro or (body.notas and 'Árbitro: Sí' in body.notas)) else 0
        descuento = body.descuento if body.descuento else 0
        precio = max(costo_cancha + extra_kit + extra_arbitro - descuento, 0)
    precio = round(precio, 2)

    nueva = ReservaModel(
        usuario_id=usuario_id,
        cancha_id=body.cancha_id,
        fecha=body.fecha,
        hora_inicio=body.hora_inicio,
        hora_fin=body.hora_fin,
        precio_total=precio,
        notas=body.notas
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return api_response(True, "Reserva creada correctamente",
                        data={"id": nueva.id, "precio_total": nueva.precio_total, "estado": nueva.estado})


def update_reserva(id: int, body: ReservaUpdateSchema, db: Session):
    reserva = db.query(ReservaModel).filter(ReservaModel.id == id).first()
    if not reserva:
        return api_response(False, "Reserva no encontrada", error="Not found")
    for campo, valor in body.model_dump(exclude_unset=True).items():
        setattr(reserva, campo, valor)
    db.commit()
    db.refresh(reserva)
    return api_response(True, "Reserva actualizada correctamente", data={"id": reserva.id})


def delete_reserva(id: int, db: Session):
    reserva = db.query(ReservaModel).filter(ReservaModel.id == id).first()
    if not reserva:
        return api_response(False, "Reserva no encontrada", error="Not found")
    reserva.estado = EstadoReserva.cancelada
    db.commit()
    return api_response(True, "Reserva cancelada correctamente")
