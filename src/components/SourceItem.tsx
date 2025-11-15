import { Source } from '../App';

interface SourceItemProps {
  source: Source;
  isPlaced: boolean;
}

export function SourceItem({ source, isPlaced }: SourceItemProps) {
  // HTML Drag and Drop for desktop only
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

  return (
    <div
      draggable={!isPlaced}
      onDragStart={handleDragStart}
      className={`
        w-12 h-12 rounded-full flex items-center justify-center text-xl
        border-2 select-none
        ${isPlaced
          ? 'opacity-30 cursor-not-allowed bg-gray-100 border-gray-200'
          : 'cursor-grab active:cursor-grabbing hover:scale-110 shadow-md hover:shadow-xl border-white'
        }
      `}
      style={{
        backgroundColor: isPlaced ? undefined : source.color,
        willChange: 'transform',
      }}
    >
      {source.icon}
    </div>
  );
}
