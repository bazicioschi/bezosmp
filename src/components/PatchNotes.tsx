import { useState } from 'react';
import { X, ScrollText, Bug, Shield, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSoundEffects } from '@/hooks/useSoundEffects';

const PATCH_KEY = 'patch-notes-v1.3.0-dismissed';

const PATCH = {
  version: '1.3.0',
  date: 'May 29, 2026',
  entries: [
    {
      type: 'fix' as const,
      icon: Bug,
      label: 'BUG FIX',
      color: 'text-yellow-400',
      text: 'Fixed post editing — edited content now updates instantly without needing a page reload.',
    },
    {
      type: 'fix' as const,
      icon: Shield,
      label: 'BUG FIX',
      color: 'text-yellow-400',
      text: 'AutoMod bans now actually work — users who post inappropriate content are correctly temporarily banned.',
    },
    {
      type: 'feature' as const,
      icon: Shield,
      label: 'PROTECTION',
      color: 'text-green-400',
      text: 'Bazicioschi (server owner) is now immune to AutoMod bans and cannot be banned via the admin panel.',
    },
    {
      type: 'feature' as const,
      icon: Pencil,
      label: 'ADMIN',
      color: 'text-blue-400',
      text: 'Moderators can now use all admin panel commands on any user, including Bazicioschi (except ban).',
    },
  ],
};

export function PatchNotes() {
  const { playClick } = useSoundEffects();
  const [visible, setVisible] = useState(() => !localStorage.getItem(PATCH_KEY));

  const dismiss = () => {
    playClick();
    localStorage.setItem(PATCH_KEY, 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="minecraft-card p-4 mb-4 border-2 border-primary/40 relative">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-primary" />
          <span className="mc-text text-primary glow-text text-sm">PATCH NOTES — v{PATCH.version}</span>
          <span className="text-xs text-muted-foreground">{PATCH.date}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={dismiss} className="h-7 w-7 text-muted-foreground hover:text-foreground">
          <X className="h-3 w-3" />
        </Button>
      </div>

      <ul className="space-y-2">
        {PATCH.entries.map((entry, i) => {
          const Icon = entry.icon;
          return (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className={`mc-text text-xs font-bold shrink-0 mt-0.5 ${entry.color}`}>[{entry.label}]</span>
              <span className="text-foreground/80">{entry.text}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
