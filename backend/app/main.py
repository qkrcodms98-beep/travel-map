from fastapi import FastAPI

from app.routers import trips

app = FastAPI(title="나만의 여행 지도 API")

# 여행 API (주소는 routers/trips.py에서 만든다)
app.include_router(trips.router)


# 서버가 켜져 있는지 확인하는 주소
@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
