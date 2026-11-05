import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.api import api_router
from app.core.database import engine, Base, get_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create DB tables automatically on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Auto-migrate columns if missing on existing databases (Neon / Postgres / SQLite)
        if conn.dialect.name == "postgresql":
            await conn.execute(text("""
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name='interview_sessions' AND column_name='user_id'
                    ) THEN 
                        ALTER TABLE interview_sessions ADD COLUMN user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL;
                        CREATE INDEX IF NOT EXISTS ix_interview_sessions_user_id ON interview_sessions (user_id);
                    END IF; 
                END $$;
            """))
        elif conn.dialect.name == "sqlite":
            res = await conn.execute(text("PRAGMA table_info(interview_sessions);"))
            columns = [row[1] for row in res.fetchall()]
            if "user_id" not in columns:
                await conn.execute(text("ALTER TABLE interview_sessions ADD COLUMN user_id VARCHAR(36);"))
    yield
    await engine.dispose()


app = FastAPI(
    title="Interview Accelerator API",
    version="1.0.0",
    description="Adaptive AI-powered interview simulator and fit engine",
    lifespan=lifespan,
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    origin = request.headers.get("origin")
    headers = {}
    if origin:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
        headers["Access-Control-Allow-Headers"] = "*"
        headers["Access-Control-Allow-Methods"] = "*"
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"},
        headers=headers,
    )

# ─────────────────────────────────────────────────────────────────────────────
# CORS CONFIGURATION (Production & Local Development)
# Supports local Next.js dev server, Vercel preview/production domains,
# and custom FRONTEND_URL environment variable.
# ─────────────────────────────────────────────────────────────────────────────
cors_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

frontend_env_url = os.getenv("FRONTEND_URL")
if frontend_env_url:
    cors_origins.append(frontend_env_url.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|.*\.vercel\.app|.*\.onrender\.com)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include router with /api/v1 prefix and also at root / so both work seamlessly
app.include_router(api_router, prefix="/api/v1")
app.include_router(api_router)


# ─────────────────────────────────────────────────────────────────────────────
# IMPROVEMENT (IMP-001): Health check validates active database connectivity
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/health")
@app.get("/api/v1/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    db_status = "connected"
    try:
        await db.execute(text("SELECT 1"))
    except Exception as exc:
        db_status = f"unreachable: {str(exc)}"

    is_healthy = db_status == "connected"
    return {
        "status": "ok" if is_healthy else "degraded",
        "service": "Interview Accelerator",
        "database": db_status,
    }
