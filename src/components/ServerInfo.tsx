import { Copy, Check, Gamepad2, Sword, Shield, Pickaxe } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function ServerInfo() {
  const [copied, setCopied] = useState(false);
  const playerName = "Bazicioschi";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(playerName);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="minecraft-card minecraft-border minecraft-grass-top glow-border p-6 md:p-8">
      {/* Minecraft-style header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-12 w-12 items-center justify-center bg-primary/20 border-2 border-primary/30 animate-pulse-glow minecraft-slot">
          <Gamepad2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-foreground glow-text">JOIN THE SERVER</h2>
          <p className="text-sm text-muted-foreground font-display tracking-wide">Minecraft Bedrock Edition</p>
        </div>
      </div>

      {/* Stats display */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="minecraft-slot p-3 text-center">
          <Sword className="h-5 w-5 text-primary mx-auto mb-1" />
          <span className="text-xs text-muted-foreground font-display">PVP</span>
        </div>
        <div className="minecraft-slot p-3 text-center">
          <Shield className="h-5 w-5 text-primary mx-auto mb-1" />
          <span className="text-xs text-muted-foreground font-display">SMP</span>
        </div>
        <div className="minecraft-slot p-3 text-center">
          <Pickaxe className="h-5 w-5 text-primary mx-auto mb-1" />
          <span className="text-xs text-muted-foreground font-display">BUILD</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="minecraft-slot p-4">
          <p className="text-sm text-muted-foreground mb-2 font-display">ADD THIS PLAYER:</p>
          <div className="flex items-center justify-between gap-3">
            <code className="font-display text-lg text-primary font-bold tracking-wide glow-text">
              {playerName}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className={`shrink-0 minecraft-border font-display transition-all ${copied ? 'bg-primary/20 animate-success' : ''}`}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  COPIED!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  COPY
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="text-sm text-muted-foreground space-y-2">
          <p className="font-display font-semibold text-foreground glow-text">HOW TO JOIN:</p>
          <ol className="list-none space-y-2 text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="w-6 h-6 minecraft-slot flex items-center justify-center text-xs font-display font-bold text-primary">1</span>
              <span className="font-display text-sm">Open Minecraft Bedrock</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-6 h-6 minecraft-slot flex items-center justify-center text-xs font-display font-bold text-primary">2</span>
              <span className="font-display text-sm">Go to Friends tab</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-6 h-6 minecraft-slot flex items-center justify-center text-xs font-display font-bold text-primary">3</span>
              <span className="font-display text-sm">Click "Add Friend"</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-6 h-6 minecraft-slot flex items-center justify-center text-xs font-display font-bold text-primary">4</span>
              <span className="font-display text-sm">Enter gamertag above</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-6 h-6 minecraft-slot flex items-center justify-center text-xs font-display font-bold text-primary">5</span>
              <span className="font-display text-sm">Join when online!</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
