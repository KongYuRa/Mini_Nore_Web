import { PackType, PlacedSourceData } from '../App';
import { SourceItem } from './SourceItem';
import { PackSelector } from './PackSelector';
import { getPackSources } from '../data/sources';
import { Music, Wind } from 'lucide-react';

interface SourcePanelProps {
  selectedPack: PackType;
  placedSources: PlacedSourceData[];
  onSelectPack: (pack: PackType) => void;
}

export function SourcePanel({ selectedPack, placedSources, onSelectPack }: SourcePanelProps) {
  const allSources = getPackSources(selectedPack);
  const musicSources = allSources.filter(s => s.type === 'music');
  const ambienceSources = allSources.filter(s => s.type === 'ambience');

  // 이미 배치된 소스 ID 목록
  const placedSourceIds = new Set(placedSources.map(p => p.sourceId));

  // Get pack-specific colors
  const getPackColors = () => {
    switch (selectedPack) {
      case 'adventure':
        return {
          border: 'border-green-200',
          musicGradient: 'from-green-400 to-emerald-400',
          ambienceGradient: 'from-emerald-400 to-teal-400',
          tutorialBg: 'from-green-100 to-emerald-100',
          tutorialBorder: 'border-green-300',
        };
      case 'combat':
        return {
          border: 'border-rose-200',
          musicGradient: 'from-rose-400 to-red-400',
          ambienceGradient: 'from-red-400 to-orange-400',
          tutorialBg: 'from-rose-100 to-red-100',
          tutorialBorder: 'border-rose-300',
        };
      case 'shelter':
        return {
          border: 'border-sky-200',
          musicGradient: 'from-sky-400 to-blue-400',
          ambienceGradient: 'from-blue-400 to-indigo-400',
          tutorialBg: 'from-sky-100 to-blue-100',
          tutorialBorder: 'border-sky-300',
        };
    }
  };

  const packColors = getPackColors();

  return (
    <div className={`w-auto bg-white/60 backdrop-blur-sm border-r-2 ${packColors.border} p-4 overflow-y-auto shadow-lg flex flex-col`}>
      {/* Pack Selector */}
      <PackSelector
        selectedPack={selectedPack}
        onSelectPack={onSelectPack}
      />

      {/* Sources Grid - Music and Ambience side by side */}
      <div className="grid grid-cols-2 gap-6 mt-4">
        {/* Music Section */}
        <div className="flex flex-col">
          <div className={`flex items-center justify-center py-2 px-4 rounded-xl bg-gradient-to-r ${packColors.musicGradient} text-white shadow-md border-2 border-white mb-3`}>
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
          <div className={`flex items-center justify-center py-2 px-4 rounded-xl bg-gradient-to-r ${packColors.ambienceGradient} text-white shadow-md border-2 border-white mb-3`}>
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
        <div className={`bg-gradient-to-br ${packColors.tutorialBg} rounded-2xl border-2 ${packColors.tutorialBorder} shadow-md p-4`}>
          <div className="text-2xl mb-2 text-center">✨</div>
          <h3 className="text-gray-800 text-sm mb-2">How to Play</h3>
          <ul className="text-gray-600 text-xs space-y-1">
            <li>• Drag sources to canvas</li>
            <li>• Position creates spatial audio</li>
            <li>• Click Play to start music</li>
            <li>• Create your story!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
