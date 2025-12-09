import { useEffect, useRef } from 'react';
import { PlacedSourceData, SceneSlot, PackType } from '../App';

type PackScenes = Record<PackType, SceneSlot[]>;

export interface ListenerPosition {
  x: number;
  y: number;
  z: number;
}

interface AudioManagerProps {
  scenes: PackScenes;
  currentSlot: number;
  isPlaying: boolean;
  selectedPack: PackType;
  masterVolume: number;
  musicVolume: number;
  ambienceVolume: number;
  musicMuted: boolean;
  ambienceMuted: boolean;
  listenerPosition?: ListenerPosition;
  canvasWidth?: number;
  canvasHeight?: number;
}

export function useAudioManager({
  scenes,
  currentSlot,
  isPlaying,
  selectedPack,
  masterVolume,
  musicVolume,
  ambienceVolume,
  musicMuted,
  ambienceMuted,
  listenerPosition,
  canvasWidth = 800,
  canvasHeight = 600,
}: AudioManagerProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const ambienceGainRef = useRef<GainNode | null>(null);
  const sourceNodesRef = useRef<Map<string, AudioBufferSourceNode>>(new Map());
  const gainNodesRef = useRef<Map<string, GainNode>>(new Map());
  const pannerNodesRef = useRef<Map<string, PannerNode>>(new Map());

  // 2D 캔버스 좌표 → 3D 오디오 공간 변환
  const canvasTo3D = (x: number, y: number): ListenerPosition => {
    // X: -5m ~ +5m (좌우)
    const x3d = (x / canvasWidth) * 10 - 5;

    // Y: 1.6m 고정 (귀 높이)
    const y3d = 1.6;

    // Z: 0 ~ -10m (앞쪽이 음수, 멀수록 작아짐)
    const z3d = -(y / canvasHeight) * 10;

    return { x: x3d, y: y3d, z: z3d };
  };

  // Initialize audio context
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      masterGainRef.current = audioContextRef.current.createGain();
      musicGainRef.current = audioContextRef.current.createGain();
      ambienceGainRef.current = audioContextRef.current.createGain();

      // Connect gain nodes
      musicGainRef.current.connect(masterGainRef.current);
      ambienceGainRef.current.connect(masterGainRef.current);
      masterGainRef.current.connect(audioContextRef.current.destination);

      // Set listener position (default: center of canvas)
      const listener = audioContextRef.current.listener;
      if (listener.positionX) {
        // Modern API
        listener.positionX.value = 0;
        listener.positionY.value = 1.6; // 귀 높이
        listener.positionZ.value = 0;
        listener.forwardX.value = 0;
        listener.forwardY.value = 0;
        listener.forwardZ.value = -1; // 앞쪽 바라봄
        listener.upX.value = 0;
        listener.upY.value = 1;
        listener.upZ.value = 0;
      } else {
        // Legacy API (fallback)
        listener.setPosition(0, 1.6, 0);
        listener.setOrientation(0, 0, -1, 0, 1, 0);
      }
    }

    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Update listener position
  useEffect(() => {
    if (!audioContextRef.current || !listenerPosition) return;

    const listener = audioContextRef.current.listener;
    if (listener.positionX) {
      listener.positionX.value = listenerPosition.x;
      listener.positionY.value = listenerPosition.y;
      listener.positionZ.value = listenerPosition.z;
    } else {
      listener.setPosition(listenerPosition.x, listenerPosition.y, listenerPosition.z);
    }
  }, [listenerPosition]);

  // Update volumes
  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = masterVolume;
    }
    if (musicGainRef.current) {
      musicGainRef.current.gain.value = musicMuted ? 0 : musicVolume;
    }
    if (ambienceGainRef.current) {
      ambienceGainRef.current.gain.value = ambienceMuted ? 0 : ambienceVolume;
    }
  }, [masterVolume, musicVolume, ambienceVolume, musicMuted, ambienceMuted]);

  // Create 3D panner node for ambience (앰비언스만 3D 적용)
  const create3DPanner = (sourceId: string, x: number, y: number): PannerNode | null => {
    if (!audioContextRef.current) return null;

    const panner = audioContextRef.current.createPanner();

    // 3D 오디오 설정
    panner.panningModel = 'HRTF'; // 인간 청각 모델 (가장 정확한 3D 사운드)
    panner.distanceModel = 'inverse'; // 거리 감쇠 모델
    panner.refDistance = 1; // 거리 감쇠 시작 거리
    panner.maxDistance = 20; // 최대 거리
    panner.rolloffFactor = 1; // 거리 감쇠율
    panner.coneInnerAngle = 360; // 전방향 소리
    panner.coneOuterAngle = 360;
    panner.coneOuterGain = 0.5;

    // 2D 좌표 → 3D 위치 변환
    const pos3d = canvasTo3D(x, y);

    // 위치 설정
    if (panner.positionX) {
      panner.positionX.value = pos3d.x;
      panner.positionY.value = pos3d.y;
      panner.positionZ.value = pos3d.z;
    } else {
      panner.setPosition(pos3d.x, pos3d.y, pos3d.z);
    }

    pannerNodesRef.current.set(sourceId, panner);
    return panner;
  };

  // Update 3D position (앰비언스 소스 이동 시)
  const update3DPosition = (sourceId: string, x: number, y: number) => {
    const panner = pannerNodesRef.current.get(sourceId);
    if (!panner) return;

    const pos3d = canvasTo3D(x, y);

    if (panner.positionX) {
      panner.positionX.value = pos3d.x;
      panner.positionY.value = pos3d.y;
      panner.positionZ.value = pos3d.z;
    } else {
      panner.setPosition(pos3d.x, pos3d.y, pos3d.z);
    }
  };

  // Handle playback - Pack separation
  useEffect(() => {
    if (!audioContextRef.current || !musicGainRef.current || !ambienceGainRef.current) return;

    if (isPlaying) {
      // Resume audio context if suspended
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      const currentPackScenes = scenes[selectedPack];
      const currentScene = currentPackScenes[currentSlot];

      // Get pack prefix
      const packPrefix = selectedPack === 'adventure' ? 'adv-'
                       : selectedPack === 'combat' ? 'cmb-'
                       : 'shl-';

      // Filter sources by current pack only
      const packSources = currentScene.placedSources.filter(s =>
        s.sourceId.startsWith(packPrefix)
      );

      console.log('Playing scene:', currentSlot + 1);
      console.log('Pack:', selectedPack);
      console.log('Pack sources:', packSources.length);

      // TODO: Load and play audio files here
      // 오디오 파일이 준비되면 여기서 로드 및 재생
      packSources.forEach(placed => {
        // 소스 타입 판별 (music or ambience)
        // 여기서는 sourceId로 판별 (예: 'music-', 'amb-' 등)
        const isMusic = placed.sourceId.includes('music') || placed.sourceId.includes('bgm');

        console.log(`  - ${placed.sourceId} at (${placed.x}, ${placed.y}) [${isMusic ? 'MUSIC' : 'AMBIENCE (3D)'}]`);

        // 실제 오디오 재생 로직 (오디오 파일 준비 시 구현):
        //
        // 1. AudioBuffer 로드:
        //    const response = await fetch(`/audio/${selectedPack}/${placed.sourceId}.mp3`);
        //    const arrayBuffer = await response.arrayBuffer();
        //    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        //
        // 2. AudioBufferSourceNode 생성:
        //    const source = audioContext.createBufferSource();
        //    source.buffer = audioBuffer;
        //    source.loop = true;
        //
        // 3. GainNode 생성 (개별 볼륨 조절용):
        //    const gainNode = audioContext.createGain();
        //    gainNode.gain.value = placed.volume * (placed.muted ? 0 : 1);
        //
        // 4. 오디오 그래프 연결:
        //    if (isMusic) {
        //      // BGM: 3D 없이 바로 연결
        //      source.connect(gainNode);
        //      gainNode.connect(musicGainRef.current);
        //    } else {
        //      // AMBIENCE: 3D PannerNode 통과
        //      const panner = create3DPanner(placed.id, placed.x, placed.y);
        //      source.connect(gainNode);
        //      gainNode.connect(panner);
        //      panner.connect(ambienceGainRef.current);
        //    }
        //
        // 5. 재생 시작:
        //    source.start(0);
        //    sourceNodesRef.current.set(placed.id, source);
        //    gainNodesRef.current.set(placed.id, gainNode);
      });

    } else {
      // Stop all playing sources
      sourceNodesRef.current.forEach(node => {
        try {
          node.stop();
        } catch (e) {
          // Already stopped
        }
      });
      sourceNodesRef.current.clear();
      gainNodesRef.current.clear();
      pannerNodesRef.current.clear();
    }
  }, [isPlaying, currentSlot, selectedPack, scenes]);

  return {
    audioContext: audioContextRef.current,
    create3DPanner,
    update3DPosition,
    canvasTo3D,
  };
}
