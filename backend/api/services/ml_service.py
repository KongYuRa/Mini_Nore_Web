"""
ML 모델 서비스 (생성 및 학습 관리)
"""
import os
import uuid
from typing import Dict, List, Optional, Literal
from loguru import logger
import torch
import numpy as np

from models.transformer.composition_generator import CompositionGenerator
from training.preprocessing.data_processor import DataProcessor


class MLService:
    """ML 모델 서비스 클래스"""

    def __init__(self):
        self.models = {}  # pack별 모델 저장
        self.model_path = os.getenv("MODEL_PATH", "./models/checkpoints")
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        logger.info(f"MLService initialized on device: {self.device}")

        # 모델 로드 시도
        self._load_models()

    def _load_models(self):
        """저장된 모델 로드"""
        for pack in ["adventure", "combat", "shelter"]:
            model_file = os.path.join(self.model_path, f"{pack}_model.pth")

            if os.path.exists(model_file):
                try:
                    self.models[pack] = CompositionGenerator.load(model_file, self.device)
                    logger.info(f"Loaded model for pack: {pack}")
                except Exception as e:
                    logger.error(f"Failed to load model for {pack}: {e}")
                    self.models[pack] = None
            else:
                logger.warning(f"No saved model found for {pack}")
                self.models[pack] = None

    async def generate_composition(
        self,
        pack: Literal["adventure", "combat", "shelter"],
        temperature: float = 1.0
    ) -> Dict:
        """
        새로운 composition 생성

        Args:
            pack: 팩 종류
            temperature: 생성 다양성 (0.1~2.0)

        Returns:
            생성된 composition 데이터
        """
        try:
            model = self.models.get(pack)

            # 모델이 없으면 룰 기반 생성 (fallback)
            if model is None:
                logger.warning(f"No model for {pack}, using rule-based generation")
                return self._rule_based_generation(pack)

            # ML 모델로 생성
            with torch.no_grad():
                composition_data = model.generate(temperature=temperature)

            # 포맷 변환
            formatted_composition = self._format_composition(composition_data, pack)
            formatted_composition["model_version"] = model.version

            return formatted_composition

        except Exception as e:
            logger.error(f"Generation failed: {e}, falling back to rule-based")
            return self._rule_based_generation(pack)

    def _rule_based_generation(self, pack: str) -> Dict:
        """
        룰 기반 composition 생성 (ML 모델이 없을 때 fallback)
        음악 이론에 기반한 간단한 패턴 생성
        """
        logger.info(f"Generating rule-based composition for {pack}")

        # 팩별 추천 소스 (수작업으로 큐레이션된 조합)
        pack_sources = {
            "adventure": {
                "music": ["adv-hero", "adv-drums", "adv-flute", "adv-strings"],
                "ambience": ["adv-birds", "adv-wind", "adv-grass"]
            },
            "combat": {
                "music": ["cmb-warrior", "cmb-war_drums", "cmb-horn", "cmb-heavy_bass"],
                "ambience": ["cmb-sword_clash", "cmb-fire", "cmb-thunder"]
            },
            "shelter": {
                "music": ["shl-melody", "shl-piano", "shl-harp", "shl-pad"],
                "ambience": ["shl-fireplace", "shl-rain", "shl-night"]
            }
        }

        sources = pack_sources.get(pack, pack_sources["adventure"])

        # 16개 씬 생성
        scenes = []
        for scene_id in range(16):
            placed_sources = []

            # 각 씬에 2-4개 음악 소스 배치
            num_music = np.random.randint(2, 5)
            selected_music = np.random.choice(sources["music"], size=min(num_music, len(sources["music"])), replace=False)

            for idx, source_id in enumerate(selected_music):
                # 캔버스에 배치 (중앙 주변에 분산)
                x = 500 + np.random.randn() * 150  # 중앙(500) 기준 분산
                y = 300 + np.random.randn() * 100

                # 범위 제한
                x = max(50, min(950, x))
                y = max(50, min(550, y))

                placed_sources.append({
                    "id": f"source_{scene_id}_{idx}",
                    "sourceId": source_id,
                    "x": float(x),
                    "y": float(y),
                    "volume": np.random.uniform(0.7, 1.0),
                    "muted": False
                })

            scenes.append({
                "id": scene_id,
                "placedSources": placed_sources
            })

        # 모든 씬에 앰비언스 추가
        for scene in scenes:
            for idx, amb_source in enumerate(sources["ambience"]):
                x = np.random.uniform(100, 900)
                y = np.random.uniform(100, 500)

                scene["placedSources"].append({
                    "id": f"amb_{scene['id']}_{idx}",
                    "sourceId": amb_source,
                    "x": float(x),
                    "y": float(y),
                    "volume": np.random.uniform(0.5, 0.8),
                    "muted": False
                })

        return {
            "pack": pack,
            "scenes": scenes,
            "masterVolume": 1.0,
            "musicVolume": 1.0,
            "ambienceVolume": 0.7,
            "model_version": "rule-based-v1.0"
        }

    def _format_composition(self, model_output: Dict, pack: str) -> Dict:
        """
        모델 출력을 API 응답 형식으로 변환
        """
        # TODO: 모델 출력 형식에 맞게 구현
        # 현재는 rule-based와 동일한 형식 반환
        return model_output

    async def get_model_status(self) -> Dict:
        """
        모델 상태 정보 반환
        """
        status = {
            "device": str(self.device),
            "models": {}
        }

        for pack in ["adventure", "combat", "shelter"]:
            model = self.models.get(pack)
            status["models"][pack] = {
                "loaded": model is not None,
                "version": model.version if model else None,
                "parameters": sum(p.numel() for p in model.parameters()) if model else 0
            }

        return status

    async def trigger_training(self, pack: Optional[str] = None) -> str:
        """
        모델 학습 트리거

        Returns:
            task_id: 학습 작업 ID
        """
        task_id = str(uuid.uuid4())

        # TODO: 백그라운드 태스크로 학습 실행
        # 현재는 task_id만 반환
        logger.info(f"Training triggered for pack: {pack or 'all'}, task_id: {task_id}")

        return task_id
