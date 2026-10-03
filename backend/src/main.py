from fastapi import FastAPI
from src.presentation.routers import router
from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator
from redis.exceptions import RedisError
from src.core.database import engine
from src.core.redis import redis_client
from src.core.storage import ensure_bucket_exists
import asyncio


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    try:
        try:
            await redis_client.ping()
        except RedisError as exc:
            raise RuntimeError("Redis is unavailable") from exc
        try:
            await asyncio.to_thread(ensure_bucket_exists)
        except Exception as exc:
            raise RuntimeError(
                "S3 is unavailable or the bucket cannot be created"
            ) from exc
        yield
    finally:
        await redis_client.aclose()
        await engine.dispose()


app = FastAPI(
    title="SellPort API", version="0.1.0", root_path="/api", lifespan=lifespan
)
app.include_router(router)


@app.get("/status")
async def status():
    return {"status": "ok"}
