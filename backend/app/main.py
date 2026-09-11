from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import (
    ai,
    analytics,
    auth,
    benchmarks,
    drivers,
    events,
    notifications,
    optimisation,
    orders,
    routes,
    simulation,
    vehicles,
)
from app.api.websocket import router as ws_router
from app.config import settings
from app.core.exceptions import MargDarshakException
from app.core.logging import logger, setup_logging
from app.db.base import Base
from app.db.session import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    logger.info("Initializing MargDarshak Backend...")
    # Create database schema tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database schema validated and tables ready.")
    yield
    logger.info("Shutting down MargDarshak Backend...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "### MargDarshak: Intelligent Dynamic Fleet Optimisation\n"
        "“*When reality changes, the route changes with it.*”\n\n"
        "Enterprise-grade fleet-level decision and route optimisation backend powered by Google OR-Tools, "
        "FastAPI, dynamic re-optimisation, fact-grounded AI explanations, and real-time WebSockets."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception Handlers
@app.exception_handler(MargDarshakException)
async def custom_exception_handler(request: Request, exc: MargDarshakException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details
            }
        }
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": str(exc),
                "details": {}
            }
        }
    )


# Include API V1 Routers
api_v1_prefix = settings.API_V1_STR
app.include_router(auth.router, prefix=api_v1_prefix)
app.include_router(orders.router, prefix=api_v1_prefix)
app.include_router(vehicles.router, prefix=api_v1_prefix)
app.include_router(drivers.router, prefix=api_v1_prefix)
app.include_router(routes.router, prefix=api_v1_prefix)
app.include_router(optimisation.router, prefix=api_v1_prefix)
app.include_router(events.router, prefix=api_v1_prefix)
app.include_router(analytics.router, prefix=api_v1_prefix)
app.include_router(simulation.router, prefix=api_v1_prefix)
app.include_router(notifications.router, prefix=api_v1_prefix)
app.include_router(ai.router, prefix=api_v1_prefix)
app.include_router(benchmarks.router, prefix=api_v1_prefix)

# Include WebSocket
app.include_router(ws_router)


@app.get("/", tags=["Health"])
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "status": "OPERATIONAL",
        "docs": "/docs",
        "version": "1.0.0"
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
