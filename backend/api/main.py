"""
FastAPI 메인 애플리케이션
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from loguru import logger
import os
from dotenv import load_dotenv

from api.database import connect_to_mongo, close_mongo_connection
from api.routes import compositions, recommendations

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """애플리케이션 라이프사이클 관리"""
    # Startup
    logger.info("Starting Mini Nore ML API")
    await connect_to_mongo()
    yield
    # Shutdown
    logger.info("Shutting down Mini Nore ML API")
    await close_mongo_connection()


# FastAPI 앱 생성
app = FastAPI(
    title="Mini Nore ML API",
    description="음악 composition 수집 및 ML 기반 추천 시스템",
    version="1.0.0",
    lifespan=lifespan
)

# CORS 설정
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(compositions.router, prefix="/api/compositions", tags=["compositions"])
app.include_router(recommendations.router, prefix="/api/recommendations", tags=["recommendations"])


@app.get("/")
async def root():
    """API 루트"""
    return {
        "message": "Mini Nore ML API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """헬스 체크"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", 8000))

    uvicorn.run(
        "api.main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )
