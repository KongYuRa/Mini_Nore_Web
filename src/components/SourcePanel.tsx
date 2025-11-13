import { PackType, PlacedSourceData } from '../App';
import { SourceItem } from './SourceItem';
import { PackSelector } from './PackSelector';
import { getPackSources } from '../data/sources';
import { Music, Wind, Info } from 'lucide-react';
import { useState } from 'react';

interface SourcePanelProps {
  selectedPack: PackType;
  placedSources: PlacedSourceData[];
  onSelectPack: (pack: PackType) => void;
}

export function SourcePanel({ selectedPack, placedSources, onSelectPack }: SourcePanelProps) {
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

      {/* Credits Button */}
      <div className="mt-4 flex justify-center relative">
        <button
          onMouseEnter={() => setShowCredits(true)}
          onMouseLeave={() => setShowCredits(false)}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-400 shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center border-2 border-white"
        >
          <Info className="w-5 h-5 text-white" />
        </button>

        {/* Credits Popup */}
        {showCredits && (
          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 w-64 bg-white rounded-2xl shadow-2xl border-2 border-yellow-200 p-5 z-50">
            <div className="text-center">
              <div className="text-2xl mb-3">🎵</div>
              <h3 className="text-gray-800 font-bold text-lg mb-4 bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent">
                Credits
              </h3>

              <div className="space-y-4 text-left">
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-3 border border-yellow-200">
                  <p className="font-semibold text-gray-800 text-sm">Yu Ra Kong</p>
                  <p className="text-gray-600 text-xs mt-1">Develop & Art & Sound Design</p>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-3 border border-yellow-200">
                  <p className="font-semibold text-gray-800 text-sm">Da Hyun Kim</p>
                  <p className="text-gray-600 text-xs mt-1">Composition</p>
                </div>
              </div>
            </div>

            {/* Arrow pointer */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
              <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-yellow-200"></div>
              <div className="w-0 h-0 border-l-7 border-r-7 border-t-7 border-transparent border-t-white absolute bottom-0.5 left-1/2 transform -translate-x-1/2"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
