import { X } from 'lucide-react';
import { Source, PlacedSourceData } from '../App';
import { motion } from 'motion/react';
import { useState } from 'react';

interface PlacedSourceProps {
  placed: PlacedSourceData;
  source: Source;
  isPlaying: boolean;
  isDragging: boolean;
  onRemove: () => void;
  onToggleMute: () => void;
  onDepthChange: (depth: number) => void;
  onDragStart: () => void;
  onDragEnd: (e: React.DragEvent) => void;
}

export function PlacedSource({
  placed,
  source,
  isPlaying,
  isDragging,
  onRemove,
  onToggleMute,
  onDepthChange,
  onDragStart,
  onDragEnd,
}: PlacedSourceProps) {
  const [showDepthSlider, setShowDepthSlider] = useState(false);

  // HTML Drag and Drop for desktop only
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('placedId', placed.id);
    onDragStart();
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Toggle depth slider on click
    setShowDepthSlider(!showDepthSlider);
  };

  const handleDepthSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    onDepthChange(value);
  };

  return (
    <motion.div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onClick={handleClick}
      className={`
        group cursor-grab active:cursor-grabbing select-none
        ${isDragging ? 'opacity-50' : 'opacity-100'}
      `}
      style={{
        position: 'absolute',
        left: placed.x,
        top: placed.y,
        transform: 'translate(-50%, -50%)',
        willChange: isDragging ? 'transform' : 'auto',
      }}
      animate={{
        rotate: isPlaying && !isDragging ? [0, -5, 5, -5, 0] : 0,
      }}
      transition={{
        rotate: {
          repeat: isPlaying && !isDragging ? Infinity : 0,
          duration: 0.8,
          ease: 'easeInOut'
        }
      }}
    >
      <div className="relative">
        {/* Glow effect when playing */}
        {isPlaying && !isDragging && (
          <motion.div
            className="absolute inset-0 rounded-3xl blur-2xl"
            style={{ backgroundColor: source.color }}
            animate={{
              opacity: [0.4, 0.7, 0.4],
              scale: [1, 1.3, 1],
            }}
            transition={{
              repeat: Infinity,
              duration: 1.5,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* Main icon */}
        <div
          className={`
            relative w-20 h-20 rounded-3xl flex items-center justify-center
            text-4xl border-4 border-white
            ${isPlaying ? 'shadow-2xl' : 'shadow-lg'}
          `}
          style={{
            backgroundColor: placed.muted ? '#9ca3af' : source.color,
            opacity: isPlaying ? 1 : 0.8,
          }}
        >
          <motion.div
            animate={isPlaying && !isDragging ? {
              y: [0, -5, 0],
              scale: [1, 1.1, 1],
            } : {}}
            transition={{
              repeat: Infinity,
              duration: 0.6,
              ease: 'easeInOut',
            }}
          >
            {source.icon}
          </motion.div>
        </div>

        {/* Remove button - visible on hover (desktop only) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute -top-2 -right-2 w-8 h-8 bg-red-400 rounded-full flex items-center justify-center transition-opacity shadow-lg hover:bg-red-500 border-2 border-white z-20 opacity-0 group-hover:opacity-100"
        >
          <X className="w-4 h-4 text-white pointer-events-none" />
        </button>

        {/* Depth Slider - Vertical */}
        {showDepthSlider && (
          <div
            className="absolute -right-20 top-1/2 -translate-y-1/2 z-30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 shadow-2xl border-2 border-yellow-200">
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs text-gray-600 font-semibold">앞</span>
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.01"
                  value={placed.depth || 0}
                  onChange={handleDepthSliderChange}
                  className="w-32 h-2 bg-gradient-to-b from-blue-300 to-orange-300 rounded-lg appearance-none cursor-pointer vertical-slider"
                  style={{
                    writingMode: 'bt-lr',
                    WebkitAppearance: 'slider-vertical',
                    width: '8px',
                    height: '120px',
                  }}
                />
                <span className="text-xs text-gray-600 font-semibold">뒤</span>
                <div className="text-xs text-gray-500 mt-1">
                  {((placed.depth || 0) * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
