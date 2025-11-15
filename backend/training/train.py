"""
모델 학습 스크립트
"""
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from typing import Dict, Optional
import os
from datetime import datetime
from loguru import logger
import asyncio

from models.transformer.composition_generator import CompositionTransformer, CompositionGenerator
from training.preprocessing.data_processor import DataProcessor
from training.evaluation.metrics import CompositionMetrics
from api.database import connect_to_mongo, get_database


class CompositionLoss(nn.Module):
    """
    Composition 생성 손실 함수
    """

    def __init__(self, source_weight: float = 1.0, position_weight: float = 0.5, volume_weight: float = 0.3):
        super().__init__()
        self.source_weight = source_weight
        self.position_weight = position_weight
        self.volume_weight = volume_weight

        self.ce_loss = nn.CrossEntropyLoss(ignore_index=-100)
        self.mse_loss = nn.MSELoss()

    def forward(
        self,
        predictions: Dict[str, torch.Tensor],
        targets: Dict[str, torch.Tensor]
    ) -> Dict[str, torch.Tensor]:
        """
        손실 계산

        Args:
            predictions: 모델 예측
            targets: 실제 타겟

        Returns:
            손실 딕셔너리
        """
        # 소스 ID 분류 손실
        source_logits = predictions['source_logits']
        target_sources = targets['source_ids']

        # Reshape for cross entropy
        batch_size, seq_len, num_classes = source_logits.shape
        source_logits = source_logits.reshape(-1, num_classes)
        target_sources = target_sources.reshape(-1)

        source_loss = self.ce_loss(source_logits, target_sources)

        # 위치 회귀 손실 (유효한 소스만)
        mask = targets['mask']
        pred_positions = predictions['positions'][mask]
        target_positions = targets['positions'][mask]
        position_loss = self.mse_loss(pred_positions, target_positions)

        # 볼륨 회귀 손실
        pred_volumes = predictions['volumes'][mask]
        target_volumes = targets['volumes'][mask].unsqueeze(-1)
        volume_loss = self.mse_loss(pred_volumes, target_volumes)

        # 총 손실
        total_loss = (
            self.source_weight * source_loss +
            self.position_weight * position_loss +
            self.volume_weight * volume_loss
        )

        return {
            'total': total_loss,
            'source': source_loss,
            'position': position_loss,
            'volume': volume_loss
        }


