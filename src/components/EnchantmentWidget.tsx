import { useState, useEffect } from 'react';
import { Sparkles, BookOpen, Sword, Shield, Pickaxe, Gem } from 'lucide-react';
import { Button } from '@/components/ui/button';

const enchantments: Record<string, { name: string; options: string[] }> = {
  sword: {
    name: 'Diamond Sword',
    options: [
      'Sharpness V ⚔️',
      'Fire Aspect II 🔥',
      'Looting III 💰',
      'Smite V 💀',
      'Knockback II 💨',
      'Sweeping Edge III 🌀',
    ],
  },
  pickaxe: {
    name: 'Diamond Pickaxe',
    options: [
      'Fortune III ⛏️',
      'Efficiency V ⚡',
      'Silk Touch 🧊',
      'Unbreaking III 🛡️',
      'Mending 📖',
    ],
  },
  shield: {
    name: 'Shield',
    options: [
      'Unbreaking III 🛡️',
      'Mending 📖',
      'Curse of Vanishing 👻',
    ],
  },
  book: {
    name: 'Book',
    options: [
      'Mending 📖',
      'Infinity ♾️',
      'Thorns III 🌹',
      'Protection IV 🔰',
      'Feather Falling IV 🪶',
      'Respiration III 🫧',
    ],
  },
};

const items = [
  { id: 'sword', icon: Sword, label: 'Sword' },
  { id: 'pickaxe', icon: Pickaxe, label: 'Pickaxe' },
  { id: 'shield', icon: Shield, label: 'Shield' },
  { id: 'book', icon: BookOpen, label: 'Book' },
];

const enchantGlyphs = 'ᔑʖᓵ↸ᒷ⎓⊣⍑╎⋮ꖌꖎᒲリ𝙹ᑑ∷ᓭℸ⚍⊬∴';

export function EnchantmentWidget() {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isEnchanting, setIsEnchanting] = useState(false);
  const [glyphs, setGlyphs] = useState('');
  const [xpCost, setXpCost] = useState<number | null>(null);
  const [floatingGlyphs, setFloatingGlyphs] = useState<string[]>([]);

  // Ambient floating glyphs
  useEffect(() => {
    const interval = setInterval(() => {
      setFloatingGlyphs(
        Array.from({ length: 6 }, () =>
          enchantGlyphs[Math.floor(Math.random() * enchantGlyphs.length)]
        )
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const enchant = () => {
    if (!selectedItem) return;
    setIsEnchanting(true);
    setResult(null);
    setXpCost(null);

    let count = 0;
    const interval = setInterval(() => {
      setGlyphs(
        Array.from({ length: 16 }, () =>
          enchantGlyphs[Math.floor(Math.random() * enchantGlyphs.length)]
        ).join(' ')
      );
      count++;
      if (count > 10) {
        clearInterval(interval);
        setGlyphs('');
        const opts = enchantments[selectedItem].options;
        setResult(opts[Math.floor(Math.random() * opts.length)]);
        setXpCost(Math.floor(Math.random() * 27) + 3);
        setIsEnchanting(false);
      }
    }, 100);
  };

  return (
    <div className="minecraft-card p-4 overflow-hidden relative">
      {/* Ambient floating glyphs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {floatingGlyphs.map((g, i) => (
          <span
            key={i}
            className="absolute text-primary/15 text-lg animate-pulse"
            style={{
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.3}s`,
            }}
          >
            {g}
          </span>
        ))}
      </div>

      <h3 className="mc-text text-lg text-primary mb-3 glow-text flex items-center gap-2 relative z-10">
        <Sparkles className="h-4 w-4" /> ENCHANTMENT TABLE
      </h3>

      {/* Item Selector */}
      <div className="grid grid-cols-4 gap-1.5 mb-3 relative z-10">
        {items.map((item) => {
          const Icon = item.icon;
          const isSelected = selectedItem === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setSelectedItem(item.id);
                setResult(null);
                setXpCost(null);
              }}
              disabled={isEnchanting}
              className={`mc-slot flex flex-col items-center gap-1 py-2 px-1 transition-all duration-200 ${
                isSelected
                  ? 'ring-2 ring-primary bg-primary/10 scale-105'
                  : 'hover:bg-secondary/50'
              }`}
            >
              <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`mc-text text-[10px] ${isSelected ? 'text-primary' : 'text-muted-foreground/70'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Result Area */}
      <div className="min-h-[70px] flex flex-col items-center justify-center rounded-lg bg-secondary/30 border-2 border-border p-3 mb-3 relative z-10">
        {isEnchanting ? (
          <p className="text-center text-primary/80 font-mono text-sm animate-pulse tracking-widest">
            {glyphs}
          </p>
        ) : result ? (
          <div className="text-center animate-fade-in">
            <p className="text-sm text-foreground/90 font-semibold mb-1">{result}</p>
            <div className="flex items-center justify-center gap-1">
              <Gem className="h-3 w-3 text-chart-4" />
              <span className="mc-text text-xs text-chart-4">{xpCost} LEVELS</span>
            </div>
          </div>
        ) : selectedItem ? (
          <p className="text-xs text-muted-foreground/70 mc-text text-center">
            {enchantments[selectedItem].name} ready...
          </p>
        ) : (
          <p className="text-xs text-muted-foreground/60 mc-text text-center">
            Select an item to enchant
          </p>
        )}
      </div>

      {/* Enchant Button */}
      <Button
        onClick={enchant}
        disabled={isEnchanting || !selectedItem}
        className="w-full mc-btn-primary"
        size="sm"
      >
        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
        <span className="mc-text">{isEnchanting ? 'ENCHANTING...' : 'ENCHANT'}</span>
      </Button>
    </div>
  );
}
