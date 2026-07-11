from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import os

# Read from env, fallback to sqlite for local dev and testing
if os.getenv("TESTING") == "1":
    SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
else:
    SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./trendmap.db")

connect_args = {}
poolclass = None

if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False
    if ":memory:" in SQLALCHEMY_DATABASE_URL:
        poolclass = StaticPool

if poolclass:
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args, poolclass=poolclass)
else:
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
