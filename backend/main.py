import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services.data_loader import data_store
from services.vector_store import vector_store

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: load data, build index, pre-compute analytics."""
    logger.info("Starting VF Intelligence Platform...")

    # Step 1: Load and process facility data
    logger.info("Loading Ghana facility dataset...")
    data_store.load()
    logger.info(f"Loaded {len(data_store.facilities)} unique facilities across "
                f"{len(data_store.region_stats)} regions")

    # Step 2: Build vector store
    logger.info("Building FAISS vector index...")
    vector_store.build_index(data_store.facilities)
    logger.info(f"Vector index built with {len(data_store.facilities)} entries")

    # Step 3: Log summary stats
    if data_store.data_quality:
        dq = data_store.data_quality
        logger.info(f"Data quality: {dq.avg_completeness}% avg completeness, "
                    f"{dq.duplicates_found} duplicates resolved")

    desert_regions = [r for r, s in data_store.region_stats.items() if s.is_medical_desert]
    logger.info(f"Medical deserts identified: {len(desert_regions)} regions: {desert_regions}")

    anomaly_count = sum(len(f.anomalies) for f in data_store.facilities)
    logger.info(f"Anomalies detected: {anomaly_count} across "
                f"{sum(1 for f in data_store.facilities if f.anomalies)} facilities")

    logger.info("VF Intelligence Platform ready!")
    yield
    logger.info("Shutting down VF Intelligence Platform")


app = FastAPI(
    title="VF Intelligence Platform",
    description="AI-powered healthcare logistics for the Virtue Foundation — Ghana",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS for frontend — allow Vercel deployments and local dev
cors_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]
# Add any custom frontend URL from env
frontend_url = os.environ.get("FRONTEND_URL", "")
if frontend_url:
    cors_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include routers
from routers.facilities import router as facilities_router
from routers.chat import router as chat_router
from routers.analysis import router as analysis_router
from routers.idp import router as idp_router
from routers.voice import router as voice_router
from routers.plans import router as plans_router
from routers.geospatial import router as geospatial_router

app.include_router(facilities_router, prefix="/api/facilities", tags=["Facilities"])
app.include_router(chat_router, prefix="/api/chat", tags=["Chat"])
app.include_router(analysis_router, prefix="/api/analysis", tags=["Analysis"])
app.include_router(idp_router, prefix="/api/idp", tags=["IDP"])
app.include_router(voice_router, prefix="/api/voice", tags=["Voice"])
app.include_router(plans_router, prefix="/api", tags=["Plans"])
app.include_router(geospatial_router, prefix="/api", tags=["Geospatial"])


@app.get("/")
def root():
    return {
        "name": "VF Intelligence Platform",
        "version": "1.0.0",
        "status": "operational",
        "facilities_loaded": len(data_store.facilities),
        "regions": len(data_store.region_stats),
    }


@app.get("/health")
def health():
    return {"status": "ok", "facilities": len(data_store.facilities)}
