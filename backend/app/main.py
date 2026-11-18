from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.api.v1.websocket import router as ws_router
from app.core.config import settings
from app.db.session import create_all_tables


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables
    await create_all_tables()
    yield
    # Shutdown: clean up if needed


app = FastAPI(
    title=settings.APP_NAME,
    version="2.0.0",
    description="AgroSmart 2.0 Smart Agriculture & Automated Irrigation API",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)
# Also include websocket router at root level (/ws/{device_id})
app.include_router(ws_router)


@app.get("/health", tags=["system"])
async def health():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": "2.0.0",
        "database": "sqlite+aiosqlite",
    }


@app.get("/", tags=["system"])
async def root():
    return {
        "message": "AgroSmart 2.0 Backend Service Running",
        "docs_url": "/docs",
        "health_url": "/health",
        "api_v1": settings.API_V1_STR,
    }
