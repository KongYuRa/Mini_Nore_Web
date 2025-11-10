import { useState } from 'react';
import { SourcePanel } from './components/SourcePanel';
import { ComposerCanvas } from './components/ComposerCanvas';

export interface Source {
  id: string;
  name: string;
  type: 'music' | 'ambience';
  icon: string;
  color: string;
}

export interface PlacedSourceData {
  id: string;
  sourceId: string;
  x: number;
  y: number;
  volume: number;
}

export type PackType = 'adventure' | 'combat' | 'shelter';

export default function App() {
  const [selectedPack, setSelectedPack] = useState<PackType>('adventure');
  const [placedSources, setPlacedSources] = useState<PlacedSourceData[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlaceSource = (source: Source, x: number, y: number) => {
    const newPlaced: PlacedSourceData = {
      id: `${source.id}-${Date.now()}`,
      sourceId: source.id,
      x,
      y,
      volume: 1,
    };
    setPlacedSources([...placedSources, newPlaced]);
  };

  const handleRemoveSource = (id: string) => {
    setPlacedSources(placedSources.filter(s => s.id !== id));
  };

  const handleMoveSource = (id: string, x: number, y: number) => {
    setPlacedSources(placedSources.map(s => 
      s.id === id ? { ...s, x, y } : s
    ));
  };

  const handleClearAll = () => {
    setPlacedSources([]);
    setIsPlaying(false);
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 overflow-hidden flex">
      {/* Source Panel - Left */}
      <SourcePanel 
        selectedPack={selectedPack} 
        placedSources={placedSources}
        onSelectPack={setSelectedPack}
      />

      {/* Composer Canvas - Right */}
      <ComposerCanvas
        selectedPack={selectedPack}
        placedSources={placedSources}
        isPlaying={isPlaying}
        onPlaceSource={handlePlaceSource}
        onRemoveSource={handleRemoveSource}
        onMoveSource={handleMoveSource}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onClear={handleClearAll}
      />
    </div>
  );
}
