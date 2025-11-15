"""
Transformer 기반 Composition 생성 모델
"""
import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, List, Optional
import numpy as np


class SourceEmbedding(nn.Module):
    """소스 ID를 임베딩으로 변환"""

    def __init__(self, num_sources: int, embedding_dim: int):
        super().__init__()
        self.embedding = nn.Embedding(num_sources, embedding_dim)
        self.embedding_dim = embedding_dim

    def forward(self, source_ids: torch.Tensor) -> torch.Tensor:
        """
        Args:
            source_ids: (batch, seq_len) - 소스 ID 시퀀스

        Returns:
            embeddings: (batch, seq_len, embedding_dim)
        """
        return self.embedding(source_ids)


class PositionEncoder(nn.Module):
    """위치 정보 (x, y)를 인코딩"""

    def __init__(self, position_dim: int):
        super().__init__()
        self.position_encoder = nn.Sequential(
            nn.Linear(2, position_dim),  # x, y
            nn.ReLU(),
            nn.Linear(position_dim, position_dim)
        )

    def forward(self, positions: torch.Tensor) -> torch.Tensor:
        """
        Args:
            positions: (batch, seq_len, 2) - [x, y] 좌표

        Returns:
            encoded: (batch, seq_len, position_dim)
        """
        return self.position_encoder(positions)


class CompositionTransformer(nn.Module):
    """
    Composition을 생성하는 Transformer 모델

    입력: 시작 토큰 또는 부분적인 composition
    출력: 완성된 composition (소스 배치)
    """

    def __init__(
        self,
        num_sources: int,
        embedding_dim: int = 64,
        position_dim: int = 32,
        hidden_dim: int = 256,
        num_heads: int = 8,
        num_layers: int = 6,
        dropout: float = 0.1,
        max_sources_per_scene: int = 20
    ):
        super().__init__()

        self.num_sources = num_sources
        self.embedding_dim = embedding_dim
        self.position_dim = position_dim
        self.hidden_dim = hidden_dim
        self.max_sources_per_scene = max_sources_per_scene

        # 임베딩 레이어
        self.source_embedding = SourceEmbedding(num_sources + 1, embedding_dim)  # +1 for PAD token
        self.position_encoder = PositionEncoder(position_dim)

        # 특징 통합
        feature_dim = embedding_dim + position_dim + 1  # +1 for volume
        self.feature_projection = nn.Linear(feature_dim, hidden_dim)

        # Transformer Encoder (composition 이해)
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=hidden_dim,
            nhead=num_heads,
            dim_feedforward=hidden_dim * 4,
            dropout=dropout,
            batch_first=True
        )
        self.transformer_encoder = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)

        # Transformer Decoder (새로운 소스 생성)
        decoder_layer = nn.TransformerDecoderLayer(
            d_model=hidden_dim,
            nhead=num_heads,
            dim_feedforward=hidden_dim * 4,
            dropout=dropout,
            batch_first=True
        )
        self.transformer_decoder = nn.TransformerDecoder(decoder_layer, num_layers=num_layers)

        # 출력 헤드
        self.source_head = nn.Linear(hidden_dim, num_sources)  # 소스 ID 예측
        self.position_head = nn.Linear(hidden_dim, 2)  # x, y 좌표 예측
        self.volume_head = nn.Linear(hidden_dim, 1)  # 볼륨 예측

        # 특수 토큰
        self.pad_token = num_sources
        self.start_token = num_sources - 1

    def encode_composition(self, composition_data: Dict) -> torch.Tensor:
        """
        Composition 데이터를 인코딩

        Args:
            composition_data: {
                'source_ids': (batch, num_scenes, max_sources),
                'positions': (batch, num_scenes, max_sources, 2),
                'volumes': (batch, num_scenes, max_sources)
            }

        Returns:
            encoded: (batch, num_scenes * max_sources, hidden_dim)
        """
        batch_size = composition_data['source_ids'].shape[0]
        num_scenes = composition_data['source_ids'].shape[1]

        # Flatten scenes
        source_ids = composition_data['source_ids'].reshape(batch_size, -1)
        positions = composition_data['positions'].reshape(batch_size, -1, 2)
        volumes = composition_data['volumes'].reshape(batch_size, -1, 1)

        # 임베딩
        source_emb = self.source_embedding(source_ids)  # (batch, seq, emb_dim)
        position_emb = self.position_encoder(positions)  # (batch, seq, pos_dim)

        # 통합
        features = torch.cat([source_emb, position_emb, volumes], dim=-1)
        features = self.feature_projection(features)

        # Transformer 인코딩
        encoded = self.transformer_encoder(features)

        return encoded

    def generate_scene(
        self,
        memory: torch.Tensor,
        num_sources: int,
        temperature: float = 1.0
    ) -> Dict:
        """
        하나의 씬 생성

        Args:
            memory: 인코딩된 컨텍스트 (batch, seq, hidden_dim)
            num_sources: 생성할 소스 개수
            temperature: 샘플링 temperature

        Returns:
            scene_data: {
                'source_ids': List[int],
                'positions': List[Tuple[float, float]],
                'volumes': List[float]
            }
        """
        batch_size = memory.shape[0]
        device = memory.device

        # 시작 토큰
        current_tokens = torch.full((batch_size, 1), self.start_token, dtype=torch.long, device=device)

        source_ids = []
        positions = []
        volumes = []

        for _ in range(num_sources):
            # 현재까지 생성된 토큰 임베딩
            token_emb = self.source_embedding(current_tokens)
            dummy_pos = torch.zeros(batch_size, token_emb.shape[1], 2, device=device)
            dummy_vol = torch.ones(batch_size, token_emb.shape[1], 1, device=device)

            pos_emb = self.position_encoder(dummy_pos)
            features = torch.cat([token_emb, pos_emb, dummy_vol], dim=-1)
            features = self.feature_projection(features)

            # Decoder
            output = self.transformer_decoder(features, memory)

            # 마지막 출력으로 예측
            last_output = output[:, -1, :]

            # 소스 ID 예측
            source_logits = self.source_head(last_output) / temperature
            source_probs = F.softmax(source_logits, dim=-1)
            source_id = torch.multinomial(source_probs, 1).squeeze(-1)

            # 위치 예측 (sigmoid로 0~1 범위로 정규화)
            position = torch.sigmoid(self.position_head(last_output))

            # 볼륨 예측
            volume = torch.sigmoid(self.volume_head(last_output))

            # 저장
            source_ids.append(source_id.item())
            positions.append((position[0, 0].item() * 1000, position[0, 1].item() * 600))  # 캔버스 크기로 스케일
            volumes.append(volume[0, 0].item())

            # 다음 입력으로 사용
            current_tokens = torch.cat([current_tokens, source_id.unsqueeze(1)], dim=1)

        return {
            'source_ids': source_ids,
            'positions': positions,
            'volumes': volumes
        }

    def forward(self, composition_data: Dict) -> Dict:
        """
        Forward pass (학습용)

        Args:
            composition_data: composition 데이터

        Returns:
            predictions: {
                'source_logits': (batch, seq, num_sources),
                'positions': (batch, seq, 2),
                'volumes': (batch, seq, 1)
            }
        """
        # 인코딩
        encoded = self.encode_composition(composition_data)

        # 예측
        source_logits = self.source_head(encoded)
        positions = torch.sigmoid(self.position_head(encoded))
        volumes = torch.sigmoid(self.volume_head(encoded))

        return {
            'source_logits': source_logits,
            'positions': positions,
            'volumes': volumes
        }


