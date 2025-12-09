import { Source, PackType } from '../App';

const adventureSources: Source[] = [
  // Music (16개)
  { id: 'adv-hero', name: 'Hero', type: 'music', icon: '🗡️', color: '#fde68a' },
  { id: 'adv-drums', name: 'Drums', type: 'music', icon: '🥁', color: '#fcd34d' },
  { id: 'adv-flute', name: 'Flute', type: 'music', icon: '🎺', color: '#fef3c7' },
  { id: 'adv-strings', name: 'Strings', type: 'music', icon: '🎻', color: '#fef9c3' },
  { id: 'adv-bass', name: 'Bass', type: 'music', icon: '🎸', color: '#fbbf24' },
  { id: 'adv-harp', name: 'Harp', type: 'music', icon: '🪕', color: '#fef3c7' },
  { id: 'adv-bell', name: 'Bell', type: 'music', icon: '🔔', color: '#fed7aa' },
  { id: 'adv-horn', name: 'Horn', type: 'music', icon: '📯', color: '#fdba74' },
  { id: 'adv-choir', name: 'Choir', type: 'music', icon: '🎵', color: '#fde68a' },
  { id: 'adv-piano', name: 'Piano', type: 'music', icon: '🎹', color: '#fcd34d' },
  { id: 'adv-guitar', name: 'Guitar', type: 'music', icon: '🎼', color: '#fef3c7' },
  { id: 'adv-violin', name: 'Violin', type: 'music', icon: '🎶', color: '#fef9c3' },
  { id: 'adv-trumpet', name: 'Trumpet', type: 'music', icon: '🎺', color: '#fbbf24' },
  { id: 'adv-lute', name: 'Lute', type: 'music', icon: '🪈', color: '#fef3c7' },
  { id: 'adv-melody', name: 'Melody', type: 'music', icon: '🎵', color: '#fed7aa' },
  { id: 'adv-rhythm', name: 'Rhythm', type: 'music', icon: '🥁', color: '#fdba74' },
  // Ambience (10개 - AdventurePack)
  { id: 'adv-footstep', name: 'Footstep', type: 'ambience', icon: '👣', color: '#fbbf24' },
  { id: 'adv-birds', name: 'Birds', type: 'ambience', icon: '🐦', color: '#fde047' },
  { id: 'adv-horse', name: 'Horse', type: 'ambience', icon: '🐴', color: '#fbbf24' },
  { id: 'adv-walla', name: 'Walla', type: 'ambience', icon: '🗣️', color: '#fef08a' },
  { id: 'adv-river', name: 'River', type: 'ambience', icon: '🌊', color: '#fef3c7' },
  { id: 'adv-buggy', name: 'Buggy', type: 'ambience', icon: '🛒', color: '#facc15' },
  { id: 'adv-sheep', name: 'Sheep', type: 'ambience', icon: '🐑', color: '#fef9c3' },
  { id: 'adv-wolf', name: 'Wolf', type: 'ambience', icon: '🐺', color: '#fb923c' },
  { id: 'adv-night', name: 'Night', type: 'ambience', icon: '🦗', color: '#fed7aa' },
  { id: 'adv-frog', name: 'Frog', type: 'ambience', icon: '🐸', color: '#fdba74' },
];

const combatSources: Source[] = [
  // Music (16개)
  { id: 'cmb-warrior', name: 'Warrior', type: 'music', icon: '⚔️', color: '#fed7aa' },
  { id: 'cmb-drums', name: 'War Drums', type: 'music', icon: '🥁', color: '#fdba74' },
  { id: 'cmb-horn', name: 'Horn', type: 'music', icon: '📯', color: '#fb923c' },
  { id: 'cmb-bass', name: 'Heavy Bass', type: 'music', icon: '🎸', color: '#f97316' },
  { id: 'cmb-synth', name: 'Synth', type: 'music', icon: '🎹', color: '#fdba74' },
  { id: 'cmb-guitar', name: 'Guitar', type: 'music', icon: '🎼', color: '#fed7aa' },
  { id: 'cmb-choir', name: 'Choir', type: 'music', icon: '🎵', color: '#ffedd5' },
  { id: 'cmb-epic', name: 'Epic', type: 'music', icon: '🎭', color: '#fb923c' },
  { id: 'cmb-percussion', name: 'Percussion', type: 'music', icon: '🥁', color: '#fed7aa' },
  { id: 'cmb-brass', name: 'Brass', type: 'music', icon: '🎺', color: '#fdba74' },
  { id: 'cmb-strings', name: 'Strings', type: 'music', icon: '🎻', color: '#fb923c' },
  { id: 'cmb-power', name: 'Power', type: 'music', icon: '⚡', color: '#f97316' },
  { id: 'cmb-march', name: 'March', type: 'music', icon: '🎵', color: '#fdba74' },
  { id: 'cmb-metal', name: 'Metal', type: 'music', icon: '🎸', color: '#fed7aa' },
  { id: 'cmb-orchestra', name: 'Orchestra', type: 'music', icon: '🎼', color: '#ffedd5' },
  { id: 'cmb-battle', name: 'Battle', type: 'music', icon: '⚔️', color: '#fb923c' },
  // Ambience (16개)
  { id: 'cmb-clash', name: 'Sword Clash', type: 'ambience', icon: '⚡', color: '#fbbf24' },
  { id: 'cmb-fire', name: 'Fire', type: 'ambience', icon: '🔥', color: '#f59e0b' },
  { id: 'cmb-roar', name: 'Monster', type: 'ambience', icon: '👹', color: '#dc2626' },
  { id: 'cmb-thunder', name: 'Thunder', type: 'ambience', icon: '⚡', color: '#fcd34d' },
  { id: 'cmb-shield', name: 'Shield', type: 'ambience', icon: '🛡️', color: '#d97706' },
  { id: 'cmb-explosion', name: 'Explosion', type: 'ambience', icon: '💥', color: '#ef4444' },
  { id: 'cmb-arrow', name: 'Arrow', type: 'ambience', icon: '🏹', color: '#fb923c' },
  { id: 'cmb-cry', name: 'Battle Cry', type: 'ambience', icon: '🗣️', color: '#f97316' },
  { id: 'cmb-magic', name: 'Magic', type: 'ambience', icon: '✨', color: '#a855f7' },
  { id: 'cmb-wind', name: 'Wind', type: 'ambience', icon: '💨', color: '#fde68a' },
  { id: 'cmb-dragon', name: 'Dragon', type: 'ambience', icon: '🐉', color: '#dc2626' },
  { id: 'cmb-armor', name: 'Armor', type: 'ambience', icon: '🛡️', color: '#fed7aa' },
  { id: 'cmb-footsteps', name: 'Steps', type: 'ambience', icon: '👢', color: '#fdba74' },
  { id: 'cmb-spell', name: 'Spell', type: 'ambience', icon: '🔮', color: '#8b5cf6' },
  { id: 'cmb-wolf', name: 'Wolf', type: 'ambience', icon: '🐺', color: '#fb923c' },
  { id: 'cmb-clash2', name: 'Metal Clash', type: 'ambience', icon: '⚔️', color: '#f97316' },
];

