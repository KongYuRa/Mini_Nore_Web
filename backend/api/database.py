"""
MongoDB 데이터베이스 연결 및 초기화
"""
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from api.schemas.composition import Composition
from loguru import logger
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB 클라이언트
mongodb_client: AsyncIOMotorClient = None


async def connect_to_mongo():
    """MongoDB 연결"""
    global mongodb_client

    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    database_name = os.getenv("DATABASE_NAME", "mini_nore_ml")

    logger.info(f"Connecting to MongoDB at {mongodb_url}")

    try:
        mongodb_client = AsyncIOMotorClient(mongodb_url)
        database = mongodb_client[database_name]

        # Beanie 초기화 (ODM)
        await init_beanie(
            database=database,
            document_models=[Composition]
        )

        logger.info("Successfully connected to MongoDB")

        # 연결 테스트
        await mongodb_client.admin.command('ping')
        logger.info("MongoDB ping successful")

    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise


async def close_mongo_connection():
    """MongoDB 연결 종료"""
    global mongodb_client
    if mongodb_client:
        mongodb_client.close()
        logger.info("MongoDB connection closed")


def get_database():
    """데이터베이스 인스턴스 가져오기"""
    return mongodb_client[os.getenv("DATABASE_NAME", "mini_nore_ml")]
