from fastapi import FastAPI
from src.database.init_db import init_db
from src.api.routes import health, runs

app = FastAPI(title="VisionGuard Events API", version="1.0.0")

@app.on_event("startup")
def on_startup() -> None:
    init_db()

app.include_router(health.router)
app.include_router(runs.router)
