import os
import pytest

# MUST set before importing any app modules so database.py picks it up!
os.environ["TESTING"] = "1"

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base_class import Base
from app.db.database import engine, SessionLocal
from app.main import app as fastapi_app
import app.models.core

@pytest.fixture(scope="module", autouse=True)
def setup_test_database():
    """Create all tables in the in-memory database once per test module."""
    
    from app.api.api_core import get_db as core_get_db
    from app.api.endpoints_phase2_4 import get_db as phase2_get_db
    from app.api.search import get_db as search_get_db
    from app.api.phase5 import get_db as phase5_get_db
    from app.api.api_agents import get_db as agents_get_db
    
    def override_get_db():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()
            
    fastapi_app.dependency_overrides[core_get_db] = override_get_db
    fastapi_app.dependency_overrides[phase2_get_db] = override_get_db
    fastapi_app.dependency_overrides[search_get_db] = override_get_db
    fastapi_app.dependency_overrides[phase5_get_db] = override_get_db
    fastapi_app.dependency_overrides[agents_get_db] = override_get_db
    
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    
@pytest.fixture
def db_session():
    """Provide a database session to the test functions if they need it directly."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