class Trainer:
    """
    모델 학습 클래스
    """

    def __init__(
        self,
        pack: str,
        num_sources: int = 32,
        device: str = "cuda" if torch.cuda.is_available() else "cpu",
        learning_rate: float = 1e-3,
        num_epochs: int = 100,
        checkpoint_dir: str = "./models/checkpoints"
    ):
        self.pack = pack
        self.device = device
        self.num_epochs = num_epochs
        self.checkpoint_dir = checkpoint_dir

        os.makedirs(checkpoint_dir, exist_ok=True)

        # 모델 생성
        self.model = CompositionTransformer(
            num_sources=num_sources,
            embedding_dim=64,
            position_dim=32,
            hidden_dim=256,
            num_heads=8,
            num_layers=6
        ).to(device)

        # 손실 함수 및 옵티마이저
        self.criterion = CompositionLoss()
        self.optimizer = optim.AdamW(self.model.parameters(), lr=learning_rate, weight_decay=0.01)
        self.scheduler = optim.lr_scheduler.ReduceLROnPlateau(
            self.optimizer,
            mode='min',
            factor=0.5,
            patience=10,
            verbose=True
        )

        # 메트릭
        self.metrics = CompositionMetrics()

        # 학습 기록
        self.train_losses = []
        self.val_losses = []

        logger.info(f"Trainer initialized for {pack} on {device}")
        logger.info(f"Model parameters: {sum(p.numel() for p in self.model.parameters()):,}")

    def train_epoch(self, train_loader: DataLoader) -> float:
        """
        1 에폭 학습

        Returns:
            평균 손실
        """
        self.model.train()
        total_loss = 0.0
        num_batches = 0

        for batch in train_loader:
            # 데이터 이동
            composition_data = {
                'source_ids': batch['source_ids'].to(self.device),
                'positions': batch['positions'].to(self.device),
                'volumes': batch['volumes'].to(self.device)
            }

            targets = {
                'source_ids': batch['source_ids'].to(self.device),
                'positions': batch['positions'].to(self.device),
                'volumes': batch['volumes'].to(self.device),
                'mask': batch['mask'].to(self.device)
            }

            # Forward
            predictions = self.model(composition_data)

            # Loss
            losses = self.criterion(predictions, targets)
            loss = losses['total']

            # Backward
            self.optimizer.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)
            self.optimizer.step()

            total_loss += loss.item()
            num_batches += 1

        return total_loss / num_batches

    def validate(self, val_loader: DataLoader) -> Dict[str, float]:
        """
        검증

        Returns:
            메트릭 딕셔너리
        """
        self.model.eval()
        total_loss = 0.0
        num_batches = 0

        with torch.no_grad():
            for batch in val_loader:
                composition_data = {
                    'source_ids': batch['source_ids'].to(self.device),
                    'positions': batch['positions'].to(self.device),
                    'volumes': batch['volumes'].to(self.device)
                }

                targets = {
                    'source_ids': batch['source_ids'].to(self.device),
                    'positions': batch['positions'].to(self.device),
                    'volumes': batch['volumes'].to(self.device),
                    'mask': batch['mask'].to(self.device)
                }

                predictions = self.model(composition_data)
                losses = self.criterion(predictions, targets)

                total_loss += losses['total'].item()
                num_batches += 1

        return {
            'val_loss': total_loss / num_batches if num_batches > 0 else float('inf')
        }

    def train(self, train_loader: DataLoader, val_loader: DataLoader):
        """
        전체 학습 루프
        """
        best_val_loss = float('inf')

        logger.info(f"Starting training for {self.num_epochs} epochs")

        for epoch in range(self.num_epochs):
            # 학습
            train_loss = self.train_epoch(train_loader)
            self.train_losses.append(train_loss)

            # 검증
            val_metrics = self.validate(val_loader)
            val_loss = val_metrics['val_loss']
            self.val_losses.append(val_loss)

            # 스케줄러 업데이트
            self.scheduler.step(val_loss)

            # 로깅
            logger.info(
                f"Epoch {epoch + 1}/{self.num_epochs} - "
                f"Train Loss: {train_loss:.4f}, Val Loss: {val_loss:.4f}"
            )

            # 체크포인트 저장
            if val_loss < best_val_loss:
                best_val_loss = val_loss
                self.save_checkpoint(epoch, val_loss, is_best=True)
                logger.info(f"New best model saved (val_loss: {val_loss:.4f})")

            # 주기적 저장
            if (epoch + 1) % 10 == 0:
                self.save_checkpoint(epoch, val_loss, is_best=False)

        logger.info("Training completed!")
        return {
            'best_val_loss': best_val_loss,
            'train_losses': self.train_losses,
            'val_losses': self.val_losses
        }

    def save_checkpoint(self, epoch: int, val_loss: float, is_best: bool = False):
        """체크포인트 저장"""
        checkpoint = {
            'epoch': epoch,
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'val_loss': val_loss,
            'pack': self.pack
        }

        # 파일명
        if is_best:
            filename = f"{self.pack}_model_best.pth"
        else:
            filename = f"{self.pack}_model_epoch{epoch + 1}.pth"

        filepath = os.path.join(self.checkpoint_dir, filename)
        torch.save(checkpoint, filepath)


async def train_pack_model(pack: str, num_epochs: int = 100):
    """
    특정 팩의 모델 학습

    Args:
        pack: 팩 종류
        num_epochs: 에폭 수
    """
    # MongoDB 연결
    await connect_to_mongo()
    db = get_database()

    # 데이터 로드
    data_processor = DataProcessor(pack=pack, batch_size=32)
    compositions = await data_processor.load_from_mongodb(db)

    if len(compositions) < 10:
        logger.warning(f"Not enough data for {pack} ({len(compositions)} compositions)")
        logger.info("Need at least 10 compositions for training")
        return

    # 데이터 증강
    augmented_compositions = []
    for comp in compositions:
        augmented_compositions.extend(data_processor.augment_data(comp))

    logger.info(f"Total compositions after augmentation: {len(augmented_compositions)}")

    # DataLoader 생성
    train_loader, val_loader = data_processor.create_dataloader(augmented_compositions)

    # Trainer 생성 및 학습
    trainer = Trainer(pack=pack, num_epochs=num_epochs)
    results = trainer.train(train_loader, val_loader)

    logger.info(f"Training results for {pack}: {results}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--pack", type=str, required=True, choices=["adventure", "combat", "shelter"])
    parser.add_argument("--epochs", type=int, default=100)

    args = parser.parse_args()

    # 비동기 실행
    asyncio.run(train_pack_model(args.pack, args.epochs))
