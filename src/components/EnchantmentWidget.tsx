import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const fortunes = [
  "A diamond vein awaits you at Y=-59... 🔷",
  "Beware the creeper behind your base tonight 💥",
  "Your next enchantment will be Fortune III ⛏️",
  "An unexpected alliance forms at spawn 🤝",
  "The Ender Dragon fears your blade ⚔️",
  "A hidden temple lies 500 blocks east 🏛️",
  "Your farm will yield double crops tomorrow 🌾",
  "A skeleton horse waits in the next thunderstorm ⚡",
  "You will find a mending villager soon 📖",
  "Netherite is closer than you think 🟫",
  "A prank war is about to begin... 😈",
  "Your builds will inspire the whole server 🏰",
  "Luck of the Sea III is in your future 🎣",
  "A warden stirs beneath your feet... 🔊",
  "You'll tame a rare blue axolotl this week 🩵",
];

export function EnchantmentWidget() {
  const [fortune, setFortune] = useState<string | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [glyphs, setGlyphs] = useState('');

  const enchantGlyphs = 'ᔑ ʖ ᓵ ↸ ᒷ ⎓ ⊣ ⍑ ╎ ⋮ ꖌ ꖎ ᒲ リ 𝙹 !¡ ᑑ ∷ ᓭ ℸ ̣  ⚍ ⊬ ∴ ̇/ || ᓭ';

  const revealFortune = () => {
    setIsRevealing(true);
    setFortune(null);
    
    // Scramble through glyphs
    let count = 0;
    const interval = setInterval(() => {
      const randomGlyphs = Array.from({ length: 20 }, () => 
        enchantGlyphs[Math.floor(Math.random() * enchantGlyphs.length)]
      ).join('');
      setGlyphs(randomGlyphs);
      count++;
      if (count > 8) {
        clearInterval(interval);
        setGlyphs('');
        setFortune(fortunes[Math.floor(Math.random() * fortunes.length)]);
        setIsRevealing(false);
      }
    }, 120);
  };

  return (
    <div className="minecraft-card p-4 overflow-hidden">
      <h3 className="mc-text text-lg text-primary mb-3 glow-text flex items-center gap-2">
        <Sparkles className="h-4 w-4" /> ENCHANTMENT TABLE
      </h3>
      
      <div className="min-h-[60px] flex items-center justify-center rounded-lg bg-secondary/30 border-2 border-border p-3 mb-3">
        {isRevealing ? (
          <p className="text-center text-primary/80 font-mono text-sm animate-pulse tracking-widest">
            {glyphs}
          </p>
        ) : fortune ? (
          <p className="text-sm text-foreground/90 text-center leading-relaxed">
            {fortune}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground/60 mc-text text-center">
            Reveal your Minecraft fortune...
          </p>
        )}
      </div>

      <Button
        onClick={revealFortune}
        disabled={isRevealing}
        className="w-full mc-btn-primary"
        size="sm"
      >
        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
        <span className="mc-text">{isRevealing ? 'ENCHANTING...' : 'ENCHANT'}</span>
      </Button>
    </div>
  );
}
