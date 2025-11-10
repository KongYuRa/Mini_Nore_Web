import { Source } from '../App';

interface SourceItemProps {
  source: Source;
  isPlaced: boolean;
}

export function SourceItem({ source, isPlaced }: SourceItemProps) {
  const handleDragStart = (e: React.DragEvent) => {
    if (isPlaced) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('source', JSON.stringify(source));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable={!isPlaced}
      onDragStart={handleDragStart}
      className={`
        w-12 h-12 rounded-full flex items-center justify-center text-xl
        transition-all border-2
        ${isPlaced 
          ? 'opacity-30 cursor-not-allowed bg-gray-100 border-gray-200'
          : 'cursor-grab active:cursor-grabbing hover:scale-110 shadow-md hover:shadow-xl border-white'
        }
      `}
      style={{
        backgroundColor: isPlaced ? undefined : source.color,
      }}
    >
      {source.icon}
    </div>
  );
}