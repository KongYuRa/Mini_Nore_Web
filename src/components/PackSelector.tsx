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
    description: 'Rhythmic battle! ⚔️',
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

  // Get pack-specific colors
  const getPackColors = () => {
    switch (selectedPack) {
      case 'adventure':
        return {
          buttonGradient: 'from-green-400 to-emerald-400',
          border: 'border-green-200',
        };
      case 'combat':
        return {
          buttonGradient: 'from-rose-400 to-red-400',
          border: 'border-rose-200',
        };
      case 'shelter':
        return {
          buttonGradient: 'from-sky-400 to-blue-400',
          border: 'border-sky-200',
        };
    }
  };

  const packColors = getPackColors();

  return (
    <div className="space-y-4 mb-4 w-80">
      {/* Logo/Title */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-400 shadow-md flex items-center justify-center">
          <span className="text-white text-lg">♪</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-600">
          Mini Nore
        </h1>
      </div>

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
        <div className={`bg-white rounded-xl shadow-xl border-2 ${packColors.border} p-4 min-h-[140px]`}>
          <div className="relative">
            <h3 className="text-gray-800 font-semibold mb-2">{selectedPackData.title}</h3>
            <p className="text-gray-600 text-sm mb-3 h-5">{selectedPackData.description}</p>
            <button
              className={`w-full py-2 px-3 bg-gradient-to-r ${packColors.buttonGradient} text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm font-medium`}
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