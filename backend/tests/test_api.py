from src.main import app
from httpx import ASGITransport, AsyncClient
import asyncio


def test_status_endpoint():
    async def request():
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            return await client.get("/status")

    response = asyncio.run(request())
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_main_api_routes_are_registered():
    paths = app.openapi()["paths"]
    assert "/auth/register" in paths
    assert "/auth/login" in paths
    assert "/auth/refresh" in paths
    assert "/users/me" in paths
    assert "/categories" in paths
    assert "/products" in paths
    assert "/products/{product_id}/image" in paths
    assert "/orders" in paths


def test_catalog_write_requires_authentication():
    async def request():
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            return await client.post("/categories", json={"name": "Books"})

    response = asyncio.run(request())
    assert response.status_code == 401
