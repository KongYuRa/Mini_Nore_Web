import { PackType } from '../App';
import { Sword, Mountain, Home, Music } from 'lucide-react';

interface PackSelectorProps {
  selectedPack: PackType;
  onSelectPack: (pack: PackType) => void;
}

const packs = [
  {
    id: 'adventure' as PackType,
    icon: Mountain,
    color: 'bg-green-400',
    title: 'Adventure Pack',
    description: 'Bright & exciting! 🌾',
  },
  {
    id: 'combat' as PackType,
    icon: Sword,
    color: 'bg-red-400',
    title: 'Combat Pack',
    description: 'Rhythmic battle! Fight to win!! ⚔️',
  },
  {
    id: 'shelter' as PackType,
    icon: Home,
    color: 'bg-blue-400',
    title: 'Shelter Pack',
    description: 'Warm & mystical rest time 🏡',
  },
];

export function PackSelector({ selectedPack, onSelectPack }: PackSelectorProps) {
  const selectedPackData = packs.find(pack => pack.id === selectedPack) || packs[0];

  return (
    <div className="space-y-4 mb-4 w-80">
      <div className="text-2xl text-center mb-3">🎵</div>

      {/* Pack Buttons */}
      <div className="flex justify-center gap-3">
        {packs.map((pack) => {
          const Icon = pack.icon;
          const isSelected = selectedPack === pack.id;

          return (
            <button
              key={pack.id}
              onClick={() => onSelectPack(pack.id)}
              className={`
                w-14 h-14 rounded-2xl flex items-center justify-center transition-all border-2
                ${isSelected
                  ? `${pack.color} text-white shadow-lg scale-110 border-white`
                  : 'bg-white/80 text-gray-500 hover:bg-gray-50 border-gray-200 hover:scale-105'
                }
              `}
            >
              <Icon className="w-6 h-6" />
            </button>
          );
        })}
      </div>

      {/* Always visible description box */}
      <div className="w-full">
        <div className="bg-white rounded-xl shadow-xl border-2 border-yellow-200 p-4 min-h-[140px]">
          <div className="relative">
            <h3 className="text-gray-800 font-semibold mb-2">{selectedPackData.title}</h3>
            <p className="text-gray-600 text-sm mb-3 h-5">{selectedPackData.description}</p>
            <button
              className="w-full py-2 px-3 bg-gradient-to-r from-amber-300 to-yellow-300 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm font-medium"
              onClick={(e) => {
                e.stopPropagation();
                // Sample music play logic here
                console.log(`Playing sample for ${selectedPackData.title}`);
              }}
            >
              <Music className="w-4 h-4" />
              <span>Sample Song</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}