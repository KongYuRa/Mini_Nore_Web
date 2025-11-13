import { useState, useEffect } from 'react';
import { SourcePanel } from './components/SourcePanel';
import { ComposerCanvas } from './components/ComposerCanvas';
import { useAudioManager } from './hooks/useAudioManager';
import { useHistory } from './hooks/useHistory';

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
}

export interface SceneSlot {
  id: number;
  placedSources: PlacedSourceData[];
}

export type PackType = 'adventure' | 'combat' | 'shelter';

const initialScenes: SceneSlot[] = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  placedSources: [],
}));

export default function App() {
  const [selectedPack, setSelectedPack] = useState<PackType>('adventure');
  const {
    state: scenes,
    setState: setScenes,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistory<SceneSlot[]>(initialScenes);
  const [currentSlot, setCurrentSlot] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Volume controls
  const [masterVolume, setMasterVolume] = useState(1);
  const [musicVolume, setMusicVolume] = useState(1);
  const [ambienceVolume, setAmbienceVolume] = useState(1);
  const [musicMuted, setMusicMuted] = useState(false);
  const [ambienceMuted, setAmbienceMuted] = useState(false);

  // Audio manager
  useAudioManager({
    scenes,
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
    };

    setScenes(scenes.map(scene =>
      scene.id === currentSlot
        ? { ...scene, placedSources: [...scene.placedSources, newPlaced] }
        : scene
    ));
  };

  const handleRemoveSource = (id: string) => {
    setScenes(scenes.map(scene =>
      scene.id === currentSlot
        ? { ...scene, placedSources: scene.placedSources.filter(s => s.id !== id) }
        : scene
    ));
  };

  const handleMoveSource = (id: string, x: number, y: number) => {
    setScenes(scenes.map(scene =>
      scene.id === currentSlot
        ? {
            ...scene,
            placedSources: scene.placedSources.map(s =>
              s.id === id ? { ...s, x, y } : s
            )
          }
        : scene
    ));
  };

  const handleClearAll = () => {
    // Get prefix for current pack
    const packPrefix = selectedPack === 'adventure' ? 'adv-'
                     : selectedPack === 'combat' ? 'cmb-'
                     : 'shl-';

    // Remove only sources from current pack in current slot
    setScenes(scenes.map(scene =>
      scene.id === currentSlot
        ? {
            ...scene,
            placedSources: scene.placedSources.filter(s => !s.sourceId.startsWith(packPrefix))
          }
        : scene
    ));
    setIsPlaying(false);
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 overflow-hidden flex">
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
      />

      {/* Composer Canvas - Right */}
      <ComposerCanvas
        selectedPack={selectedPack}
        placedSources={currentScene.placedSources}
        isPlaying={isPlaying}
        scenes={scenes}
        currentSlot={currentSlot}
        onSelectSlot={setCurrentSlot}
        onPlaceSource={handlePlaceSource}
        onRemoveSource={handleRemoveSource}
        onMoveSource={handleMoveSource}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onClear={handleClearAll}
      />
    </div>
  );
}
