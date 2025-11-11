import { useState } from 'react';
import { Source, PlacedSourceData, PackType } from '../App';
import { PlacedSource } from './PlacedSource';
import { getPackSources } from '../data/sources';
import { Play, Pause, Trash2 } from 'lucide-react';

interface ComposerCanvasProps {
  selectedPack: PackType;
  placedSources: PlacedSourceData[];
  isPlaying: boolean;
  onPlaceSource: (source: Source, x: number, y: number) => void;
  onRemoveSource: (id: string) => void;
  onMoveSource: (id: string, x: number, y: number) => void;
  onTogglePlay: () => void;
  onClear: () => void;
}

export function ComposerCanvas({
  selectedPack,
  placedSources,
  isPlaying,
  onPlaceSource,
  onRemoveSource,
  onMoveSource,
  onTogglePlay,
  onClear,
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

    const sourceData = e.dataTransfer.getData('source');
    if (sourceData) {
      const source = JSON.parse(sourceData) as Source;
      onPlaceSource(source, x, y);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
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
      {/* Controls */}
      <div className="flex justify-end gap-3 mb-4">
        <button
          onClick={onTogglePlay}
          disabled={!hasPlacedSources}
          className={`
            px-6 py-3 rounded-2xl flex items-center gap-2 transition-all border-2
            ${hasPlacedSources
              ? 'bg-gradient-to-r from-amber-300 to-yellow-300 text-white hover:shadow-xl hover:scale-105 border-white shadow-lg'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed border-gray-300'
            }
          `}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
        
        <button
          onClick={onClear}
          disabled={!hasPlacedSources}
          className={`
            px-6 py-3 rounded-2xl flex items-center gap-2 transition-all border-2
            ${hasPlacedSources
              ? 'bg-white/80 text-red-500 hover:bg-red-50 shadow-md hover:scale-105 border-red-200'
              : 'bg-gray-100 text-gray-300 cursor-not-allowed border-gray-200'
            }
          `}
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Canvas */}
      <div
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

        {/* Center indicator */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-yellow-300 rounded-full shadow-lg z-10" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 border border-yellow-200 rounded-full z-10" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-yellow-100 rounded-full opacity-50 z-10" />

        {/* Empty state */}
        {placedSources.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="text-center text-white drop-shadow-lg">
              <div className="text-6xl mb-4">🎵</div>
              <p className="text-xl font-bold">Drag and drop sources here!</p>
              <p className="text-sm mt-2">Create your magical soundscape ✨</p>
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
              onDragStart={() => handlePlacedDragStart(placed.id)}
              onDragEnd={(e) => handlePlacedDragEnd(e, placed.id)}
            />
          );
        })}
      </div>
    </div>
  );
}