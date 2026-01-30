import { Copy, Check, Gamepad2 } from 'lucide-react';
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
    <div className="bg-secondary/30 rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center bg-primary/20 rounded-xl">
          <Gamepad2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display font-bold text-foreground">Join Server</h2>
          <p className="text-xs text-muted-foreground">Minecraft Bedrock</p>
        </div>
      </div>

      <div className="bg-background rounded-xl p-3 mb-3">
        <p className="text-xs text-muted-foreground mb-1">Add this player:</p>
        <div className="flex items-center justify-between gap-2">
          <code className="font-display text-primary font-bold">
            {playerName}
          </code>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className={`h-8 px-3 rounded-full text-xs ${copied ? 'text-primary' : 'text-muted-foreground'}`}
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-2 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground text-xs uppercase tracking-wide">How to join:</p>
        <ol className="space-y-1.5 text-xs">
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-primary">1</span>
            <span>Open Minecraft Bedrock</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-primary">2</span>
            <span>Go to Friends tab</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-primary">3</span>
            <span>Add friend with gamertag</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-primary">4</span>
            <span>Join when online!</span>
          </li>
        </ol>
      </div>
    </div>
  );
}