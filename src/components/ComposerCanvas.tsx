import { useState, useRef } from 'react';
import { Source, PlacedSourceData, PackType, SceneSlot } from '../App';
import { PlacedSource } from './PlacedSource';
import { getPackSources } from '../data/sources';
import { Play, Pause, UserCircle } from 'lucide-react';
import { ListenerPosition } from '../hooks/useAudioManager';

interface ComposerCanvasProps {
  canvasRef: React.RefObject<HTMLDivElement>;
  selectedPack: PackType;
  placedSources: PlacedSourceData[];
  isPlaying: boolean;
  isPlayingAll: boolean;
  scenes: SceneSlot[];
  currentSlot: number;
  listenerPosition: ListenerPosition;
  canvasWidth: number;
  canvasHeight: number;
  onSelectSlot: (slot: number) => void;
  onPlaceSource: (source: Source, x: number, y: number) => void;
  onRemoveSource: (id: string) => void;
  onMoveSource: (id: string, x: number, y: number) => void;
  onToggleMute: (id: string) => void;
  onDepthChange: (id: string, depth: number) => void;
  onTogglePlay: () => void;
  onTogglePlayAll: () => void;
  onMoveListener: (x: number, y: number) => void;
}

export function ComposerCanvas({
  canvasRef,
  selectedPack,
  placedSources,
  isPlaying,
  isPlayingAll,
  scenes,
  currentSlot,
  listenerPosition,
  canvasWidth,
  canvasHeight,
  onSelectSlot,
  onPlaceSource,
  onRemoveSource,
  onMoveSource,
  onToggleMute,
  onDepthChange,
  onTogglePlay,
  onTogglePlayAll,
  onMoveListener,
}: ComposerCanvasProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isDraggingListener, setIsDraggingListener] = useState(false);
  const sources = getPackSources(selectedPack);
  const hasPlacedSources = placedSources.length > 0;

  // 3D 좌표 → 2D 캔버스 좌표 변환 (리스너 표시용)
  const listener3DTo2D = () => {
    const x = ((listenerPosition.x + 5) / 10) * canvasWidth;
    const y = (listenerPosition.z / 10) * canvasHeight;
    return { x, y };
  };

  const listenerPos2D = listener3DTo2D();

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

  // 리스너 드래그 핸들러 (throttled for performance)
  const lastDragUpdate = useRef<number>(0);

  const handleListenerDragStart = () => {
    setIsDraggingListener(true);
  };

  const handleListenerDrag = (e: React.DragEvent) => {
    if (!canvasRef.current || e.clientX === 0 || e.clientY === 0) return;

    // Throttle updates to ~60fps (16ms)
    const now = Date.now();
    if (now - lastDragUpdate.current < 16) return;
    lastDragUpdate.current = now;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x > 0 && y > 0 && x < rect.width && y < rect.height) {
      onMoveListener(x, y);
    }
  };

  const handleListenerDragEnd = () => {
    setIsDraggingListener(false);
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
          {/* Global Play/Pause (All Scenes) */}
          <button
            onClick={onTogglePlayAll}
            className="px-6 py-3 rounded-2xl flex items-center gap-2 transition-all border-2 bg-gradient-to-r from-amber-300 to-yellow-300 text-white hover:shadow-xl hover:scale-105 border-white shadow-lg"
          >
            {isPlayingAll ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
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
            <div className="text-center text-white drop-shadow-lg" style={{ marginTop: '80px' }}>
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
              onDepthChange={(depth) => onDepthChange(placed.id, depth)}
              onDragStart={() => handlePlacedDragStart(placed.id)}
              onDragEnd={(e) => handlePlacedDragEnd(e, placed.id)}
            />
          );
        })}

        {/* Listener (3D Audio) */}
        <div
          draggable
          onDragStart={handleListenerDragStart}
          onDrag={handleListenerDrag}
          onDragEnd={handleListenerDragEnd}
          className={`
            absolute z-30 cursor-move transition-all
            ${isDraggingListener ? 'scale-110 opacity-50' : 'hover:scale-110'}
          `}
          style={{
            left: listenerPos2D.x - 24,
            top: listenerPos2D.y - 24,
          }}
          title="Listener Position (Drag to move) - 3D Audio Center"
        >
          <div className="relative">
            {/* 리스너 아이콘 */}
            <div className="bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full p-2 border-4 border-white shadow-2xl">
              <UserCircle className="w-8 h-8 text-white" />
            </div>

            {/* 방향 표시 (앞쪽 바라보는 방향) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-1">
              <div className="w-0.5 h-4 bg-blue-400" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-2 h-2 border-t-2 border-l-2 border-blue-400 rotate-45" />
            </div>

            {/* 레이블 */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap">
              <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full shadow-lg font-semibold">
                Listener
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}