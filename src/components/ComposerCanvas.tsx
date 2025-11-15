import { useState } from 'react';
import { Source, PlacedSourceData, PackType, SceneSlot } from '../App';
import { PlacedSource } from './PlacedSource';
import { getPackSources } from '../data/sources';
import { Play, Pause, PlayCircle, PauseCircle } from 'lucide-react';

interface ComposerCanvasProps {
  canvasRef: React.RefObject<HTMLDivElement>;
  selectedPack: PackType;
  placedSources: PlacedSourceData[];
  isPlaying: boolean;
  isPlayingAll: boolean;
  scenes: SceneSlot[];
  currentSlot: number;
  onSelectSlot: (slot: number) => void;
  onPlaceSource: (source: Source, x: number, y: number) => void;
  onRemoveSource: (id: string) => void;
  onMoveSource: (id: string, x: number, y: number) => void;
  onToggleMute: (id: string) => void;
  onTogglePlay: () => void;
  onTogglePlayAll: () => void;
}

export function ComposerCanvas({
  canvasRef,
  selectedPack,
  placedSources,
  isPlaying,
  isPlayingAll,
  scenes,
  currentSlot,
  onSelectSlot,
  onPlaceSource,
  onRemoveSource,
  onMoveSource,
  onToggleMute,
  onTogglePlay,
  onTogglePlayAll,
}: ComposerCanvasProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const sources = getPackSources(selectedPack);
  const hasPlacedSources = placedSources.length > 0;

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if it's a placed source being moved
    const placedId = e.dataTransfer.getData('placedId');
    if (placedId) {
      onMoveSource(placedId, x, y);
      setDraggingId(null);
      return;
    }

    // Otherwise it's a new source being placed
    const sourceData = e.dataTransfer.getData('source');
    if (sourceData) {
      const source = JSON.parse(sourceData) as Source;
      onPlaceSource(source, x, y);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Set dropEffect based on what's being dragged
    const placedId = e.dataTransfer.types.includes('placedid');
    e.dataTransfer.dropEffect = placedId ? 'move' : 'copy';
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handlePlacedDragStart = (id: string) => {
    setDraggingId(id);
  };

  const handlePlacedDragEnd = (e: React.DragEvent, id: string) => {
    const canvas = e.currentTarget.parentElement;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x > 0 && y > 0 && x < rect.width && y < rect.height) {
        onMoveSource(id, x, y);
      }
    }
    setDraggingId(null);
  };

  const getPackBackgroundImage = () => {
    switch (selectedPack) {
      case 'adventure':
        return '/adventure-bg.png';
      case 'combat':
        return '/combat-bg.png';
      case 'shelter':
        return '/shelter-bg.png';
    }
  };

  // Calculate opacity: lighter when dragging, darker when empty
  const getBackgroundOpacity = () => {
    if (isDraggingOver) return 0.3; // Light when dragging
    if (!hasPlacedSources) return 0.7; // Darker when empty
    return 0.5; // Normal when has sources
  };

  return (
    <div className="flex-1 p-6 relative flex flex-col">
      {/* Controls and 16 Slot Sequencer in one row */}
      <div className="flex gap-3 mb-4">
        {/* 16 Slot Sequencer - Unified Bar */}
        <div className="flex-1 bg-white/60 backdrop-blur-sm rounded-xl border-2 border-yellow-200 shadow-lg overflow-hidden">
          <div className="flex h-12">
            {scenes.map((scene, index) => {
              const isEmpty = scene.placedSources.length === 0;
              const isActive = currentSlot === index;

              return (
                <button
                  key={scene.id}
                  onClick={() => onSelectSlot(index)}
                  className={`
                    flex-1 flex items-center justify-center
                    font-bold text-sm transition-all
                    border-r border-yellow-200 last:border-r-0
                    ${isActive
                      ? 'bg-gradient-to-br from-amber-600 to-orange-600 text-gray-800 shadow-inner'
                      : isEmpty
                      ? 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      : 'bg-white text-gray-700 hover:bg-yellow-50'
                    }
                    ${isPlaying && isActive ? 'animate-pulse' : ''}
                  `}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-3">
          {/* Current Scene Play/Pause */}
          <button
            onClick={onTogglePlay}
            disabled={!hasPlacedSources || isPlayingAll}
            className={`
              px-6 py-3 rounded-2xl flex items-center gap-2 transition-all border-2
              ${hasPlacedSources && !isPlayingAll
                ? 'bg-gradient-to-r from-amber-300 to-yellow-300 text-white hover:shadow-xl hover:scale-105 border-white shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed border-gray-300'
              }
            `}
          >
            {isPlaying && !isPlayingAll ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>

          {/* Full Sequence Play/Pause (All Scenes 1-16) */}
          <button
            onClick={onTogglePlayAll}
            className={`
              px-6 py-3 rounded-2xl flex items-center gap-2 transition-all border-2
              ${isPlayingAll
                ? 'bg-gradient-to-r from-orange-400 to-red-400 hover:shadow-xl hover:scale-105 border-white shadow-lg'
                : 'bg-gradient-to-r from-purple-400 to-pink-400 hover:shadow-xl hover:scale-105 border-white shadow-lg'
              }
            `}
          >
            {isPlayingAll ? <PauseCircle className="w-6 h-6 text-yellow-700" /> : <PlayCircle className="w-6 h-6 text-yellow-700" />}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className="flex-1 rounded-3xl border-2 border-dashed border-yellow-200 relative overflow-hidden shadow-inner"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Background Image with dynamic opacity */}
        <div
          className="absolute inset-0 bg-center transition-opacity duration-300"
          style={{
            backgroundImage: `url(${getPackBackgroundImage()})`,
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            opacity: getBackgroundOpacity(),
          }}
        />

        {/* Overlay for better contrast */}
        <div className="absolute inset-0 bg-white/10" />

        {/* Decorative corners */}
        <div className="absolute top-4 left-4 w-10 h-10 border-t-2 border-l-2 border-yellow-200 rounded-tl-2xl z-10" />
        <div className="absolute top-4 right-4 w-10 h-10 border-t-2 border-r-2 border-yellow-200 rounded-tr-2xl z-10" />
        <div className="absolute bottom-4 left-4 w-10 h-10 border-b-2 border-l-2 border-yellow-200 rounded-bl-2xl z-10" />
        <div className="absolute bottom-4 right-4 w-10 h-10 border-b-2 border-r-2 border-yellow-200 rounded-br-2xl z-10" />

        {/* Empty state */}
        {placedSources.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="text-center text-white drop-shadow-lg">
              <p className="text-xl font-bold">Drag and drop sources here!</p>
              <p className="text-sm mt-2">Create your magical soundscape</p>
            </div>
          </div>
        )}

        {/* Placed sources */}
        {placedSources.map((placed) => {
          const source = sources.find(s => s.id === placed.sourceId);
          if (!source) return null;

          return (
            <PlacedSource
              key={placed.id}
              placed={placed}
              source={source}
              isPlaying={isPlaying}
              isDragging={draggingId === placed.id}
              onRemove={() => onRemoveSource(placed.id)}
              onToggleMute={() => onToggleMute(placed.id)}
              onDragStart={() => handlePlacedDragStart(placed.id)}
              onDragEnd={(e) => handlePlacedDragEnd(e, placed.id)}
            />
          );
        })}
      </div>
    </div>
  );
}