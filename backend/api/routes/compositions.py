"""
Composition 관련 API 라우트
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from loguru import logger

from api.schemas.composition import (
    Composition,
    CompositionCreate,
    CompositionUpdate,
    CompositionResponse
)

router = APIRouter()


@router.post("/", response_model=CompositionResponse, status_code=201)
async def create_composition(composition_data: CompositionCreate):
    """
    새로운 composition 생성 (사용자가 만든 곡 저장)
    """
    try:
        # Composition 문서 생성
        composition = Composition(
            pack=composition_data.pack,
            scenes=composition_data.scenes,
            masterVolume=composition_data.masterVolume,
            musicVolume=composition_data.musicVolume,
            ambienceVolume=composition_data.ambienceVolume,
            is_ai_generated=False
        )

        # 특징 자동 계산
        composition.calculate_features()

        # 저장
        await composition.insert()

        logger.info(f"Created composition {composition.id} for pack {composition.pack}")

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
        logger.error(f"Failed to create composition: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[CompositionResponse])
async def get_compositions(
    pack: Optional[str] = Query(None, description="팩 필터링: adventure, combat, shelter"),
    is_ai_generated: Optional[bool] = Query(None, description="AI 생성 여부"),
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0)
):
    """
    Composition 목록 조회
    """
    try:
        # 필터 구성
        filters = {}
        if pack:
            filters["pack"] = pack
        if is_ai_generated is not None:
            filters["is_ai_generated"] = is_ai_generated

        # 조회 (최신순)
        compositions = await Composition.find(filters).sort("-created_at").skip(skip).limit(limit).to_list()

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
        logger.error(f"Failed to get compositions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{composition_id}", response_model=CompositionResponse)
async def get_composition(composition_id: str):
    """
    특정 composition 조회
    """
    try:
        composition = await Composition.get(composition_id)
        if not composition:
            raise HTTPException(status_code=404, detail="Composition not found")

        # 재생 수 증가
        composition.plays += 1
        await composition.save()

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

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get composition {composition_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{composition_id}", response_model=CompositionResponse)
async def update_composition(composition_id: str, update_data: CompositionUpdate):
    """
    Composition 업데이트 (별점, 좋아요 등)
    """
    try:
        composition = await Composition.get(composition_id)
        if not composition:
            raise HTTPException(status_code=404, detail="Composition not found")

        # 업데이트
        if update_data.rating is not None:
            composition.rating = update_data.rating
        if update_data.likes is not None:
            composition.likes = update_data.likes

        await composition.save()

        logger.info(f"Updated composition {composition_id}")

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

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update composition {composition_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{composition_id}", status_code=204)
async def delete_composition(composition_id: str):
    """
    Composition 삭제
    """
    try:
        composition = await Composition.get(composition_id)
        if not composition:
            raise HTTPException(status_code=404, detail="Composition not found")

        await composition.delete()
        logger.info(f"Deleted composition {composition_id}")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete composition {composition_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/summary")
async def get_stats():
    """
    전체 통계 조회
    """
    try:
        total_count = await Composition.count()
        ai_count = await Composition.find({"is_ai_generated": True}).count()
        user_count = total_count - ai_count

        pack_counts = {}
        for pack in ["adventure", "combat", "shelter"]:
            pack_counts[pack] = await Composition.find({"pack": pack}).count()

        return {
            "total_compositions": total_count,
            "ai_generated": ai_count,
            "user_created": user_count,
            "by_pack": pack_counts
        }

    except Exception as e:
        logger.error(f"Failed to get stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
