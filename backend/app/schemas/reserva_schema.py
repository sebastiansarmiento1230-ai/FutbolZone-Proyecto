from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date, time


class ReservaSchema(BaseModel):
    cancha_id:       int
    fecha:           date
    hora_inicio:     time
    hora_fin:        time
    precio_total:    Optional[float] = None
    incluye_kit:     Optional[bool]  = False
    incluye_arbitro: Optional[bool]  = False
    descuento:       Optional[float] = 0.0
    notas:           Optional[str]   = None


class ReservaUpdateSchema(BaseModel):
    fecha:       Optional[date] = None
    hora_inicio: Optional[time] = None
    hora_fin:    Optional[time] = None
    estado:      Optional[str]  = None
    notas:       Optional[str]  = None


class ReservaOutSchema(BaseModel):
    id:           int
    usuario_id:   int
    cancha_id:    int
    fecha:        date
    hora_inicio:  time
    hora_fin:     time
    precio_total: float
    estado:       str
    notas:        Optional[str]
    creado_en:    Optional[datetime]

    model_config = {"from_attributes": True}
