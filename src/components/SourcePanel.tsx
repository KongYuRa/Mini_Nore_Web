import { PackType, PlacedSourceData } from '../App';
import { SourceItem } from './SourceItem';
import { PackSelector } from './PackSelector';
import { VolumeControls } from './VolumeControls';
import { getPackSources } from '../data/sources';
import { Music, Wind, Info } from 'lucide-react';
import { useState } from 'react';

interface SourcePanelProps {
  selectedPack: PackType;
  placedSources: PlacedSourceData[];
  onSelectPack: (pack: PackType) => void;
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

export function SourcePanel({
  selectedPack,
  placedSources,
  onSelectPack,
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
}: SourcePanelProps) {
  const [showCredits, setShowCredits] = useState(false);
  const allSources = getPackSources(selectedPack);
  const musicSources = allSources.filter(s => s.type === 'music');
  const ambienceSources = allSources.filter(s => s.type === 'ambience');

  // 이미 배치된 소스 ID 목록
  const placedSourceIds = new Set(placedSources.map(p => p.sourceId));

  return (
    <div className="w-auto bg-white/60 backdrop-blur-sm border-r-2 border-yellow-200 p-4 overflow-y-auto shadow-lg flex flex-col">
      {/* Pack Selector */}
      <PackSelector
        selectedPack={selectedPack}
        onSelectPack={onSelectPack}
      />

      {/* Volume Controls */}
      <div className="mt-4">
        <VolumeControls
          masterVolume={masterVolume}
          musicVolume={musicVolume}
          ambienceVolume={ambienceVolume}
          musicMuted={musicMuted}
          ambienceMuted={ambienceMuted}
          onMasterVolumeChange={onMasterVolumeChange}
          onMusicVolumeChange={onMusicVolumeChange}
          onAmbienceVolumeChange={onAmbienceVolumeChange}
          onMusicMutedChange={onMusicMutedChange}
          onAmbienceMutedChange={onAmbienceMutedChange}
        />
      </div>

      {/* Sources Grid - Music and Ambience side by side */}
      <div className="grid grid-cols-2 gap-6 mt-4">
        {/* Music Section */}
        <div className="flex flex-col">
          <div className="flex items-center justify-center py-2 px-4 rounded-xl bg-gradient-to-r from-amber-300 to-yellow-300 text-white shadow-md border-2 border-white mb-3">
            <Music className="w-5 h-5" />
          </div>
          
          {/* Music Sources Grid - 2 columns x 8 rows */}
          <div className="grid grid-cols-2 gap-2">
            {musicSources.map((source) => {
              const isPlaced = placedSourceIds.has(source.id);
              return (
                <SourceItem 
                  key={source.id} 
                  source={source} 
                  isPlaced={isPlaced}
                />
              );
            })}
          </div>
        </div>

        {/* Ambience Section */}
        <div className="flex flex-col">
          <div className="flex items-center justify-center py-2 px-4 rounded-xl bg-gradient-to-r from-orange-300 to-amber-300 text-white shadow-md border-2 border-white mb-3">
            <Wind className="w-5 h-5" />
          </div>
          
          {/* Ambience Sources Grid - 2 columns x 8 rows */}
          <div className="grid grid-cols-2 gap-2">
            {ambienceSources.map((source) => {
              const isPlaced = placedSourceIds.has(source.id);
              return (
                <SourceItem 
                  key={source.id} 
                  source={source} 
                  isPlaced={isPlaced}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Tutorial Section */}
      <div className="mt-6">
        <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl border-2 border-yellow-300 shadow-md p-4">
          <h3 className="text-gray-800 text-sm mb-2">How to Play</h3>
          <ul className="text-gray-600 text-xs space-y-1">
            <li>• Drag sources to canvas</li>
            <li>• Position creates spatial audio</li>
            <li>• Click Play to start music</li>
            <li>• Create your story!</li>
          </ul>
        </div>
      </div>

      {/* Credits Button */}
      <div
        className="mt-4 flex flex-col items-center relative"
        onMouseEnter={() => setShowCredits(true)}
        onMouseLeave={() => setShowCredits(false)}
      >
        {/* Credits Popup */}
        {showCredits && (
          <div className="w-full bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl border-2 border-yellow-300 shadow-md p-4 mb-2">
            <div className="text-center">
              <h3 className="text-gray-800 font-bold text-sm mb-3">Credits</h3>

              <div className="space-y-3 text-left">
                <div className="bg-white/70 rounded-xl p-3 border border-yellow-200">
                  <p className="font-semibold text-gray-800 text-sm">Yu Ra Kong</p>
                  <p className="text-gray-600 text-xs mt-1">Develop & Art & Sound Design</p>
                </div>

                <div className="bg-white/70 rounded-xl p-3 border border-yellow-200">
                  <p className="font-semibold text-gray-800 text-sm">Da Hyun Kim</p>
                  <p className="text-gray-600 text-xs mt-1">Composition</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-400 shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center border-2 border-white"
        >
          <Info className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
}
