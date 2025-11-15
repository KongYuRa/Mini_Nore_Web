"""
학습 데이터 전처리 파이프라인
"""
import torch
from torch.utils.data import Dataset, DataLoader
from typing import List, Dict, Tuple
import numpy as np
from loguru import logger


class CompositionDataset(Dataset):
    """
    Composition 데이터셋 클래스
    """

    def __init__(
        self,
        compositions: List[Dict],
        pack: str,
        max_sources_per_scene: int = 20,
        num_scenes: int = 16
    ):
        """
        Args:
            compositions: composition 데이터 리스트
            pack: 팩 종류
            max_sources_per_scene: 씬당 최대 소스 개수
            num_scenes: 씬 개수 (기본 16)
        """
        self.compositions = compositions
        self.pack = pack
        self.max_sources_per_scene = max_sources_per_scene
        self.num_scenes = num_scenes

        # 소스 ID 매핑
        self.source_to_idx = self._build_source_mapping(pack)
        self.num_sources = len(self.source_to_idx)

        logger.info(f"Created dataset for {pack} with {len(compositions)} compositions")

    def _build_source_mapping(self, pack: str) -> Dict[str, int]:
        """팩별 소스 ID → 인덱스 매핑"""
        pack_prefix = {
            "adventure": "adv",
            "combat": "cmb",
            "shelter": "shl"
        }

        prefix = pack_prefix.get(pack, "adv")

        # 모든 가능한 소스 나열
        music_sources = [
            "hero", "drums", "flute", "strings", "harp", "trumpet",
            "bass", "choir", "lute", "horn", "bells", "fiddle",
            "pan_flute", "tambourine", "dulcimer", "bagpipe"
        ]

        ambience_sources = [
            "birds", "wind", "grass", "water", "leaves", "insects",
            "stream", "owl", "frog", "cricket", "breeze", "rustle",
            "chirp", "flutter", "whisper", "echo"
        ]

        if pack == "combat":
            music_sources = [
                "warrior", "war_drums", "horn", "heavy_bass", "battle_cry", "anvil",
                "clash", "march", "warcry", "thunderdrum", "battlehorn", "armory",
                "siege", "charge", "rally", "conquest"
            ]
            ambience_sources = [
                "sword_clash", "fire", "monster", "thunder", "roar", "flames",
                "rumble", "growl", "crackle", "stomp", "boom", "sizzle",
                "smash", "crash", "bang", "explosion"
            ]
        elif pack == "shelter":
            music_sources = [
                "melody", "piano", "harp", "pad", "warmth", "comfort",
                "peace", "calm", "gentle", "soft", "lullaby", "cradle",
                "rest", "ease", "serene", "tranquil"
            ]
            ambience_sources = [
                "fireplace", "rain", "night", "wood_creak", "wind_chime", "clock",
                "settle", "ember", "drizzle", "patter", "tick", "glow",
                "warm", "cozy", "quiet", "still"
            ]

        mapping = {}
        all_sources = music_sources + ambience_sources

        for idx, name in enumerate(all_sources):
            source_id = f"{prefix}-{name}"
            mapping[source_id] = idx

        return mapping

    def __len__(self) -> int:
        return len(self.compositions)

    def __getitem__(self, idx: int) -> Dict[str, torch.Tensor]:
        """
        하나의 composition을 텐서로 변환

        Returns:
            {
                'source_ids': (num_scenes, max_sources),
                'positions': (num_scenes, max_sources, 2),
                'volumes': (num_scenes, max_sources),
                'mask': (num_scenes, max_sources)  # 유효한 소스 위치 표시
            }
        """
        composition = self.compositions[idx]

        # 초기화
        source_ids = torch.full(
            (self.num_scenes, self.max_sources_per_scene),
            self.num_sources,  # PAD token
            dtype=torch.long
        )
        positions = torch.zeros((self.num_scenes, self.max_sources_per_scene, 2))
        volumes = torch.zeros((self.num_scenes, self.max_sources_per_scene))
        mask = torch.zeros((self.num_scenes, self.max_sources_per_scene), dtype=torch.bool)

        # 각 씬 처리
        for scene in composition['scenes']:
            scene_id = scene['id']
            if scene_id >= self.num_scenes:
                continue

            placed_sources = scene.get('placedSources', [])

            for src_idx, source in enumerate(placed_sources[:self.max_sources_per_scene]):
                source_name = source['sourceId']

                # 소스 ID 변환
                if source_name in self.source_to_idx:
                    source_ids[scene_id, src_idx] = self.source_to_idx[source_name]

                    # 위치 정규화 (0~1 범위로)
                    x = source.get('x', 500) / 1000.0  # 캔버스 너비 1000
                    y = source.get('y', 300) / 600.0   # 캔버스 높이 600
                    positions[scene_id, src_idx] = torch.tensor([x, y])

                    # 볼륨
                    volumes[scene_id, src_idx] = source.get('volume', 1.0)

                    # 마스크 (유효한 소스)
                    mask[scene_id, src_idx] = True

        return {
            'source_ids': source_ids,
            'positions': positions,
            'volumes': volumes,
            'mask': mask
        }