const shelterSources: Source[] = [
  // Music (16개)
  { id: 'shl-melody', name: 'Melody', type: 'music', icon: '🎼', color: '#fde68a' },
  { id: 'shl-piano', name: 'Piano', type: 'music', icon: '🎹', color: '#fcd34d' },
  { id: 'shl-harp', name: 'Harp', type: 'music', icon: '🪕', color: '#fef3c7' },
  { id: 'shl-pad', name: 'Pad', type: 'music', icon: '🌊', color: '#fef9c3' },
  { id: 'shl-chime', name: 'Chimes', type: 'music', icon: '🔔', color: '#fbbf24' },
  { id: 'shl-flute', name: 'Flute', type: 'music', icon: '🎵', color: '#fef3c7' },
  { id: 'shl-violin', name: 'Violin', type: 'music', icon: '🎻', color: '#fed7aa' },
  { id: 'shl-cello', name: 'Cello', type: 'music', icon: '🎸', color: '#fdba74' },
  { id: 'shl-strings', name: 'Strings', type: 'music', icon: '🎶', color: '#fde68a' },
  { id: 'shl-lullaby', name: 'Lullaby', type: 'music', icon: '🌙', color: '#fcd34d' },
  { id: 'shl-music-box', name: 'Music Box', type: 'music', icon: '🎁', color: '#fef3c7' },
  { id: 'shl-kalimba', name: 'Kalimba', type: 'music', icon: '🎵', color: '#fef9c3' },
  { id: 'shl-ambient', name: 'Ambient', type: 'music', icon: '🌌', color: '#fbbf24' },
  { id: 'shl-bell', name: 'Bell', type: 'music', icon: '🔔', color: '#fef3c7' },
  { id: 'shl-warm', name: 'Warm Pad', type: 'music', icon: '☁️', color: '#fed7aa' },
  { id: 'shl-gentle', name: 'Gentle', type: 'music', icon: '🎼', color: '#fdba74' },
  // Ambience (16개)
  { id: 'shl-fireplace', name: 'Fireplace', type: 'ambience', icon: '🔥', color: '#f97316' },
  { id: 'shl-rain', name: 'Rain', type: 'ambience', icon: '🌧️', color: '#fde047' },
  { id: 'shl-night', name: 'Night', type: 'ambience', icon: '🌙', color: '#fef08a' },
  { id: 'shl-wood', name: 'Wood Creak', type: 'ambience', icon: '🪵', color: '#facc15' },
  { id: 'shl-candle', name: 'Candle', type: 'ambience', icon: '🕯️', color: '#fef9c3' },
  { id: 'shl-book', name: 'Book Page', type: 'ambience', icon: '📖', color: '#fbbf24' },
  { id: 'shl-cat', name: 'Cat Purr', type: 'ambience', icon: '🐱', color: '#eab308' },
  { id: 'shl-tea', name: 'Tea Cup', type: 'ambience', icon: '☕', color: '#fde047' },
  { id: 'shl-clock', name: 'Clock', type: 'ambience', icon: '🕰️', color: '#fde68a' },
  { id: 'shl-wind-chime', name: 'Wind Chime', type: 'ambience', icon: '🎐', color: '#fcd34d' },
  { id: 'shl-water', name: 'Water', type: 'ambience', icon: '💧', color: '#fef3c7' },
  { id: 'shl-bird', name: 'Bird', type: 'ambience', icon: '🐦', color: '#fef9c3' },
  { id: 'shl-leaves', name: 'Leaves', type: 'ambience', icon: '🍂', color: '#fbbf24' },
  { id: 'shl-cricket', name: 'Cricket', type: 'ambience', icon: '🦗', color: '#fef3c7' },
  { id: 'shl-wind', name: 'Wind', type: 'ambience', icon: '💨', color: '#fed7aa' },
  { id: 'shl-door', name: 'Door Creak', type: 'ambience', icon: '🚪', color: '#fdba74' },
];

export function getPackSources(pack: PackType): Source[] {
  switch (pack) {
    case 'adventure':
      return adventureSources;
    case 'combat':
      return combatSources;
    case 'shelter':
      return shelterSources;
    default:
      return adventureSources;
  }
}