from collections.abc import AsyncGenerator
from redis.asyncio import Redis, from_url
from src.core.settings import settings

redis_client: Redis = from_url(settings.redis_url, decode_responses=True)


async def get_redis() -> AsyncGenerator[Redis, None]:
    yield redis_client
