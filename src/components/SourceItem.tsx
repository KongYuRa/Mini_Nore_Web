import { Source } from '../App';
import { useDragAndDrop, triggerHapticFeedback } from '../hooks/useDragAndDrop';
import { DragPreview } from './DragPreview';
import { useState } from 'react';

interface SourceItemProps {
  source: Source;
  isPlaced: boolean;
  onTouchDragStart?: (source: Source) => void;
  onTouchDragMove?: (x: number, y: number) => void;
  onTouchDragEnd?: (x: number, y: number) => void;
}

export function SourceItem({
  source,
  isPlaced,
  onTouchDragStart,
  onTouchDragMove,
  onTouchDragEnd,
}: SourceItemProps) {
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });

  // HTML Drag and Drop for desktop
  const handleDragStart = (e: React.DragEvent) => {
    if (isPlaced) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('source', JSON.stringify(source));
    e.dataTransfer.effectAllowed = 'copy';

    // Create empty drag image for better performance
    const emptyImage = new Image();
    emptyImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(emptyImage, 0, 0);
  };

  // Pointer events for touch/mobile
  const { isDragging, handlers } = useDragAndDrop({
    disabled: isPlaced,
    onDragStart: () => {
      if (onTouchDragStart) {
        onTouchDragStart(source);
      }
      triggerHapticFeedback('medium');
    },
    onDragMove: (state) => {
      setPreviewPosition({ x: state.currentX, y: state.currentY });
      if (onTouchDragMove) {
        onTouchDragMove(state.currentX, state.currentY);
      }
    },
    onDragEnd: (state) => {
      if (onTouchDragEnd) {
        onTouchDragEnd(state.currentX, state.currentY);
      }
      triggerHapticFeedback('light');
    },
    dragThreshold: 5,
  });

  return (
    <>
      <div
        draggable={!isPlaced}
        onDragStart={handleDragStart}
        {...handlers}
        className={`
          w-12 h-12 rounded-full flex items-center justify-center text-xl
          border-2 select-none
          ${isPlaced
            ? 'opacity-30 cursor-not-allowed bg-gray-100 border-gray-200'
            : 'cursor-grab active:cursor-grabbing hover:scale-110 shadow-md hover:shadow-xl border-white touch-none'
          }
          ${isDragging ? 'opacity-50' : ''}
        `}
        style={{
          backgroundColor: isPlaced ? undefined : source.color,
          willChange: 'transform',
          touchAction: 'none', // Prevent default touch behaviors
        }}
      >
        {source.icon}
      </div>

      {/* Touch drag preview */}
      <DragPreview
        isVisible={isDragging}
        x={previewPosition.x}
        y={previewPosition.y}
        source={source}
      />
    </>
  );
}