from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.deps import get_cors_origins
from app.errors import ApiError, error_response
from app.routers import trips


# 서버가 켜져 있는지 확인하는 주소
def health() -> dict[str, str]:
    return {"status": "ok"}


def create_app() -> FastAPI:
    app = FastAPI(title="나만의 여행 지도 API")

    # 정해 둔 화면 주소만 이 API를 부를 수 있다 (TRD 7장)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=get_cors_origins(),
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["Content-Type"],
    )

    # 에러는 모두 API_SPEC 2장 모양으로 바꾼다 (TRD 8장)
    @app.exception_handler(ApiError)
    async def handle_api_error(_request: Request, error: ApiError) -> JSONResponse:
        return error_response(error.code)

    # FastAPI 기본 422 대신 400 INVALID_REQUEST
    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(_request: Request, _error: RequestValidationError) -> JSONResponse:
        return error_response("INVALID_REQUEST")

    # 예상하지 못한 에러. 내부 내용은 응답에 넣지 않는다
    @app.exception_handler(Exception)
    async def handle_unexpected_error(_request: Request, _error: Exception) -> JSONResponse:
        return error_response("INTERNAL_ERROR")

    app.get("/health")(health)
    # 여행 API (주소는 routers/trips.py에서 만든다)
    app.include_router(trips.router)
    return app


app = create_app()
