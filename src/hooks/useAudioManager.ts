import { useEffect, useRef } from 'react';
import { PlacedSourceData, SceneSlot, PackType } from '../App';

interface AudioManagerProps {
  scenes: SceneSlot[];
  currentSlot: number;
  isPlaying: boolean;
  selectedPack: PackType;
  masterVolume: number;
  musicVolume: number;
  ambienceVolume: number;
  musicMuted: boolean;
  ambienceMuted: boolean;
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
}: AudioManagerProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const ambienceGainRef = useRef<GainNode | null>(null);
  const sourceNodesRef = useRef<Map<string, AudioBufferSourceNode>>(new Map());
  const pannerNodesRef = useRef<Map<string, StereoPannerNode>>(new Map());

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
    }

    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

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

  // Update panning based on position
  const updatePanning = (placed: PlacedSourceData, canvasWidth: number, canvasHeight: number) => {
    if (!audioContextRef.current) return;

    const pannerId = placed.id;
    let panner = pannerNodesRef.current.get(pannerId);

    if (!panner) {
      panner = audioContextRef.current.createStereoPanner();
      pannerNodesRef.current.set(pannerId, panner);
    }

    // Calculate panning: -1 (left) to 1 (right) based on X position
    const panValue = (placed.x / canvasWidth) * 2 - 1;
    panner.pan.value = Math.max(-1, Math.min(1, panValue));

    // TODO: Implement vertical panning when audio files are available
    // For now, we only do stereo left-right panning
  };

  // Handle playback - Pack separation
  useEffect(() => {
    if (!audioContextRef.current) return;

    if (isPlaying) {
      // Resume audio context if suspended
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      const currentScene = scenes[currentSlot];

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
      // For each source in packSources:
      // 1. Load audio file: /audio/{selectedPack}/{sourceId}.mp3
      // 2. Create AudioBufferSourceNode
      // 3. Apply volume (from placed.volume)
      // 4. Apply panning (based on placed.x, placed.y)
      // 5. Connect to appropriate gain node (music or ambience)
      // 6. Start playback with loop

      packSources.forEach(placed => {
        // This will be implemented when audio files are ready
        console.log(`  - ${placed.sourceId} at (${placed.x}, ${placed.y})`);
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
      pannerNodesRef.current.clear();
    }
  }, [isPlaying, currentSlot, selectedPack, scenes]);

  return {
    audioContext: audioContextRef.current,
    updatePanning,
  };
}
