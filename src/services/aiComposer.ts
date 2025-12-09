/**
 * AI 기반 자동 사운드스케이프 생성 엔진
 *
 * 연구 가치:
 * - 게임 상황별 감정 프로파일 기반 자동 배치
 * - 규칙 기반 알고리즘으로 즉시 적용 가능
 * - 추후 강화학습으로 확장 가능한 구조
 */

import { PlacedSourceData, SceneSlot, PackType, Source } from '../App';

// 감정 프로파일 정의
export interface EmotionProfile {
  name: string;
  description: string;
  musicDensity: number;      // 0-1: 음악 배치 밀도
  ambienceDensity: number;   // 0-1: 앰비언스 배치 밀도
  spatialPattern: 'surround' | 'frontal' | 'scattered' | 'focused';
  distanceRange: [number, number]; // [min, max] 픽셀 단위
  layering: 'sparse' | 'moderate' | 'dense'; // 레이어링 강도
}

// Pack별 감정 프로파일
const EMOTION_PROFILES: Record<PackType, EmotionProfile> = {
  adventure: {
    name: 'Adventure - Exploration',
    description: '탐험과 발견의 느낌',
    musicDensity: 0.4,
    ambienceDensity: 0.6,
    spatialPattern: 'scattered',
    distanceRange: [100, 400],
    layering: 'moderate',
  },
  combat: {
    name: 'Combat - Tension',
    description: '긴장감과 전투의 느낌',
    musicDensity: 0.3,
    ambienceDensity: 0.7,
    spatialPattern: 'surround',
    distanceRange: [150, 500],
    layering: 'dense',
  },
  shelter: {
    name: 'Shelter - Peaceful',
    description: '평화롭고 안전한 느낌',
    musicDensity: 0.6,
    ambienceDensity: 0.4,
    spatialPattern: 'frontal',
    distanceRange: [50, 300],
    layering: 'sparse',
  },
};

// 공간 분포 패턴
interface SpatialPattern {
  generatePosition: (
    index: number,
    total: number,
    canvasWidth: number,
    canvasHeight: number,
    distanceRange: [number, number]
  ) => { x: number; y: number };
}

const SPATIAL_PATTERNS: Record<string, SpatialPattern> = {
  // 사방에서 둘러싸는 배치 (긴장감)
  surround: {
    generatePosition: (index, total, w, h, [minDist, maxDist]) => {
      const angle = (index / total) * Math.PI * 2;
      const distance = minDist + Math.random() * (maxDist - minDist);
      return {
        x: w / 2 + Math.cos(angle) * distance,
        y: h / 2 + Math.sin(angle) * distance,
      };
    },
  },

  // 전방 집중 배치 (집중감)
  frontal: {
    generatePosition: (index, total, w, h, [minDist, maxDist]) => {
      const spread = 0.6; // 전방 60도 범위
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * spread * Math.PI;
      const distance = minDist + Math.random() * (maxDist - minDist);
      return {
        x: w / 2 + Math.cos(angle) * distance,
        y: h / 2 + Math.sin(angle) * distance * 0.7,
      };
    },
  },

  // 무작위 분산 배치 (탐험감)
  scattered: {
    generatePosition: (index, total, w, h, [minDist, maxDist]) => {
      return {
        x: minDist + Math.random() * (w - minDist * 2),
        y: minDist + Math.random() * (h - minDist * 2),
      };
    },
  },

  // 중앙 집중 배치 (친밀감)
  focused: {
    generatePosition: (index, total, w, h, [minDist, maxDist]) => {
      const angle = (index / total) * Math.PI * 2;
      const distance = minDist + Math.random() * (maxDist - minDist) * 0.5;
      return {
        x: w / 2 + Math.cos(angle) * distance,
        y: h / 2 + Math.sin(angle) * distance,
      };
    },
  },
};

