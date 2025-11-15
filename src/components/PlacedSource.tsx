import { X } from 'lucide-react';
import { Source, PlacedSourceData } from '../App';
import { motion } from 'motion/react';

interface PlacedSourceProps {
  placed: PlacedSourceData;
  source: Source;
  isPlaying: boolean;
  isDragging: boolean;
  onRemove: () => void;
  onToggleMute: () => void;
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
  onDragStart,
  onDragEnd,
}: PlacedSourceProps) {
  // HTML Drag and Drop for desktop only
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('placedId', placed.id);
    onDragStart();
  };

  const handleClick = (e: React.MouseEvent) => {
    // Only toggle mute on direct click, not during drag
    if (e.detail === 1) {
      onToggleMute();
    }
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
      </div>
    </motion.div>
  );
}
