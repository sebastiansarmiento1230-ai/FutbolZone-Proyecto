from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

# Ruta absoluta al archivo SQLite en backend/futbolzone.db
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_PATH = os.path.join(BASE_DIR, "futbolzone.db")
SQLITE_URL = f"sqlite:///{DB_PATH}"

print(f"[DB] Conectado directamente a SQLite nativo: {DB_PATH}")

engine = create_engine(
    SQLITE_URL,
    connect_args={"check_same_thread": False},
    echo=False
)

# Habilitar soporte de claves foráneas (Foreign Keys) en SQLite
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