class CompositionGenerator:
    """
    Composition 생성기 (고수준 인터페이스)
    """

    def __init__(
        self,
        pack: str,
        num_sources: int = 32,  # 각 팩당 32개 소스
        device: str = "cpu"
    ):
        self.pack = pack
        self.num_sources = num_sources
        self.device = device
        self.version = "v1.0"

        # 모델 생성
        self.model = CompositionTransformer(
            num_sources=num_sources,
            embedding_dim=64,
            position_dim=32,
            hidden_dim=256,
            num_heads=8,
            num_layers=6
        ).to(device)

        # 팩별 소스 매핑
        self.source_mapping = self._create_source_mapping(pack)

    def _create_source_mapping(self, pack: str) -> Dict:
        """팩별 소스 ID 매핑"""
        pack_prefix = {
            "adventure": "adv",
            "combat": "cmb",
            "shelter": "shl"
        }

        prefix = pack_prefix.get(pack, "adv")

        # 실제 소스 목록 (sources.ts 참고)
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

        # Combat과 Shelter는 다른 소스 이름 사용
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
        for idx, name in enumerate(music_sources + ambience_sources):
            mapping[idx] = f"{prefix}-{name}"

        return mapping

    def generate(self, temperature: float = 1.0) -> Dict:
        """
        새로운 composition 생성

        Args:
            temperature: 생성 다양성

        Returns:
            composition 데이터
        """
        self.model.eval()

        with torch.no_grad():
            # 빈 메모리로 시작 (unconditional generation)
            memory = torch.randn(1, 1, self.model.hidden_dim).to(self.device)

            scenes = []

            for scene_id in range(16):
                # 씬당 소스 개수 (2~6개)
                num_sources = np.random.randint(2, 7)

                # 씬 생성
                scene_data = self.model.generate_scene(
                    memory=memory,
                    num_sources=num_sources,
                    temperature=temperature
                )

                # 포맷 변환
                placed_sources = []
                for idx in range(len(scene_data['source_ids'])):
                    source_id = scene_data['source_ids'][idx]
                    source_name = self.source_mapping.get(source_id, self.source_mapping[0])

                    placed_sources.append({
                        "id": f"gen_{scene_id}_{idx}",
                        "sourceId": source_name,
                        "x": float(scene_data['positions'][idx][0]),
                        "y": float(scene_data['positions'][idx][1]),
                        "volume": float(scene_data['volumes'][idx]),
                        "muted": False
                    })

                scenes.append({
                    "id": scene_id,
                    "placedSources": placed_sources
                })

        return {
            "pack": self.pack,
            "scenes": scenes,
            "masterVolume": 1.0,
            "musicVolume": 1.0,
            "ambienceVolume": 0.7
        }

    def save(self, path: str):
        """모델 저장"""
        torch.save({
            'model_state_dict': self.model.state_dict(),
            'pack': self.pack,
            'num_sources': self.num_sources,
            'version': self.version,
            'source_mapping': self.source_mapping
        }, path)

    @classmethod
    def load(cls, path: str, device: str = "cpu"):
        """모델 로드"""
        checkpoint = torch.load(path, map_location=device)

        generator = cls(
            pack=checkpoint['pack'],
            num_sources=checkpoint['num_sources'],
            device=device
        )

        generator.model.load_state_dict(checkpoint['model_state_dict'])
        generator.version = checkpoint.get('version', 'v1.0')
        generator.source_mapping = checkpoint.get('source_mapping', generator.source_mapping)

        return generator

    def parameters(self):
        """모델 파라미터"""
        return self.model.parameters()