class DataProcessor:
    """
    데이터 전처리 및 로더 생성
    """

    def __init__(
        self,
        pack: str,
        max_sources_per_scene: int = 20,
        batch_size: int = 32
    ):
        self.pack = pack
        self.max_sources_per_scene = max_sources_per_scene
        self.batch_size = batch_size

    async def load_from_mongodb(self, db) -> List[Dict]:
        """
        MongoDB에서 데이터 로드

        Args:
            db: MongoDB 데이터베이스 인스턴스

        Returns:
            composition 리스트
        """
        from api.schemas.composition import Composition

        # 해당 팩의 사용자 생성 composition만 가져오기
        compositions = await Composition.find({
            "pack": self.pack,
            "is_ai_generated": False
        }).to_list()

        logger.info(f"Loaded {len(compositions)} compositions for {self.pack}")

        # Dict 형태로 변환
        composition_dicts = []
        for comp in compositions:
            composition_dicts.append({
                'pack': comp.pack,
                'scenes': [scene.dict() for scene in comp.scenes]
            })

        return composition_dicts

    def create_dataloader(
        self,
        compositions: List[Dict],
        shuffle: bool = True,
        train_split: float = 0.8
    ) -> Tuple[DataLoader, DataLoader]:
        """
        Train/Validation DataLoader 생성

        Args:
            compositions: composition 데이터
            shuffle: 셔플 여부
            train_split: 학습 데이터 비율

        Returns:
            (train_loader, val_loader)
        """
        # Train/Val 분할
        split_idx = int(len(compositions) * train_split)

        if shuffle:
            np.random.shuffle(compositions)

        train_data = compositions[:split_idx]
        val_data = compositions[split_idx:]

        logger.info(f"Train: {len(train_data)}, Val: {len(val_data)}")

        # Dataset 생성
        train_dataset = CompositionDataset(
            train_data,
            self.pack,
            self.max_sources_per_scene
        )

        val_dataset = CompositionDataset(
            val_data,
            self.pack,
            self.max_sources_per_scene
        )

        # DataLoader 생성
        train_loader = DataLoader(
            train_dataset,
            batch_size=self.batch_size,
            shuffle=True,
            num_workers=0  # 비동기 작업이므로 0
        )

        val_loader = DataLoader(
            val_dataset,
            batch_size=self.batch_size,
            shuffle=False,
            num_workers=0
        )

        return train_loader, val_loader

    def augment_data(self, composition: Dict) -> List[Dict]:
        """
        데이터 증강 (Data Augmentation)

        - 위치 변환 (translation)
        - 소스 순서 섞기
        - 볼륨 변화

        Args:
            composition: 원본 composition

        Returns:
            증강된 composition 리스트
        """
        augmented = [composition]  # 원본 포함

        # 1. 위치 변환 (좌우 반전)
        flipped = self._flip_composition(composition)
        augmented.append(flipped)

        # 2. 볼륨 변화 (+/- 10%)
        volume_varied = self._vary_volume(composition)
        augmented.append(volume_varied)

        return augmented

    def _flip_composition(self, composition: Dict) -> Dict:
        """좌우 반전"""
        import copy
        flipped = copy.deepcopy(composition)

        for scene in flipped['scenes']:
            for source in scene.get('placedSources', []):
                # X 좌표 반전
                source['x'] = 1000 - source['x']

        return flipped

    def _vary_volume(self, composition: Dict, variance: float = 0.1) -> Dict:
        """볼륨 변화"""
        import copy
        varied = copy.deepcopy(composition)

        for scene in varied['scenes']:
            for source in scene.get('placedSources', []):
                # 볼륨 변화 (0.9~1.1배)
                factor = np.random.uniform(1 - variance, 1 + variance)
                source['volume'] = np.clip(source['volume'] * factor, 0.0, 1.0)

        return varied
