from fastapi import FastAPI

app = FastAPI(title="SellPort API", version="0.1.0", root_path="/api")


@app.get("/status")
async def status():
    return {"status": "ok"}
