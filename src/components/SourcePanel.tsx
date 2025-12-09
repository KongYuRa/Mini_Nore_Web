import { PackType, PlacedSourceData, Source } from '../App';
import { SourceItem } from './SourceItem';
import { PackSelector } from './PackSelector';
import { VolumeControls } from './VolumeControls';
import { getPackSources } from '../data/sources';
import { Music, Wind, Info, Sparkles } from 'lucide-react';
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
  onGenerateAI: () => void;
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
  onGenerateAI,
}: SourcePanelProps) {
  const [showCredits, setShowCredits] = useState(false);
  const [showAITooltip, setShowAITooltip] = useState(false);
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

      {/* Sources Grid - Music and Ambience side by side */}
      <div className="grid grid-cols-2 gap-6 mt-4">
        {/* Music Section */}
        <div className="flex flex-col">
          <div className="flex items-center justify-center py-2 px-4 rounded-xl bg-gradient-to-r from-amber-300 to-yellow-300 text-white shadow-md border-2 border-white mb-3">
            <span className="text-sm font-semibold">Music</span>
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
            <span className="text-sm font-semibold">Ambience</span>
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

      {/* Volume Controls with Credits Overlay */}
      <div className="mt-6 relative">
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

        {/* Credits Popup - Overlay on top of Volume Controls */}
        {showCredits && (
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl border-2 border-yellow-300 shadow-2xl p-4 z-10">
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
      </div>

      {/* AI and Credits Buttons */}
      <div className="mt-4 flex justify-center gap-4">
        {/* AI Generate Button */}
        <div className="relative">
          <button
            className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 via-violet-500 to-indigo-500 shadow-xl hover:shadow-2xl transition-all hover:scale-110 active:scale-95 flex items-center justify-center border-4 border-white group relative overflow-hidden"
            onClick={onGenerateAI}
            onMouseEnter={() => setShowAITooltip(true)}
            onMouseLeave={() => setShowAITooltip(false)}
            title="Generate AI Composition"
          >
            {/* Sparkle effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Sparkles className="w-7 h-7 text-white relative z-10 group-hover:rotate-12 transition-transform" />
          </button>

          {/* AI Tooltip */}
          {showAITooltip && (
            <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 z-20">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-2xl px-4 py-2.5 border-2 border-white/30">
                <div className="font-bold text-sm">✨ AI Generate</div>
                <div className="text-[10px] opacity-90 mt-0.5">Create 16 scenes automatically</div>
              </div>
              {/* Arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[2px]">
                <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-indigo-600"></div>
              </div>
            </div>
          )}
        </div>

        {/* Credits Button */}
        <button
          className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-400 shadow-xl hover:shadow-2xl transition-all hover:scale-110 active:scale-95 flex items-center justify-center border-4 border-white group relative overflow-hidden"
          onMouseEnter={() => setShowCredits(true)}
          onMouseLeave={() => setShowCredits(false)}
          title="Credits"
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Info className="w-7 h-7 text-white relative z-10" />
        </button>
      </div>
    </div>
  );
}
