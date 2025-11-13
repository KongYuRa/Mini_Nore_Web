import { Volume2, VolumeX, Music as MusicIcon, Wind } from 'lucide-react';

interface VolumeControlsProps {
  masterVolume: number;
  musicVolume: number;
  ambienceVolume: number;
  musicMuted: boolean;
  ambienceMuted: boolean;
  onMasterVolumeChange: (volume: number) => void;
  onMusicVolumeChange: (volume: number) => void;
  onAmbienceVolumeChange: (volume: number) => void;
  onMusicMutedChange: (muted: boolean) => void;
  onAmbienceMutedChange: (muted: boolean) => void;
}

export function VolumeControls({
  masterVolume,
  musicVolume,
  ambienceVolume,
  musicMuted,
  ambienceMuted,
  onMasterVolumeChange,
  onMusicVolumeChange,
  onAmbienceVolumeChange,
  onMusicMutedChange,
  onAmbienceMutedChange,
}: VolumeControlsProps) {
  return (
    <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl border-2 border-blue-300 shadow-md p-4">
      <h3 className="text-gray-800 font-bold text-sm mb-3">Volume Controls</h3>

      {/* Master Volume */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Volume2 className="w-4 h-4 text-gray-700" />
          <span className="text-xs font-semibold text-gray-700">Master</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={masterVolume}
          onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-gradient-to-r from-yellow-200 to-orange-200 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>

      {/* Music Volume */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <MusicIcon className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-semibold text-gray-700">Music</span>
          <button
            onClick={() => onMusicMutedChange(!musicMuted)}
            className={`ml-auto p-1 rounded transition-colors ${
              musicMuted ? 'bg-red-400 text-white' : 'bg-white/70 text-gray-600 hover:bg-white'
            }`}
          >
            {musicMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={musicVolume}
          onChange={(e) => onMusicVolumeChange(parseFloat(e.target.value))}
          disabled={musicMuted}
          className="w-full h-2 bg-gradient-to-r from-amber-200 to-yellow-200 rounded-lg appearance-none cursor-pointer slider disabled:opacity-50"
        />
      </div>

      {/* Ambience Volume */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Wind className="w-4 h-4 text-orange-600" />
          <span className="text-xs font-semibold text-gray-700">Ambience</span>
          <button
            onClick={() => onAmbienceMutedChange(!ambienceMuted)}
            className={`ml-auto p-1 rounded transition-colors ${
              ambienceMuted ? 'bg-red-400 text-white' : 'bg-white/70 text-gray-600 hover:bg-white'
            }`}
          >
            {ambienceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={ambienceVolume}
          onChange={(e) => onAmbienceVolumeChange(parseFloat(e.target.value))}
          disabled={ambienceMuted}
          className="w-full h-2 bg-gradient-to-r from-orange-200 to-amber-200 rounded-lg appearance-none cursor-pointer slider disabled:opacity-50"
        />
      </div>
    </div>
  );
}
