import os
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import declarative_base

# === LINK DE SUPABASE PEGADO DIRECTO ===
# ¡OJO! Cambia TU_CONTRASEÑA_REAL por la contraseña de tu proyecto FishSinu
DATABASE_URL = "postgresql+asyncpg://postgres.xsfdufxevnddztvkqwxc:WInwX49kLPCrYS1y@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"
# =======================================

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