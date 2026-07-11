import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

def test_database_connection():
    # Attempt to connect to an in-memory SQLite database for test validation
    # Real test will use the actual app test DB
    from app.db.database import engine
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        assert result.fetchone()[0] == 1

def test_session_creation():
    from app.db.database import SessionLocal
    db = SessionLocal()
    try:
        assert db is not None
    finally:
        db.close()
