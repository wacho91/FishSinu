# backend/src/main.py
import logging
import os
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from .database import Base, engine

# Importar modelos para que queden registrados en Base.metadata
from .models import (  # noqa: F401
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
from .routes import router

logger = logging.getLogger("uvicorn.error")

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # Startup: Verificamos la conexión a la base de datos
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("✅ FishSinu API conectado correctamente a la base de datos.")
    except Exception as e:
        logger.warning(f"⚠️ No se pudo verificar la base de datos en el arranque: {e}")

    yield

    # Shutdown: liberar el pool de conexiones asíncronas.
    await engine.dispose()

app = FastAPI(
    title="FishSinu API",
    description="API REST para el sistema de pescadería FishSinu.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite a cualquier dominio (incluido tu localhost) conectarse
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/", tags=["health"])
async def root() -> dict[str, str]:
    return {"message": "FishSinu API", "docs": "/docs"}

@app.get("/health", tags=["health"])
async def health_check() -> dict[str, str]:
    return {"status": "ok"}