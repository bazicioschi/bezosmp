import { BadgeCheck } from 'lucide-react';
import { useVerifiedColor, type BadgeColor } from '@/hooks/useVerified';
import { useTheme } from '@/hooks/useTheme';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface VerifiedBadgeProps {
  userId?: string | null;
  className?: string;
}

const COLOR_CLASSES: Record<Exclude<BadgeColor, 'default' | 'rainbow'>, string> = {
  red:      'text-red-500 fill-red-500/20',
  blue:     'text-blue-500 fill-blue-500/20',
  green:    'text-green-500 fill-green-500/20',
  gold:     'text-yellow-400 fill-yellow-400/20',
  purple:   'text-purple-500 fill-purple-500/20',
  pink:     'text-pink-500 fill-pink-500/20',
  cyan:     'text-cyan-400 fill-cyan-400/20',
  orange:   'text-orange-500 fill-orange-500/20',
  lime:     'text-lime-400 fill-lime-400/20',
  teal:     'text-teal-400 fill-teal-400/20',
  indigo:   'text-indigo-500 fill-indigo-500/20',
  rose:     'text-rose-500 fill-rose-500/20',
  amber:    'text-amber-500 fill-amber-500/20',
  emerald:  'text-emerald-500 fill-emerald-500/20',
  sky:      'text-sky-400 fill-sky-400/20',
  fuchsia:  'text-fuchsia-500 fill-fuchsia-500/20',
  violet:   'text-violet-500 fill-violet-500/20',
  slate:    'text-slate-400 fill-slate-400/20',
  white:    'text-white fill-white/20',
  black:    'text-black fill-black/20',
};

function themeDefaultClass(theme: string): string {
  switch (theme) {
    case 'ghast':    return 'text-gray-400 fill-gray-400/20';
    case 'bazimazi': return 'text-red-300 fill-red-300/20';
    case 'pizza':    return 'text-[hsl(80_60%_50%)] fill-[hsl(80_60%_50%)]/20';
    case 'buzzy':    return 'text-yellow-400 fill-yellow-400/20';
    case 'cato':     return 'text-pink-400 fill-pink-400/20';
    case 'light':    return 'text-red-600 fill-red-600/20';
    default:         return 'text-primary fill-primary/20';
  }
}

export function VerifiedBadge({ userId, className }: VerifiedBadgeProps) {
  const color = useVerifiedColor(userId);
  const { theme } = useTheme();
  if (!color) return null;

  const isRainbow = color === 'rainbow';
  const colorClass =
    color === 'default' || (!isRainbow && !COLOR_CLASSES[color as Exclude<BadgeColor, 'default' | 'rainbow'>])
      ? themeDefaultClass(theme)
      : isRainbow
        ? ''
        : COLOR_CLASSES[color as Exclude<BadgeColor, 'default' | 'rainbow'>];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className={cn('inline-flex items-center cursor-pointer', className)}
          aria-label="Verified"
        >
          <BadgeCheck
            className={cn('h-4 w-4', colorClass)}
            style={isRainbow ? {
              stroke: 'url(#rainbow-grad)',
              fill: 'url(#rainbow-grad)',
              fillOpacity: 0.2,
            } as any : undefined}
          />
          {isRainbow && (
            <svg width="0" height="0" className="absolute">
              <defs>
                <linearGradient id="rainbow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="25%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#10b981" />
                  <stop offset="75%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 text-xs leading-relaxed">
        This verification badge was given to this account by the owner for being a team account or by reaching past 1000 followers.
      </PopoverContent>
    </Popover>
  );
}
