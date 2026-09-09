import os
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import declarative_base

# Lee la URL desde el archivo .env
DATABASE_URL = os.getenv("DATABASE_URL")

# Línea de debug para ver qué URL está usando
print(f"DEBUG DATABASE: Conectando a -> {DATABASE_URL}")

async_engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    connect_args={"statement_cache_size": 0} # Magia para PgBouncer de Supabase
)

AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as db:
        yield db