import { useState } from 'react';
import { PackType } from '../App';
import { Sword, Mountain, Home, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
    description: 'Bright & exciting! Start your journey across the plains! 🌾',
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
  const [hoveredPack, setHoveredPack] = useState<PackType | null>(null);

  return (
    <div className="space-y-2 mb-4">
      <div className="text-2xl text-center mb-3">🎵</div>
      <div className="flex justify-center gap-3">
        {packs.map((pack) => {
          const Icon = pack.icon;
          const isSelected = selectedPack === pack.id;
          const isHovered = hoveredPack === pack.id;
          
          return (
            <div key={pack.id} className="relative">
              <button
                onClick={() => onSelectPack(pack.id)}
                onMouseEnter={() => setHoveredPack(pack.id)}
                onMouseLeave={() => setHoveredPack(null)}
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

              {/* Tooltip */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-[9999]"
                  >
                    <div className="bg-white rounded-xl shadow-2xl border-2 border-yellow-200 p-4 w-56">
                      {/* Arrow */}
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-t-2 border-l-2 border-yellow-200 rotate-45" />
                      
                      <div className="relative">
                        <h3 className="text-gray-800 mb-2">{pack.title}</h3>
                        <p className="text-gray-600 text-sm mb-3">{pack.description}</p>
                        <button 
                          className="w-full py-2 px-3 bg-gradient-to-r from-amber-300 to-yellow-300 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Sample music play logic here
                          }}
                        >
                          <Music className="w-4 h-4" />
                          <span>Sample Song</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}