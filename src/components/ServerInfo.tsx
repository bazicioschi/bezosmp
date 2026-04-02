import { Copy, Check, Globe, Sword, Shield, Pickaxe } from 'lucide-react';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';

export function ServerInfo() {
  const [copied, setCopied] = useState(false);
  const playerName = "Bazicioschi";
  const containerRef = useRef<HTMLDivElement>(null);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(playerName);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY > 0) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  };

  return (
    <div className="minecraft-card p-4" ref={containerRef} onWheel={handleWheel}>
      {/* Header with redstone accent */}
      <div className="h-1 bg-primary redstone-glow mb-4 -mt-4 -mx-4" />
      
      <div className="flex items-center gap-3 mb-4">
        <div className="mc-slot h-12 w-12 flex items-center justify-center mc-slot-active">
          <Globe className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="mc-text text-xl text-foreground glow-text">JOIN SERVER</h2>
          <p className="text-xs text-muted-foreground">Minecraft Bedrock Edition</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="mc-slot p-2 text-center hover:mc-slot-active transition-all cursor-pointer">
          <Sword className="h-4 w-4 text-primary mx-auto mb-1" />
          <span className="text-xs text-muted-foreground mc-text">PVP</span>
        </div>
        <div className="mc-slot p-2 text-center hover:mc-slot-active transition-all cursor-pointer">
          <Shield className="h-4 w-4 text-primary mx-auto mb-1" />
          <span className="text-xs text-muted-foreground mc-text">SMP</span>
        </div>
        <div className="mc-slot p-2 text-center hover:mc-slot-active transition-all cursor-pointer">
          <Pickaxe className="h-4 w-4 text-primary mx-auto mb-1" />
          <span className="text-xs text-muted-foreground mc-text">BUILD</span>
        </div>
      </div>

      {/* Gamertag */}
      <div className="mc-slot p-3 mb-4">
        <p className="text-xs text-muted-foreground mb-1 mc-text">ADD THIS PLAYER:</p>
        <div className="flex items-center justify-between gap-2">
          <code className="mc-text text-lg text-primary glow-text">
            {playerName}
          </code>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className={`h-7 px-2 mc-slot hover:mc-slot-active ${copied ? 'text-primary' : 'text-muted-foreground'}`}
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                <span className="mc-text text-xs">OK!</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 mr-1" />
                <span className="mc-text text-xs">COPY</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="space-y-2">
        <p className="mc-text text-sm text-primary glow-text">HOW TO JOIN:</p>
        <ol className="space-y-1.5">
          {[
            'Open Minecraft Bedrock',
            'Go to Friends tab',
            'Click "Add Friend"',
            'Enter gamertag above',
            'Join when online!'
          ].map((step, i) => (
            <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="mc-slot w-5 h-5 flex items-center justify-center mc-text text-primary text-xs">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}