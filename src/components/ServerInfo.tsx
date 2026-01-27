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
    <div className="minecraft-card glow-border p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 border border-primary/30 animate-pulse-glow">
          <Gamepad2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Join the Server</h2>
          <p className="text-sm text-muted-foreground">Minecraft Bedrock Edition</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg bg-secondary/50 p-4 border border-border">
          <p className="text-sm text-muted-foreground mb-2">Add this player to join:</p>
          <div className="flex items-center justify-between gap-3">
            <code className="font-display text-lg text-primary font-semibold tracking-wide">
              {playerName}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="shrink-0"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="text-sm text-muted-foreground space-y-2">
          <p className="font-medium text-foreground">How to join:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Open Minecraft Bedrock Edition</li>
            <li>Go to Friends tab</li>
            <li>Click "Add Friend"</li>
            <li>Enter the gamertag above</li>
            <li>Join their world when online!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
