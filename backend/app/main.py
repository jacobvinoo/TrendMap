from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

from app.api.api_core import router as api_core_router
from app.api.endpoints_phase2_4 import router as phase2_4_router
from app.api.search import router as search_router
from app.api.phase5 import router as phase5_router
from app.api.api_agents import router as api_agents_router

app = FastAPI(title="TrendMap Enterprise API", version="1.0.0")

app.include_router(api_core_router, prefix="/api")
app.include_router(phase2_4_router, prefix="/api")
app.include_router(search_router, prefix="/api")
app.include_router(phase5_router, prefix="/api")
app.include_router(api_agents_router, prefix="/api")

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/version")
def api_version():
    return {"version": app.version}
