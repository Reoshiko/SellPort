from fastapi import FastAPI
from src.presentation.routers import router

app = FastAPI(title="SellPort API", version="0.1.0", root_path="/api")
app.include_router(router)


@app.get("/status")
async def status():
    return {"status": "ok"}
