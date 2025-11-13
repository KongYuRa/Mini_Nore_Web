import { Volume2, VolumeX, Music as MusicIcon, Wind } from 'lucide-react';
import React from 'react';

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
  const [masterMuted, setMasterMuted] = React.useState(false);

  return (
    <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl border-2 border-blue-300 shadow-md p-3">
      <h3 className="text-gray-800 font-bold text-sm mb-2">Volume</h3>

      {/* Master Volume */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => setMasterMuted(!masterMuted)}
          className="flex-shrink-0 p-1 rounded transition-colors hover:bg-white/50"
        >
          {masterMuted ? <VolumeX className="w-4 h-4 text-gray-700" /> : <Volume2 className="w-4 h-4 text-gray-700" />}
        </button>
        <span className="text-xs font-semibold text-gray-700 w-12">Master</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={masterMuted ? 0 : masterVolume}
          onChange={(e) => {
            onMasterVolumeChange(parseFloat(e.target.value));
            if (parseFloat(e.target.value) > 0) setMasterMuted(false);
          }}
          className="flex-1 h-2 bg-gradient-to-r from-yellow-200 to-orange-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Music Volume */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => onMusicMutedChange(!musicMuted)}
          className="flex-shrink-0 p-1 rounded transition-colors hover:bg-white/50"
        >
          {musicMuted ? <VolumeX className="w-4 h-4 text-amber-600" /> : <MusicIcon className="w-4 h-4 text-amber-600" />}
        </button>
        <span className="text-xs font-semibold text-gray-700 w-12">Music</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={musicVolume}
          onChange={(e) => onMusicVolumeChange(parseFloat(e.target.value))}
          disabled={musicMuted}
          className="flex-1 h-2 bg-gradient-to-r from-amber-200 to-yellow-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
        />
      </div>

      {/* Ambience Volume */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onAmbienceMutedChange(!ambienceMuted)}
          className="flex-shrink-0 p-1 rounded transition-colors hover:bg-white/50"
        >
          {ambienceMuted ? <VolumeX className="w-4 h-4 text-orange-600" /> : <Wind className="w-4 h-4 text-orange-600" />}
        </button>
        <span className="text-xs font-semibold text-gray-700 w-12">Ambient</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={ambienceVolume}
          onChange={(e) => onAmbienceVolumeChange(parseFloat(e.target.value))}
          disabled={ambienceMuted}
          className="flex-1 h-2 bg-gradient-to-r from-orange-200 to-amber-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
        />
      </div>
    </div>
  );
}
