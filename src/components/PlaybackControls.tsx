import { Play, Pause, Trash2 } from 'lucide-react';

interface PlaybackControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onClear: () => void;
  hasPlacedSources: boolean;
}

export function PlaybackControls({ 
  isPlaying, 
  onTogglePlay, 
  onClear, 
  hasPlacedSources 
}: PlaybackControlsProps) {
  return (
    <div className="flex gap-3">
      <button
        onClick={onTogglePlay}
        disabled={!hasPlacedSources}
        className={`
          px-8 py-3 rounded-2xl flex items-center gap-2 transition-all border-4
          ${hasPlacedSources
            ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white hover:shadow-2xl hover:scale-110 border-white shadow-lg'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed border-gray-300'
          }
        `}
      >
        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        <span>{isPlaying ? 'Pause' : 'Play'}</span>
      </button>
      
      <button
        onClick={onClear}
        disabled={!hasPlacedSources}
        className={`
          px-5 py-3 rounded-2xl flex items-center gap-2 transition-all border-2
          ${hasPlacedSources
            ? 'bg-white text-red-500 hover:bg-red-50 shadow-md hover:scale-105 border-red-200'
            : 'bg-gray-100 text-gray-300 cursor-not-allowed border-gray-200'
          }
        `}
      >
        <Trash2 className="w-5 h-5" />
        <span>Clear</span>
      </button>
    </div>
  );
}