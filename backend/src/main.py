# backend/src/main.py
"""
FishSinu - Entrypoint de la API REST.

Capa: Application / Infrastructure
Configura la aplicación FastAPI, middlewares CORS, ciclo de vida
(startup/shutdown) y enrutadores.
"""

import logging
import os
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from .database import Base, engine

# Importar modelos para que queden registrados en Base.metadata
from models import (  # noqa: F401
    CompanySetting,
    CreditAccount,
    Customer,
    InventoryMovement,
    Invoice,
    Payment,
    Product,
    ProductCategory,
    Profile,
    Sale,
    SaleItem,
)
from routes import router

logger = logging.getLogger("uvicorn.error")


def _load_cors_origins() -> list[str]:
    """Lee los orígenes permitidos desde una variable separada por comas."""
    raw = os.getenv(
        "FISHSINU_CORS_ORIGINS",
        "http://localhost:5173",
    )
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """
    Ciclo de vida de la aplicación.

    - Startup: crea tablas si FISHSINU_AUTO_CREATE_TABLES=true y
      verifica la conexión a la base de datos sin bloquear el arranque
      si la BD no está disponible temporalmente.
    - Shutdown: libera el pool de conexiones asíncronas.
    """
    # Startup
    if os.getenv("FISHSINU_AUTO_CREATE_TABLES", "false").lower() == "true":
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("FishSinu API conectado correctamente a la base de datos.")
    except Exception:
        logger.warning(
            "No se pudo verificar la base de datos en el arranque. "
            "Los endpoints que la usen fallarán hasta que esté disponible.",
            exc_info=True,
        )

    yield

    # Shutdown
    await engine.dispose()


app = FastAPI(
    title="FishSinu API",
    description="API REST para el sistema de pescadería FishSinu.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_load_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/", tags=["health"])
async def root() -> dict[str, str]:
    """Información básica de la API."""
    return {"message": "FishSinu API", "docs": "/docs"}


@app.get("/health", tags=["health"])
async def health_check() -> dict[str, str]:
    """Health check para sondas de despliegue y monitoreo."""
    return {"status": "ok"}
