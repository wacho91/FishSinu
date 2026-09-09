import os
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import declarative_base

# Lee la URL desde el archivo .env
DATABASE_URL = os.getenv("DATABASE_URL")

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