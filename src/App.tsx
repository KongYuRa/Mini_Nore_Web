import { useState, useEffect, useRef } from 'react';
import { SourcePanel } from './components/SourcePanel';
import { ComposerCanvas } from './components/ComposerCanvas';
import { AIRecommendations } from './components/AIRecommendations';
import { useAudioManager } from './hooks/useAudioManager';
import { useHistory } from './hooks/useHistory';
import { getPackSources } from './data/sources';
import { CompositionResponse, CompositionData, apiService } from './services/api';
import { Sparkles } from 'lucide-react';
import { Button } from './components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './components/ui/dialog';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';

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
  const [showAIRecommendations, setShowAIRecommendations] = useState(false);

  const scenes = allPackScenes[selectedPack];
  const canvasRef = useRef<HTMLDivElement>(null);
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
    // Toggle mute only in current scene (per-scene for both music and ambience)
    setAllPackScenes({
      ...allPackScenes,
      [selectedPack]: scenes.map(scene =>
        scene.id === currentSlot
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
    // Remove only from current scene (per-scene for both music and ambience)
    setAllPackScenes({
      ...allPackScenes,
      [selectedPack]: scenes.map(scene =>
        scene.id === currentSlot
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

  const handleTogglePlayAll = async () => {
    if (isPlayingAll) {
      // Stop full playback
      setIsPlayingAll(false);
      setIsPlaying(false);
    } else {
      // Start full playback from beginning
      setCurrentSlot(0);
      setIsPlayingAll(true);
      setIsPlaying(true);

      // 자동 저장 (전체 재생 시작할 때)
      if (currentScene.placedSources.length > 0) {
        try {
          await apiService.saveComposition(getCurrentComposition());
          toast.success('작품이 자동 저장되었습니다', {
            duration: 2000,
          });
        } catch (error) {
          // 저장 실패해도 재생은 계속
          console.log('Auto-save failed (server may be offline):', error);
        }
      }
    }
  };


  // AI 추천 composition 로드
  const handleLoadAIComposition = (composition: CompositionResponse) => {
    setAllPackScenes({
      ...allPackScenes,
      [selectedPack]: composition.scenes,
    });
    setShowAIRecommendations(false);
  };

  // 현재 composition을 API 형식으로 변환
  const getCurrentComposition = (): CompositionData => {
    return {
      pack: selectedPack,
      scenes: scenes,
      masterVolume,
      musicVolume,
      ambienceVolume,
    };
  };

  return (
    <>
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

        {/* AI 추천 버튼 (우측 하단) */}
        <div className="absolute bottom-6 right-6 z-10">
          <Button
            onClick={() => setShowAIRecommendations(true)}
            className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg"
          >
            <Sparkles className="w-4 h-4" />
            AI 추천
          </Button>
        </div>
      </div>

      {/* AI 추천 모달 */}
      <Dialog open={showAIRecommendations} onOpenChange={setShowAIRecommendations}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              AI가 추천하는 {selectedPack.charAt(0).toUpperCase() + selectedPack.slice(1)} 작품
            </DialogTitle>
          </DialogHeader>
          <AIRecommendations
            pack={selectedPack}
            onLoadComposition={handleLoadAIComposition}
          />
        </DialogContent>
      </Dialog>

      {/* Toast 알림 */}
      <Toaster />
    </>
  );
}
