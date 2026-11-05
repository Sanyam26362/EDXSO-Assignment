import os
import re
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

# BUG FIX: Ensure environment variables are loaded regardless of import order
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./interview_accelerator.db")

# ─────────────────────────────────────────────────────────────────────────────
# Normalize dialect prefix
# ─────────────────────────────────────────────────────────────────────────────
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+asyncpg://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# ─────────────────────────────────────────────────────────────────────────────
# BUG FIX: Strip ?sslmode=... and &channel_binding=... from the URL — asyncpg does NOT
# accept these as query parameters; they must be passed via connect_args.
# Without this fix the engine raises:
#   connect() got an unexpected keyword argument 'sslmode'
# ─────────────────────────────────────────────────────────────────────────────
connect_args: dict = {}

if "sqlite" in DATABASE_URL:
    connect_args["check_same_thread"] = False
elif "asyncpg" in DATABASE_URL:
    if "sslmode=require" in DATABASE_URL or "ssl" in DATABASE_URL.lower():
        connect_args["ssl"] = "require"
    # Always disable prepared-statement caching for PgBouncer / Neon poolers
    connect_args["statement_cache_size"] = 0

    # Strip all query parameters from the URL so asyncpg never sees them
    DATABASE_URL = re.sub(r"\?.*$", "", DATABASE_URL)

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,         # detects stale connections before use
    pool_recycle=300,           # recycle connections every 5 min (Neon idle timeout)
    connect_args=connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
