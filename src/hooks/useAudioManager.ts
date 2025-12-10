import { useEffect, useRef } from 'react';
import { PlacedSourceData, SceneSlot, PackType } from '../App';

type PackScenes = Record<PackType, SceneSlot[]>;

export interface ListenerPosition {
  x: number;
  y: number;
  z: number;
}

// Adventure Pack ambience audio file mapping
const AMBIENCE_MAP: Record<string, string> = {
  'adv-footstep': 'mininore_AdventurePack_02footstep.wav',
  'adv-birds': 'mininore_AdventurePack_03Birds.wav',
  'adv-horse': 'mininore_AdventurePack_04Horse.wav',
  'adv-walla': 'mininore_AdventurePack_05Walla.wav',
  'adv-river': 'mininore_AdventurePack_06River.wav',
  'adv-buggy': 'mininore_AdventurePack_07Buggy.wav',
  'adv-sheep': 'mininore_AdventurePack_08Sheep.wav',
  'adv-wolf': 'mininore_AdventurePack_09Wolf.wav',
  'adv-night': 'mininore_AdventurePack_10night.wav',
  'adv-frog': 'mininore_AdventurePack_11frog.wav',
};

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
  const audioBuffersRef = useRef<Map<string, AudioBuffer>>(new Map());
  const mainAmbienceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const preloadedRef = useRef<boolean>(false);

  // 2D 캔버스 좌표 → 3D 오디오 공간 변환
  const canvasTo3D = (x: number, y: number, depth: number = 0): ListenerPosition => {
    // X: -5m ~ +5m (좌우) - 왼쪽이 음수, 오른쪽이 양수
    const x3d = (x / canvasWidth) * 10 - 5;

    // Y: 1.6m 고정 (귀 높이)
    const y3d = 1.6;

    // Z: 0 ~ 10m (위쪽이 가깝고 아래쪽이 멀도록)
    // depth: -1 (앞으로 5m) ~ 0 (기본) ~ 1 (뒤로 5m)
    const baseZ = (y / canvasHeight) * 10;
    const z3d = baseZ + (depth * 5);

    return { x: x3d, y: y3d, z: z3d };
  };

  // Load audio file
  const loadAudioFile = async (url: string): Promise<AudioBuffer | null> => {
    if (!audioContextRef.current) return null;

    // Check cache first
    if (audioBuffersRef.current.has(url)) {
      return audioBuffersRef.current.get(url)!;
    }

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      audioBuffersRef.current.set(url, audioBuffer);
      return audioBuffer;
    } catch (error) {
      console.error(`Failed to load audio: ${url}`, error);
      return null;
    }
  };

  // Preload all audio files for instant playback
  const preloadAllAudio = async () => {
    if (!audioContextRef.current || preloadedRef.current) return;

    const allUrls = [
      '/ambient/01AdventurePack/mininore_AdventurePack_01Mainambience.wav',
      ...Object.values(AMBIENCE_MAP).map(fileName => `/ambient/01AdventurePack/${fileName}`)
    ];

    await Promise.all(allUrls.map(url => loadAudioFile(url)));
    preloadedRef.current = true;
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
        listener.positionZ.value = 5; // 화면 밖에서 화면을 바라봄
        listener.forwardX.value = 0;
        listener.forwardY.value = 0;
        listener.forwardZ.value = -1; // 앞쪽(화면 안쪽) 바라봄
        listener.upX.value = 0;
        listener.upY.value = 1;
        listener.upZ.value = 0;
      } else {
        // Legacy API (fallback)
        listener.setPosition(0, 1.6, 5);
        listener.setOrientation(0, 0, -1, 0, 1, 0);
      }

      // Preload all audio files for instant playback
      preloadAllAudio();
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

  // Main ambience background auto-play (Adventure Pack only)
  useEffect(() => {
    if (!audioContextRef.current || !ambienceGainRef.current) return;

    // Stop main ambience if conditions are not met
    if (selectedPack !== 'adventure' || ambienceMuted || !isPlaying) {
      if (mainAmbienceNodeRef.current) {
        try {
          mainAmbienceNodeRef.current.stop();
          mainAmbienceNodeRef.current.disconnect();
        } catch (e) {
          // Already stopped
        }
        mainAmbienceNodeRef.current = null;
      }
      return;
    }

    // Don't restart if already playing
    if (mainAmbienceNodeRef.current) {
      return;
    }

    const playMainAmbience = async () => {
      // Resume audio context if needed
      if (audioContextRef.current!.state === 'suspended') {
        await audioContextRef.current!.resume();
      }

      const mainAmbienceUrl = '/ambient/01AdventurePack/mininore_AdventurePack_01Mainambience.wav';
      const buffer = await loadAudioFile(mainAmbienceUrl);

      if (!buffer || !audioContextRef.current || !ambienceGainRef.current) return;

      // Create and play main ambience with explicit infinite loop
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(ambienceGainRef.current);
      source.start(0);

      mainAmbienceNodeRef.current = source;
    };

    playMainAmbience();
  }, [selectedPack, ambienceMuted, isPlaying]);

  // Create 3D panner node for ambience (앰비언스만 3D 적용)
  const create3DPanner = (sourceId: string, x: number, y: number, depth: number = 0): PannerNode | null => {
    if (!audioContextRef.current) return null;

    const panner = audioContextRef.current.createPanner();

    // 3D 오디오 설정
    panner.panningModel = 'HRTF'; // 인간 청각 모델 (가장 정확한 3D 사운드)
    panner.distanceModel = 'inverse'; // 거리 감쇠 모델
    panner.refDistance = 3; // 거리 감쇠 시작 거리 (1 -> 3, 3배)
    panner.maxDistance = 60; // 최대 거리 (20 -> 60, 3배)
    panner.rolloffFactor = 0.5; // 거리 감쇠율 (1 -> 0.5, 더 천천히 감쇠)
    panner.coneInnerAngle = 360; // 전방향 소리
    panner.coneOuterAngle = 360;
    panner.coneOuterGain = 0.5;

    // 2D 좌표 → 3D 위치 변환 (depth 포함)
    const pos3d = canvasTo3D(x, y, depth);

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
  const update3DPosition = (sourceId: string, x: number, y: number, depth: number = 0) => {
    const panner = pannerNodesRef.current.get(sourceId);
    if (!panner) return;

    const pos3d = canvasTo3D(x, y, depth);

    if (panner.positionX) {
      panner.positionX.value = pos3d.x;
      panner.positionY.value = pos3d.y;
      panner.positionZ.value = pos3d.z;
    } else {
      panner.setPosition(pos3d.x, pos3d.y, pos3d.z);
    }
  };

  // Stop all audio sources
  const stopAllAudio = () => {
    sourceNodesRef.current.forEach((node, id) => {
      try {
        node.stop();
        node.disconnect(); // Prevent memory leak
      } catch (e) {
        // Already stopped
      }
    });

    // Disconnect gain nodes
    gainNodesRef.current.forEach(node => {
      try {
        node.disconnect();
      } catch (e) {
        // Already disconnected
      }
    });

    // Disconnect panner nodes
    pannerNodesRef.current.forEach(node => {
      try {
        node.disconnect();
      } catch (e) {
        // Already disconnected
      }
    });

    sourceNodesRef.current.clear();
    gainNodesRef.current.clear();
    pannerNodesRef.current.clear();
  };

  // Stop specific audio source
  const stopAudioSource = (sourceId: string) => {
    const sourceNode = sourceNodesRef.current.get(sourceId);
    const gainNode = gainNodesRef.current.get(sourceId);
    const pannerNode = pannerNodesRef.current.get(sourceId);

    if (sourceNode) {
      try {
        sourceNode.stop();
        sourceNode.disconnect();
      } catch (e) {
        // Already stopped
      }
      sourceNodesRef.current.delete(sourceId);
    }

    if (gainNode) {
      try {
        gainNode.disconnect();
      } catch (e) {
        // Already disconnected
      }
      gainNodesRef.current.delete(sourceId);
    }

    if (pannerNode) {
      try {
        pannerNode.disconnect();
      } catch (e) {
        // Already disconnected
      }
      pannerNodesRef.current.delete(sourceId);
    }
  };

  // Handle playback - unified effect for all audio management
  useEffect(() => {
    if (!audioContextRef.current || !musicGainRef.current || !ambienceGainRef.current) return;

    const manageAudio = async () => {
      const currentPackScenes = scenes[selectedPack];
      const currentScene = currentPackScenes[currentSlot];

      // If not playing, stop all audio
      if (!isPlaying) {
        stopAllAudio();
        return;
      }

      // Resume audio context if suspended
      if (audioContextRef.current!.state === 'suspended') {
        await audioContextRef.current!.resume();
      }

      // Get pack prefix
      const packPrefix = selectedPack === 'adventure' ? 'adv-'
                       : selectedPack === 'combat' ? 'cmb-'
                       : 'shl-';

      // Get current scene's source IDs
      const currentSourceIds = new Set(
        currentScene.placedSources
          .filter(s => s.sourceId.startsWith(packPrefix))
          .map(s => s.id)
      );

      // Stop audio for sources that are no longer in the scene
      sourceNodesRef.current.forEach((_, id) => {
        if (!currentSourceIds.has(id)) {
          stopAudioSource(id);
        }
      });

      // Process each source in current scene
      for (const placed of currentScene.placedSources) {
        // Skip if not from current pack
        if (!placed.sourceId.startsWith(packPrefix)) continue;

        // If already playing, just update properties
        if (sourceNodesRef.current.has(placed.id)) {
          const gainNode = gainNodesRef.current.get(placed.id);
          if (gainNode) {
            gainNode.gain.value = placed.volume * (placed.muted ? 0 : 1);
          }
          if (pannerNodesRef.current.has(placed.id)) {
            update3DPosition(placed.id, placed.x, placed.y, placed.depth || 0);
          }
          continue;
        }

        // Determine source type
        const isMusic = placed.sourceId.includes('music') ||
                       placed.sourceId.includes('hero') ||
                       placed.sourceId.includes('drums') ||
                       placed.sourceId.includes('melody') ||
                       placed.sourceId.includes('rhythm');

        // Map sourceId to file name
        let audioUrl = '';
        if (selectedPack === 'adventure' && !isMusic) {
          const fileName = AMBIENCE_MAP[placed.sourceId];
          if (fileName) {
            audioUrl = `/ambient/01AdventurePack/${fileName}`;
          }
        }

        // Skip if no audio file available
        if (!audioUrl) continue;

        // Load audio buffer
        const buffer = await loadAudioFile(audioUrl);
        if (!buffer || !audioContextRef.current) continue;

        // Create source node with explicit loop
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        // Create gain node
        const gainNode = audioContextRef.current.createGain();
        gainNode.gain.value = placed.volume * (placed.muted ? 0 : 1);

        // Connect audio graph
        if (isMusic) {
          source.connect(gainNode);
          gainNode.connect(musicGainRef.current!);
        } else {
          const panner = create3DPanner(placed.id, placed.x, placed.y, placed.depth || 0);
          if (panner) {
            source.connect(gainNode);
            gainNode.connect(panner);
            panner.connect(ambienceGainRef.current!);
          }
        }

        // Start playback
        source.start(0);
        sourceNodesRef.current.set(placed.id, source);
        gainNodesRef.current.set(placed.id, gainNode);
      }
    };

    manageAudio();
  }, [scenes, isPlaying, currentSlot, selectedPack]);

  return {
    audioContext: audioContextRef.current,
    create3DPanner,
    update3DPosition,
    canvasTo3D,
  };
}
