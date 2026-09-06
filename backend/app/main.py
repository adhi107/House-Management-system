from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from app.config.settings import settings
from app.database.connection import connect_db, close_db
from app.api.routes import auth, dashboard, properties, units, tenants, rent, maintenance, super_admin, smtp
from app.api.routes.misc import (
    router as document_router,
    expense_router,
    notification_router,
    agreement_router,
    announcement_router,
    tenant_dashboard_router,
)
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    logger.info(f"PropertyHub API started — {settings.APP_ENV}")
    yield
    await close_db()
    logger.info("PropertyHub API stopped")


app = FastAPI(
    title="PropertyHub Multi-Tenant API",
    version=settings.APP_VERSION,
    description="Multi-Building Rental & Tenant Management Multi-Tenant SaaS API",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploads
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Routes
API_PREFIX = "/api/v1"
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(super_admin.router, prefix=API_PREFIX)
app.include_router(dashboard.router, prefix=API_PREFIX)
app.include_router(properties.router, prefix=API_PREFIX)
app.include_router(units.router, prefix=API_PREFIX)
app.include_router(tenants.router, prefix=API_PREFIX)
app.include_router(rent.router, prefix=API_PREFIX)
app.include_router(maintenance.router, prefix=API_PREFIX)
app.include_router(smtp.router, prefix=API_PREFIX)
app.include_router(document_router, prefix=API_PREFIX)
app.include_router(expense_router, prefix=API_PREFIX)
app.include_router(notification_router, prefix=API_PREFIX)
app.include_router(agreement_router, prefix=API_PREFIX)
app.include_router(announcement_router, prefix=API_PREFIX)
app.include_router(tenant_dashboard_router, prefix=API_PREFIX)


@app.get("/api/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}
