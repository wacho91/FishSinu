# backend/src/database.py
"""
FishSinu - Configuración de base de datos asíncrona.

Capa: Infrastructure

Usa SQLAlchemy 2.x en modo asíncrono con asyncpg para PostgreSQL/Supabase.
El backend se conecta con un rol que tiene bypass RLS (service_role/postgres).
"""

import os

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

try:  # Carga opcional de variables de entorno desde .env
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass


DATABASE_URL = os.getenv(
    "FISHSINU_DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/fishsinu",
)

engine = create_async_engine(
    DATABASE_URL,
    echo=os.getenv("FISHSINU_SQL_ECHO", "false").lower() == "true",
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Base declarativa compartida por todos los modelos ORM."""
    pass


async def get_db() -> AsyncSession:
    """
    Dependencia de FastAPI que provee una sesión asíncrona.

    Uso:
        async def endpoint(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