// AI 자동 배치 엔진
export class AIComposer {
  /**
   * Pack에 맞는 자동 composition 생성
   */
  static generateComposition(
    pack: PackType,
    sources: Source[],
    canvasWidth: number = 800,
    canvasHeight: number = 600,
    sceneCount: number = 16
  ): SceneSlot[] {
    const profile = EMOTION_PROFILES[pack];
    const scenes: SceneSlot[] = [];

    // 소스 분류
    const musicSources = sources.filter((s) => s.type === 'music');
    const ambienceSources = sources.filter((s) => s.type === 'ambience');

    for (let i = 0; i < sceneCount; i++) {
      const placedSources: PlacedSourceData[] = [];

      // 씬별 변화 (점진적 강도 변화)
      const intensity = i / sceneCount; // 0 -> 1

      // 1. Music 배치
      const musicCount = Math.floor(
        musicSources.length * profile.musicDensity * (0.5 + intensity * 0.5)
      );
      const selectedMusic = this.selectRandomSources(musicSources, musicCount);

      selectedMusic.forEach((source, idx) => {
        const pos = SPATIAL_PATTERNS[profile.spatialPattern].generatePosition(
          idx,
          musicCount,
          canvasWidth,
          canvasHeight,
          profile.distanceRange
        );

        placedSources.push({
          id: `${source.id}-${Date.now()}-${idx}`,
          sourceId: source.id,
          x: Math.max(50, Math.min(canvasWidth - 50, pos.x)),
          y: Math.max(50, Math.min(canvasHeight - 50, pos.y)),
          volume: 0.6 + Math.random() * 0.4, // 0.6-1.0
          muted: false,
        });
      });

      // 2. Ambience 배치 (3D 효과 극대화)
      const ambienceCount = Math.floor(
        ambienceSources.length * profile.ambienceDensity * (0.3 + intensity * 0.7)
      );
      const selectedAmbience = this.selectRandomSources(ambienceSources, ambienceCount);

      selectedAmbience.forEach((source, idx) => {
        const pos = SPATIAL_PATTERNS[profile.spatialPattern].generatePosition(
          idx + musicCount,
          ambienceCount,
          canvasWidth,
          canvasHeight,
          profile.distanceRange
        );

        placedSources.push({
          id: `${source.id}-${Date.now()}-${idx + 1000}`,
          sourceId: source.id,
          x: Math.max(50, Math.min(canvasWidth - 50, pos.x)),
          y: Math.max(50, Math.min(canvasHeight - 50, pos.y)),
          volume: 0.5 + Math.random() * 0.5, // 0.5-1.0
          muted: false,
        });
      });

      scenes.push({
        id: i,
        placedSources,
      });
    }

    return scenes;
  }

  /**
   * 소스에서 랜덤하게 n개 선택
   */
  private static selectRandomSources(sources: Source[], count: number): Source[] {
    const shuffled = [...sources].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, sources.length));
  }

  /**
   * 감정 프로파일 가져오기
   */
  static getEmotionProfile(pack: PackType): EmotionProfile {
    return EMOTION_PROFILES[pack];
  }

  /**
   * 단일 씬에 대한 자동 배치 (사용자가 수동으로 추가할 때 도움)
   */
  static suggestSourcePlacement(
    source: Source,
    existingPlaced: PlacedSourceData[],
    pack: PackType,
    canvasWidth: number = 800,
    canvasHeight: number = 600
  ): { x: number; y: number } {
    const profile = EMOTION_PROFILES[pack];

    // 기존 소스와 겹치지 않는 위치 찾기
    let attempts = 0;
    const maxAttempts = 50;
    const minDistance = 100; // 최소 거리

    while (attempts < maxAttempts) {
      const pos = SPATIAL_PATTERNS[profile.spatialPattern].generatePosition(
        existingPlaced.length,
        existingPlaced.length + 1,
        canvasWidth,
        canvasHeight,
        profile.distanceRange
      );

      // 기존 소스와의 거리 체크
      const tooClose = existingPlaced.some((placed) => {
        const dx = placed.x - pos.x;
        const dy = placed.y - pos.y;
        return Math.sqrt(dx * dx + dy * dy) < minDistance;
      });

      if (!tooClose) {
        return {
          x: Math.max(50, Math.min(canvasWidth - 50, pos.x)),
          y: Math.max(50, Math.min(canvasHeight - 50, pos.y)),
        };
      }

      attempts++;
    }

    // 최악의 경우 중앙 반환
    return {
      x: canvasWidth / 2 + (Math.random() - 0.5) * 100,
      y: canvasHeight / 2 + (Math.random() - 0.5) * 100,
    };
  }
}
