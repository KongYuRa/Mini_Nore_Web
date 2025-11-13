import { useState, useEffect, useRef } from 'react';
import { SourcePanel } from './components/SourcePanel';
import { ComposerCanvas } from './components/ComposerCanvas';
import { useAudioManager } from './hooks/useAudioManager';
import { useHistory } from './hooks/useHistory';
import { getPackSources } from './data/sources';

export interface Source {
  id: string;
  name: string;
  type: 'music' | 'ambience';
  icon: string;
  color: string;
}

export interface PlacedSourceData {
  id: string;
  sourceId: string;
  x: number;
  y: number;
  volume: number;
  muted?: boolean;
}

export interface SceneSlot {
  id: number;
  placedSources: PlacedSourceData[];
}

export type PackType = 'adventure' | 'combat' | 'shelter';

type PackScenes = Record<PackType, SceneSlot[]>;

const createInitialScenes = (): SceneSlot[] =>
  Array.from({ length: 16 }, (_, i) => ({
    id: i,
    placedSources: [],
  }));

const initialPackScenes: PackScenes = {
  adventure: createInitialScenes(),
  combat: createInitialScenes(),
  shelter: createInitialScenes(),
};

export default function App() {
  const [selectedPack, setSelectedPack] = useState<PackType>('adventure');
  const {
    state: allPackScenes,
    setState: setAllPackScenes,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistory<PackScenes>(initialPackScenes);
  const [currentSlot, setCurrentSlot] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayingAll, setIsPlayingAll] = useState(false);

  const scenes = allPackScenes[selectedPack];
  const canvasRef = useRef<HTMLDivElement>(null);
  const touchDragSourceRef = useRef<Source | null>(null);
  const playAllIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Volume controls
  const [masterVolume, setMasterVolume] = useState(1);
  const [musicVolume, setMusicVolume] = useState(1);
  const [ambienceVolume, setAmbienceVolume] = useState(1);
  const [musicMuted, setMusicMuted] = useState(false);
  const [ambienceMuted, setAmbienceMuted] = useState(false);

  // Audio manager
  useAudioManager({
    scenes: allPackScenes,
    currentSlot,
    isPlaying,
    selectedPack,
    masterVolume,
    musicVolume,
    ambienceVolume,
    musicMuted,
    ambienceMuted,
  });

  const currentScene = scenes[currentSlot];

  // Handle full playback (all scenes in sequence)
  useEffect(() => {
    if (isPlayingAll) {
      setIsPlaying(true);

      // Auto-advance to next scene every 4 seconds
      playAllIntervalRef.current = setInterval(() => {
        setCurrentSlot((prev) => {
          const next = prev + 1;
          if (next >= 16) {
            // Stop at the end
            setIsPlayingAll(false);
            setIsPlaying(false);
            return 0; // Return to first scene
          }
          return next;
        });
      }, 4000); // 4 seconds per scene

      return () => {
        if (playAllIntervalRef.current) {
          clearInterval(playAllIntervalRef.current);
          playAllIntervalRef.current = null;
        }
      };
    } else {
      // Clean up interval when stopping
      if (playAllIntervalRef.current) {
        clearInterval(playAllIntervalRef.current);
        playAllIntervalRef.current = null;
      }
    }
  }, [isPlayingAll]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space: Play/Pause (only if there are sources)
      if (e.code === 'Space' && currentScene.placedSources.length > 0) {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      }

      // Ctrl+Z: Undo
      if (e.ctrlKey && e.code === 'KeyZ' && !e.shiftKey && canUndo) {
        e.preventDefault();
        undo();
      }

      // Ctrl+Shift+Z or Ctrl+Y: Redo
      if (((e.ctrlKey && e.shiftKey && e.code === 'KeyZ') || (e.ctrlKey && e.code === 'KeyY')) && canRedo) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, canUndo, canRedo, undo, redo, currentScene.placedSources.length]);

  const handlePlaceSource = (source: Source, x: number, y: number) => {
    const newPlaced: PlacedSourceData = {
      id: `${source.id}-${Date.now()}`,
      sourceId: source.id,
      x,
      y,
      volume: 1,
      muted: false,
    };

    // If it's an ambience source, add to all scenes. If music, only current scene.
    setAllPackScenes({
      ...allPackScenes,
      [selectedPack]: scenes.map(scene =>
        source.type === 'ambience' || scene.id === currentSlot
          ? { ...scene, placedSources: [...scene.placedSources, newPlaced] }
          : scene
      )
    });
  };

  const handleToggleMute = (id: string) => {
    // Find the placed source to determine its type
    const placedSource = currentScene.placedSources.find(s => s.id === id);
    if (!placedSource) return;

    const packSources = getPackSources(selectedPack);
    const source = packSources.find(s => s.id === placedSource.sourceId);
    if (!source) return;

    // If it's an ambience source, toggle mute in all scenes. If music, only current scene.
    setAllPackScenes({
      ...allPackScenes,
      [selectedPack]: scenes.map(scene =>
        source.type === 'ambience' || scene.id === currentSlot
          ? {
              ...scene,
              placedSources: scene.placedSources.map(s =>
                s.id === id ? { ...s, muted: !s.muted } : s
              )
            }
          : scene
      )
    });
  };

  const handleRemoveSource = (id: string) => {
    // Find the placed source to determine its type
    const placedSource = currentScene.placedSources.find(s => s.id === id);
    if (!placedSource) return;

    const packSources = getPackSources(selectedPack);
    const source = packSources.find(s => s.id === placedSource.sourceId);
    if (!source) return;

    // If it's an ambience source, remove from all scenes. If music, only current scene.
    setAllPackScenes({
      ...allPackScenes,
      [selectedPack]: scenes.map(scene =>
        source.type === 'ambience' || scene.id === currentSlot
          ? { ...scene, placedSources: scene.placedSources.filter(s => s.id !== id) }
          : scene
      )
    });
  };

  const handleMoveSource = (id: string, x: number, y: number) => {
    // Find the placed source to determine its type
    const placedSource = currentScene.placedSources.find(s => s.id === id);
    if (!placedSource) return;

    const packSources = getPackSources(selectedPack);
    const source = packSources.find(s => s.id === placedSource.sourceId);
    if (!source) return;

    // If it's an ambience source, move in all scenes. If music, only current scene.
    setAllPackScenes({
      ...allPackScenes,
      [selectedPack]: scenes.map(scene =>
        source.type === 'ambience' || scene.id === currentSlot
          ? {
              ...scene,
              placedSources: scene.placedSources.map(s =>
                s.id === id ? { ...s, x, y } : s
              )
            }
          : scene
      )
    });
  };

  const handleTogglePlayAll = () => {
    if (isPlayingAll) {
      // Stop full playback
      setIsPlayingAll(false);
      setIsPlaying(false);
    } else {
      // Start full playback from beginning
      setCurrentSlot(0);
      setIsPlayingAll(true);
      setIsPlaying(true);
    }
  };

  // Touch drag handlers for SourceItem
  const handleSourceTouchDragStart = (source: Source) => {
    touchDragSourceRef.current = source;
  };

  const handleSourceTouchDragEnd = (x: number, y: number) => {
    if (!canvasRef.current || !touchDragSourceRef.current) {
      touchDragSourceRef.current = null;
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const relativeX = x - rect.left;
    const relativeY = y - rect.top;

    // Check if drop is within canvas bounds
    if (
      relativeX >= 0 &&
      relativeY >= 0 &&
      relativeX <= rect.width &&
      relativeY <= rect.height
    ) {
      handlePlaceSource(touchDragSourceRef.current, relativeX, relativeY);
    }

    touchDragSourceRef.current = null;
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 overflow-hidden flex select-none">
      {/* Source Panel - Left */}
      <SourcePanel
        selectedPack={selectedPack}
        placedSources={currentScene.placedSources}
        onSelectPack={setSelectedPack}
        masterVolume={masterVolume}
        musicVolume={musicVolume}
        ambienceVolume={ambienceVolume}
        musicMuted={musicMuted}
        ambienceMuted={ambienceMuted}
        onMasterVolumeChange={setMasterVolume}
        onMusicVolumeChange={setMusicVolume}
        onAmbienceVolumeChange={setAmbienceVolume}
        onMusicMutedChange={setMusicMuted}
        onAmbienceMutedChange={setAmbienceMuted}
        onTouchDragStart={handleSourceTouchDragStart}
        onTouchDragEnd={handleSourceTouchDragEnd}
      />

      {/* Composer Canvas - Right */}
      <ComposerCanvas
        canvasRef={canvasRef}
        selectedPack={selectedPack}
        placedSources={currentScene.placedSources}
        isPlaying={isPlaying}
        isPlayingAll={isPlayingAll}
        scenes={scenes}
        currentSlot={currentSlot}
        onSelectSlot={setCurrentSlot}
        onPlaceSource={handlePlaceSource}
        onRemoveSource={handleRemoveSource}
        onMoveSource={handleMoveSource}
        onToggleMute={handleToggleMute}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onTogglePlayAll={handleTogglePlayAll}
      />
    </div>
  );
}
