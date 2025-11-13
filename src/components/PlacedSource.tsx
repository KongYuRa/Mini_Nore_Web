import { X } from 'lucide-react';
import { Source, PlacedSourceData } from '../App';
import { motion } from 'motion/react';
import { useDragAndDrop, triggerHapticFeedback } from '../hooks/useDragAndDrop';
import { DragPreview } from './DragPreview';
import { useState, useRef } from 'react';

interface PlacedSourceProps {
  placed: PlacedSourceData;
  source: Source;
  isPlaying: boolean;
  isDragging: boolean;
  onRemove: () => void;
  onToggleMute: () => void;
  onDragStart: () => void;
  onDragEnd: (e: React.DragEvent) => void;
  onTouchMove?: (x: number, y: number) => void;
  onTouchMoveEnd?: (x: number, y: number) => void;
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
  onTouchMove,
  onTouchMoveEnd,
}: PlacedSourceProps) {
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const [showRemoveButton, setShowRemoveButton] = useState(false);
  const clickStartTimeRef = useRef<number>(0);
  const hasMovedRef = useRef(false);

  // HTML Drag and Drop for desktop
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

  // Pointer events for touch/mobile
  const { isDragging: isTouchDragging, handlers } = useDragAndDrop({
    onDragStart: () => {
      clickStartTimeRef.current = Date.now();
      hasMovedRef.current = false;
      onDragStart();
      triggerHapticFeedback('medium');
    },
    onDragMove: (state) => {
      hasMovedRef.current = true;
      setPreviewPosition({ x: state.currentX, y: state.currentY });
      if (onTouchMove) {
        onTouchMove(state.currentX, state.currentY);
      }
    },
    onDragEnd: (state) => {
      const clickDuration = Date.now() - clickStartTimeRef.current;

      // If it was a quick tap (< 200ms) and didn't move much, treat as click
      if (!hasMovedRef.current && clickDuration < 200) {
        onToggleMute();
        triggerHapticFeedback('light');
      } else if (onTouchMoveEnd) {
        // Otherwise, it was a drag
        onTouchMoveEnd(state.currentX, state.currentY);
        triggerHapticFeedback('light');
      }

      hasMovedRef.current = false;
    },
    dragThreshold: 5,
  });

  // Long press to show remove button on mobile
  const handleLongPress = () => {
    setShowRemoveButton(true);
    triggerHapticFeedback('heavy');
  };

  return (
    <>
      <motion.div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
        onClick={handleClick}
        {...handlers}
        className={`
          group cursor-grab active:cursor-grabbing select-none
          ${isDragging || isTouchDragging ? 'opacity-50' : 'opacity-100'}
        `}
        style={{
          position: 'absolute',
          left: placed.x,
          top: placed.y,
          transform: 'translate(-50%, -50%)',
          willChange: isDragging || isTouchDragging ? 'transform' : 'auto',
          touchAction: 'none',
        }}
        animate={{
          rotate: isPlaying && !isDragging && !isTouchDragging ? [0, -5, 5, -5, 0] : 0,
        }}
        transition={{
          rotate: {
            repeat: isPlaying && !isDragging && !isTouchDragging ? Infinity : 0,
            duration: 0.8,
            ease: 'easeInOut'
          }
        }}
      >
        <div className="relative">
          {/* Glow effect when playing */}
          {isPlaying && !isDragging && !isTouchDragging && (
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
              animate={isPlaying && !isDragging && !isTouchDragging ? {
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

          {/* Remove button - visible on hover (desktop) or when showRemoveButton is true (mobile) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
              triggerHapticFeedback('heavy');
              setShowRemoveButton(false);
            }}
            className={`absolute -top-2 -right-2 w-8 h-8 bg-red-400 rounded-full flex items-center justify-center transition-opacity shadow-lg hover:bg-red-500 border-2 border-white z-20 ${
              showRemoveButton ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            <X className="w-4 h-4 text-white pointer-events-none" />
          </button>
        </div>
      </motion.div>

      {/* Touch drag preview */}
      <DragPreview
        isVisible={isTouchDragging}
        x={previewPosition.x}
        y={previewPosition.y}
        source={source}
      />
    </>
  );
}