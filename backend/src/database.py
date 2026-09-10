import os
from dotenv import load_dotenv

# === MAGIA PARA ENCONTRAR EL .ENV ===
# Le decimos que suba una carpeta (desde src hacia backend) y busque el .env
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dotenv_path = os.path.join(base_dir, '.env')
load_dotenv(dotenv_path=dotenv_path)
# ====================================

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

# Creamos el motor asíncrono
engine = create_async_engine(
    DATABASE_URL,
    echo=False, # Esto apaga los warnings de SQL en la consola
    pool_pre_ping=True,
    connect_args={"statement_cache_size": 0} # Magia para PgBouncer de Supabase
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