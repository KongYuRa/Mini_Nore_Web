"""
Composition 데이터 스키마 정의
"""
from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime
from beanie import Document


class PlacedSource(BaseModel):
    """캔버스에 배치된 소스"""
    id: str
    sourceId: str
    x: float = Field(..., ge=0, le=1000)  # 캔버스 좌표
    y: float = Field(..., ge=0, le=600)
    volume: float = Field(1.0, ge=0, le=1)
    muted: bool = False


class Scene(BaseModel):
    """씬 데이터 (16개 중 하나)"""
    id: int = Field(..., ge=0, le=15)
    placedSources: List[PlacedSource] = []


class CompositionData(BaseModel):
    """전체 composition 데이터"""
    pack: Literal["adventure", "combat", "shelter"]
    scenes: List[Scene] = Field(..., min_length=16, max_length=16)
    masterVolume: float = Field(1.0, ge=0, le=1)
    musicVolume: float = Field(1.0, ge=0, le=1)
    ambienceVolume: float = Field(1.0, ge=0, le=1)


class Composition(Document):
    """MongoDB에 저장되는 Composition 문서"""
    pack: str = Field(..., description="팩 종류: adventure, combat, shelter")
    scenes: List[Scene]

    # 메타데이터
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # 사용자 피드백
    rating: Optional[float] = Field(None, ge=0, le=5)  # 별점
    likes: int = Field(0, ge=0)
    plays: int = Field(0, ge=0)

    # 음악적 특성 (자동 추출)
    num_sources: int = Field(0, ge=0)
    num_music_sources: int = Field(0, ge=0)
    num_ambience_sources: int = Field(0, ge=0)
    avg_sources_per_scene: float = Field(0.0, ge=0)

    # 볼륨 설정
    masterVolume: float = Field(1.0, ge=0, le=1)
    musicVolume: float = Field(1.0, ge=0, le=1)
    ambienceVolume: float = Field(1.0, ge=0, le=1)

    # 생성 방식
    is_ai_generated: bool = Field(False)
    model_version: Optional[str] = None

    class Settings:
        name = "compositions"
        indexes = [
            "pack",
            "created_at",
            "rating",
            "likes",
            "is_ai_generated",
        ]

    def calculate_features(self):
        """composition의 특징을 자동으로 계산"""
        all_sources = []
        music_sources = []
        ambience_sources = []

        for scene in self.scenes:
            for source in scene.placedSources:
                all_sources.append(source.sourceId)
                # sourceId 형식: "adv-hero", "cmb-warrior" 등
                # music인지 ambience인지 판단 필요 (sources.ts 참고)

        self.num_sources = len(set(all_sources))  # 고유 소스 개수
        self.avg_sources_per_scene = len(all_sources) / 16 if len(all_sources) > 0 else 0


class CompositionCreate(BaseModel):
    """Composition 생성 요청"""
    pack: Literal["adventure", "combat", "shelter"]
    scenes: List[Scene]
    masterVolume: float = 1.0
    musicVolume: float = 1.0
    ambienceVolume: float = 1.0


class CompositionUpdate(BaseModel):
    """Composition 업데이트"""
    rating: Optional[float] = None
    likes: Optional[int] = None


class CompositionResponse(BaseModel):
    """Composition 응답"""
    id: str
    pack: str
    scenes: List[Scene]
    created_at: datetime
    rating: Optional[float]
    likes: int
    plays: int
    is_ai_generated: bool

    class Config:
        from_attributes = True
