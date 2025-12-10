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

  // Convert 2D canvas coordinates to 3D audio space
  const canvasTo3D = (x: number, y: number, depth: number = 0): ListenerPosition => {
    return {
      x: (x / canvasWidth) * 10 - 5, // -5m to +5m (left to right)
      y: 1.6, // Ear height
      z: (y / canvasHeight) * 10 + (depth * 5) // 0-10m + depth offset
    };
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
    if (audioContextRef.current) return;

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = ctx;

    // Create and connect gain nodes
    masterGainRef.current = ctx.createGain();
    musicGainRef.current = ctx.createGain();
    ambienceGainRef.current = ctx.createGain();

    musicGainRef.current.connect(masterGainRef.current);
    ambienceGainRef.current.connect(masterGainRef.current);
    masterGainRef.current.connect(ctx.destination);

    // Set listener position and orientation
    const listener = ctx.listener;
    if (listener.positionX) {
      listener.positionX.value = 0;
      listener.positionY.value = 1.6;
      listener.positionZ.value = 5;
      listener.forwardX.value = 0;
      listener.forwardY.value = 0;
      listener.forwardZ.value = -1;
      listener.upX.value = 0;
      listener.upY.value = 1;
      listener.upZ.value = 0;
    } else {
      listener.setPosition(0, 1.6, 5);
      listener.setOrientation(0, 0, -1, 0, 1, 0);
    }

    preloadAllAudio();

    return () => {
      if (ctx.state !== 'closed') ctx.close();
    };
  }, []);

  // Update listener position
  useEffect(() => {
    if (!audioContextRef.current || !listenerPosition) return;

    const { listener } = audioContextRef.current;
    const { x, y, z } = listenerPosition;

    if (listener.positionX) {
      listener.positionX.value = x;
      listener.positionY.value = y;
      listener.positionZ.value = z;
    } else {
      listener.setPosition(x, y, z);
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

  // Create 3D panner node for spatial audio
  const create3DPanner = (sourceId: string, x: number, y: number, depth: number = 0): PannerNode | null => {
    if (!audioContextRef.current) return null;

    const panner = audioContextRef.current.createPanner();

    // Configure 3D audio with tighter spatial range
    Object.assign(panner, {
      panningModel: 'HRTF',
      distanceModel: 'inverse',
      refDistance: 1,
      maxDistance: 20,
      rolloffFactor: 1.5,
      coneInnerAngle: 360,
      coneOuterAngle: 360,
      coneOuterGain: 0.5
    });

    // Set position
    const { x: x3d, y: y3d, z: z3d } = canvasTo3D(x, y, depth);
    if (panner.positionX) {
      panner.positionX.value = x3d;
      panner.positionY.value = y3d;
      panner.positionZ.value = z3d;
    } else {
      panner.setPosition(x3d, y3d, z3d);
    }

    pannerNodesRef.current.set(sourceId, panner);
    return panner;
  };

  // Update 3D position when source is moved
  const update3DPosition = (sourceId: string, x: number, y: number, depth: number = 0) => {
    const panner = pannerNodesRef.current.get(sourceId);
    if (!panner) return;

    const { x: x3d, y: y3d, z: z3d } = canvasTo3D(x, y, depth);
    if (panner.positionX) {
      panner.positionX.value = x3d;
      panner.positionY.value = y3d;
      panner.positionZ.value = z3d;
    } else {
      panner.setPosition(x3d, y3d, z3d);
    }
  };

  // Stop all audio sources and disconnect nodes
  const stopAllAudio = () => {
    const disconnect = (node: AudioNode) => {
      try { node.disconnect(); } catch (e) { /* Already disconnected */ }
    };

    sourceNodesRef.current.forEach(node => {
      try { node.stop(); } catch (e) { /* Already stopped */ }
      disconnect(node);
    });
    gainNodesRef.current.forEach(disconnect);
    pannerNodesRef.current.forEach(disconnect);

    sourceNodesRef.current.clear();
    gainNodesRef.current.clear();
    pannerNodesRef.current.clear();
  };

  // Stop specific audio source and clean up
  const stopAudioSource = (sourceId: string) => {
    const sourceNode = sourceNodesRef.current.get(sourceId);
    const gainNode = gainNodesRef.current.get(sourceId);
    const pannerNode = pannerNodesRef.current.get(sourceId);

    const disconnect = (node: AudioNode | undefined) => {
      if (!node) return;
      try { node.disconnect(); } catch (e) { /* Already disconnected */ }
    };

    if (sourceNode) {
      try { sourceNode.stop(); } catch (e) { /* Already stopped */ }
      disconnect(sourceNode);
      sourceNodesRef.current.delete(sourceId);
    }
    if (gainNode) {
      disconnect(gainNode);
      gainNodesRef.current.delete(sourceId);
    }
    if (pannerNode) {
      disconnect(pannerNode);
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
          // Update 3D position if panner exists
          if (pannerNodesRef.current.has(placed.id)) {
            update3DPosition(placed.id, placed.x, placed.y, placed.depth || 0);
          }
          continue;
        }

        // Get audio URL for Adventure Pack ambience only (music not yet implemented)
        const fileName = AMBIENCE_MAP[placed.sourceId];
        if (!fileName) continue; // Skip if no audio file available

        const audioUrl = `/ambient/01AdventurePack/${fileName}`;

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

        // Connect with 3D spatial audio
        const panner = create3DPanner(placed.id, placed.x, placed.y, placed.depth || 0);
        if (panner) {
          source.connect(gainNode);
          gainNode.connect(panner);
          panner.connect(ambienceGainRef.current!);

          // Start playback
          source.start(0);
          sourceNodesRef.current.set(placed.id, source);
          gainNodesRef.current.set(placed.id, gainNode);
        }
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
