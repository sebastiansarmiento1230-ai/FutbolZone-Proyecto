from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.config.database import Base


class TipoCancha(str, enum.Enum):
    futbol_5  = "Fútbol 5"
    futbol_7  = "Fútbol 7"
    futbol_11 = "Fútbol 11"


class CanchaModel(Base):
    __tablename__ = "canchas"

    id                  = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre              = Column(String(100), nullable=False)
    tipo                = Column(Enum(TipoCancha), default=TipoCancha.futbol_5)
    descripcion         = Column(Text)
    capacidad_jugadores = Column(Integer, default=10)
    precio_hora         = Column(Float, nullable=False)
    tiene_iluminacion   = Column(Boolean, default=False)
    tiene_techo         = Column(Boolean, default=False)
    direccion           = Column(String(200), default="Sede Central — Calle 63 # 28-45")
    activa              = Column(Boolean, default=True)
    creado_en           = Column(DateTime, server_default=func.now())

    # Relaciones
    reservas = relationship("ReservaModel", back_populates="cancha")
    torneos  = relationship("TorneoModel",  back_populates="cancha")
    horarios = relationship("HorarioModel", back_populates="cancha")
    resenas  = relationship("ResenaModel",  back_populates="cancha")
