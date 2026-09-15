import os
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import declarative_base

# === LECTURA SEGURA: Cero contraseñas en el código ===
DATABASE_URL = os.getenv("DATABASE_URL")

# Si no encuentra el .env, el programa se detiene y avisa, pero no expone nada.
if not DATABASE_URL:
    raise ValueError("FATAL: La variable de entorno DATABASE_URL no está configurada en el archivo .env")

# Creamos el motor
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    connect_args={"statement_cache_size": 0}
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as db:
        yield db