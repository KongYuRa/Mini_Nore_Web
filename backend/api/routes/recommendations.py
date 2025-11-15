"""
AI 추천 관련 API 라우트
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Literal
from loguru import logger

from api.schemas.composition import CompositionResponse, Composition
from api.services.ml_service import MLService

router = APIRouter()
ml_service = MLService()


@router.post("/generate", response_model=CompositionResponse)
async def generate_recommendation(
    pack: Literal["adventure", "combat", "shelter"] = Query(..., description="팩 선택"),
    temperature: float = Query(1.0, ge=0.1, le=2.0, description="생성 다양성 (낮을수록 보수적)")
):
    """
    ML 모델을 사용해 새로운 composition 생성

    - **pack**: 어떤 팩의 음악을 생성할지
    - **temperature**: 생성 다양성 조절 (0.1~2.0)
      - 낮음 (0.5): 학습된 패턴에 가까운 안전한 생성
      - 중간 (1.0): 균형잡힌 생성
      - 높음 (1.5+): 실험적이고 창의적인 생성
    """
    try:
        logger.info(f"Generating composition for pack: {pack}, temperature: {temperature}")

        # ML 모델로 composition 생성
        generated_composition = await ml_service.generate_composition(
            pack=pack,
            temperature=temperature
        )

        # DB에 저장
        composition = Composition(
            pack=generated_composition["pack"],
            scenes=generated_composition["scenes"],
            masterVolume=generated_composition.get("masterVolume", 1.0),
            musicVolume=generated_composition.get("musicVolume", 1.0),
            ambienceVolume=generated_composition.get("ambienceVolume", 1.0),
            is_ai_generated=True,
            model_version=generated_composition.get("model_version", "v1.0")
        )

        composition.calculate_features()
        await composition.insert()

        logger.info(f"Generated and saved composition {composition.id}")

        return CompositionResponse(
            id=str(composition.id),
            pack=composition.pack,
            scenes=composition.scenes,
            created_at=composition.created_at,
            rating=composition.rating,
            likes=composition.likes,
            plays=composition.plays,
            is_ai_generated=composition.is_ai_generated
        )

    except Exception as e:
        logger.error(f"Failed to generate composition: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/examples/{pack}", response_model=List[CompositionResponse])
async def get_example_recommendations(
    pack: Literal["adventure", "combat", "shelter"],
    count: int = Query(3, ge=1, le=10, description="가져올 예시 개수")
):
    """
    특정 팩의 AI 생성 예시 composition들 가져오기
    (높은 평점/인기도 기준 정렬)
    """
    try:
        # AI 생성 composition 중 해당 팩의 것만 가져오기
        # 평점과 좋아요 수로 정렬
        compositions = await Composition.find({
            "pack": pack,
            "is_ai_generated": True
        }).sort([
            ("rating", -1),
            ("likes", -1),
            ("plays", -1)
        ]).limit(count).to_list()

        # 충분한 데이터가 없으면 새로 생성
        if len(compositions) < count:
            logger.info(f"Not enough examples for {pack}, generating {count - len(compositions)} more")
            for _ in range(count - len(compositions)):
                try:
                    new_comp_data = await ml_service.generate_composition(pack=pack)
                    new_comp = Composition(
                        pack=new_comp_data["pack"],
                        scenes=new_comp_data["scenes"],
                        is_ai_generated=True,
                        model_version=new_comp_data.get("model_version", "v1.0")
                    )
                    new_comp.calculate_features()
                    await new_comp.insert()
                    compositions.append(new_comp)
                except Exception as e:
                    logger.error(f"Failed to generate additional composition: {e}")

        return [
            CompositionResponse(
                id=str(comp.id),
                pack=comp.pack,
                scenes=comp.scenes,
                created_at=comp.created_at,
                rating=comp.rating,
                likes=comp.likes,
                plays=comp.plays,
                is_ai_generated=comp.is_ai_generated
            )
            for comp in compositions
        ]

    except Exception as e:
        logger.error(f"Failed to get example recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/model/status")
async def get_model_status():
    """
    ML 모델 상태 확인
    """
    try:
        status = await ml_service.get_model_status()
        return status

    except Exception as e:
        logger.error(f"Failed to get model status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/model/train")
async def trigger_training(
    pack: Optional[Literal["adventure", "combat", "shelter"]] = Query(None, description="특정 팩만 학습 (None이면 전체)")
):
    """
    모델 재학습 트리거
    (백그라운드에서 실행)
    """
    try:
        # 백그라운드 태스크로 학습 시작
        task_id = await ml_service.trigger_training(pack=pack)

        return {
            "message": "Training started",
            "task_id": task_id,
            "pack": pack or "all"
        }

    except Exception as e:
        logger.error(f"Failed to trigger training: {e}")
        raise HTTPException(status_code=500, detail=str(e))
