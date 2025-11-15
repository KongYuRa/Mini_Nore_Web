"""
모델 평가 메트릭
"""
import torch
import numpy as np
from typing import Dict, List
from sklearn.metrics import accuracy_score, precision_recall_fscore_support


class CompositionMetrics:
    """
    Composition 생성 품질 평가 메트릭
    """

    def __init__(self):
        pass

    def compute_source_accuracy(
        self,
        predicted_sources: torch.Tensor,
        target_sources: torch.Tensor,
        mask: torch.Tensor
    ) -> float:
        """
        소스 ID 예측 정확도

        Args:
            predicted_sources: (batch, seq, num_classes) 예측 로짓
            target_sources: (batch, seq) 타겟 소스 ID
            mask: (batch, seq) 유효한 위치

        Returns:
            정확도 (0~1)
        """
        # 예측
        pred_ids = torch.argmax(predicted_sources, dim=-1)

        # 유효한 위치만
        pred_flat = pred_ids[mask].cpu().numpy()
        target_flat = target_sources[mask].cpu().numpy()

        if len(pred_flat) == 0:
            return 0.0

        accuracy = accuracy_score(target_flat, pred_flat)
        return accuracy

    def compute_position_error(
        self,
        predicted_positions: torch.Tensor,
        target_positions: torch.Tensor,
        mask: torch.Tensor
    ) -> float:
        """
        위치 예측 오차 (MAE)

        Args:
            predicted_positions: (batch, seq, 2) 예측 위치
            target_positions: (batch, seq, 2) 타겟 위치
            mask: (batch, seq) 유효한 위치

        Returns:
            평균 절대 오차
        """
        pred_flat = predicted_positions[mask].cpu().numpy()
        target_flat = target_positions[mask].cpu().numpy()

        if len(pred_flat) == 0:
            return 0.0

        mae = np.mean(np.abs(pred_flat - target_flat))
        return mae

    def compute_volume_error(
        self,
        predicted_volumes: torch.Tensor,
        target_volumes: torch.Tensor,
        mask: torch.Tensor
    ) -> float:
        """
        볼륨 예측 오차 (MAE)

        Args:
            predicted_volumes: (batch, seq, 1) 예측 볼륨
            target_volumes: (batch, seq) 타겟 볼륨
            mask: (batch, seq) 유효한 위치

        Returns:
            평균 절대 오차
        """
        pred_flat = predicted_volumes[mask].squeeze(-1).cpu().numpy()
        target_flat = target_volumes[mask].cpu().numpy()

        if len(pred_flat) == 0:
            return 0.0

        mae = np.mean(np.abs(pred_flat - target_flat))
        return mae

    def compute_diversity_score(self, compositions: List[Dict]) -> float:
        """
        생성된 composition들의 다양성 점수

        - 사용된 소스의 다양성
        - 위치 배치 패턴의 다양성

        Args:
            compositions: 생성된 composition 리스트

        Returns:
            다양성 점수 (0~1, 높을수록 다양함)
        """
        if len(compositions) < 2:
            return 0.0

        # 각 composition의 소스 사용 패턴 추출
        source_patterns = []
        position_patterns = []

        for comp in compositions:
            sources_used = set()
            positions = []

            for scene in comp.get('scenes', []):
                for source in scene.get('placedSources', []):
                    sources_used.add(source['sourceId'])
                    positions.append((source['x'], source['y']))

            source_patterns.append(sources_used)
            position_patterns.append(positions)

        # 소스 다양성: Jaccard 거리의 평균
        source_diversity = 0.0
        num_pairs = 0

        for i in range(len(source_patterns)):
            for j in range(i + 1, len(source_patterns)):
                set_i = source_patterns[i]
                set_j = source_patterns[j]

                # Jaccard 거리 = 1 - Jaccard 유사도
                intersection = len(set_i & set_j)
                union = len(set_i | set_j)

                if union > 0:
                    jaccard_distance = 1 - (intersection / union)
                    source_diversity += jaccard_distance
                    num_pairs += 1

        if num_pairs > 0:
            source_diversity /= num_pairs

        return source_diversity

    def compute_musicality_score(self, composition: Dict) -> float:
        """
        음악적 품질 점수 (휴리스틱 기반)

        - 소스 개수의 적절성
        - 위치 분산
        - 볼륨 밸런스

        Args:
            composition: composition 데이터

        Returns:
            음악성 점수 (0~1)
        """
        scores = []

        # 1. 소스 개수 적절성 (씬당 2~6개가 이상적)
        source_counts = []
        for scene in composition.get('scenes', []):
            num_sources = len(scene.get('placedSources', []))
            source_counts.append(num_sources)

        avg_sources = np.mean(source_counts) if source_counts else 0

        # 2~6개 사이면 1.0, 멀어질수록 감소
        if 2 <= avg_sources <= 6:
            source_score = 1.0
        else:
            source_score = max(0, 1 - abs(avg_sources - 4) / 10)

        scores.append(source_score)

        # 2. 위치 분산 (너무 몰려있지 않은지)
        all_positions = []
        for scene in composition.get('scenes', []):
            for source in scene.get('placedSources', []):
                all_positions.append([source['x'], source['y']])

        if len(all_positions) > 1:
            positions_array = np.array(all_positions)
            position_std = np.std(positions_array, axis=0).mean()

            # 적절한 분산 (100~300)
            if 100 <= position_std <= 300:
                position_score = 1.0
            else:
                position_score = max(0, 1 - abs(position_std - 200) / 500)

            scores.append(position_score)

        # 3. 볼륨 밸런스 (대부분 0.6~1.0 사이)
        volumes = []
        for scene in composition.get('scenes', []):
            for source in scene.get('placedSources', []):
                volumes.append(source.get('volume', 1.0))

        if volumes:
            avg_volume = np.mean(volumes)
            if 0.6 <= avg_volume <= 1.0:
                volume_score = 1.0
            else:
                volume_score = max(0, 1 - abs(avg_volume - 0.8))

            scores.append(volume_score)

        return np.mean(scores) if scores else 0.0

    def evaluate_batch(
        self,
        predictions: Dict[str, torch.Tensor],
        targets: Dict[str, torch.Tensor]
    ) -> Dict[str, float]:
        """
        배치 평가

        Returns:
            메트릭 딕셔너리
        """
        metrics = {}

        # 소스 정확도
        metrics['source_accuracy'] = self.compute_source_accuracy(
            predictions['source_logits'],
            targets['source_ids'],
            targets['mask']
        )

        # 위치 오차
        metrics['position_mae'] = self.compute_position_error(
            predictions['positions'],
            targets['positions'],
            targets['mask']
        )

        # 볼륨 오차
        metrics['volume_mae'] = self.compute_volume_error(
            predictions['volumes'],
            targets['volumes'],
            targets['mask']
        )

        return metrics
