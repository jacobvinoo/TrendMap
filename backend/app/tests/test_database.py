import os
import importlib
import pytest
from sqlalchemy import create_engine
from unittest.mock import patch

def test_database_url_from_env():
    # Save current DB URL if any
    original_db_url = os.environ.get("DATABASE_URL")
    
    test_url = "postgresql://user:pass@localhost/db"
    with patch.dict(os.environ, {"DATABASE_URL": test_url, "TESTING": "0"}):
        with patch("sqlalchemy.create_engine") as mock_engine:
            import app.db.database
            importlib.reload(app.db.database)
            
            # verify create_engine was called with the correct args
            mock_engine.assert_called_with(test_url, connect_args={})
            
    # Restore the module to normal state for other tests with original env
    if original_db_url is not None:
        os.environ["DATABASE_URL"] = original_db_url
    elif "DATABASE_URL" in os.environ:
        del os.environ["DATABASE_URL"]
    os.environ["TESTING"] = "1"
    importlib.reload(app.db.database)

def test_database_url_fallback_sqlite():
    # Save current DB URL if any
    original_db_url = os.environ.get("DATABASE_URL")
    
    # We want to test without DATABASE_URL
    env_copy = dict(os.environ)
    if "DATABASE_URL" in env_copy:
        del env_copy["DATABASE_URL"]
    env_copy["TESTING"] = "0"
        
    with patch.dict(os.environ, env_copy, clear=True):
        with patch("sqlalchemy.create_engine") as mock_engine:
            import app.db.database
            importlib.reload(app.db.database)
            
            mock_engine.assert_called_with("sqlite:///./trendmap.db", connect_args={"check_same_thread": False})
            
    # Restore the module to normal state for other tests with original env
    if original_db_url is not None:
        os.environ["DATABASE_URL"] = original_db_url
    elif "DATABASE_URL" in os.environ:
        del os.environ["DATABASE_URL"]
    os.environ["TESTING"] = "1"
    importlib.reload(app.db.database)
