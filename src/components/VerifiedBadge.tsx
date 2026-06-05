import { BadgeCheck } from 'lucide-react';
import { useVerifiedColor, type BadgeColor } from '@/hooks/useVerified';
import { useTheme } from '@/hooks/useTheme';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface VerifiedBadgeProps {
  userId?: string | null;
  className?: string;
}

const COLOR_CLASSES: Record<string, string> = {
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
  magenta:  'text-[#ff00ff] fill-[#ff00ff]/20',
  crimson:  'text-[#dc143c] fill-[#dc143c]/20',
  mint:     'text-[#3eb489] fill-[#3eb489]/20',
  coral:    'text-[#ff7f50] fill-[#ff7f50]/20',
  lavender: 'text-[#b497d6] fill-[#b497d6]/20',
  neon:     'text-[#39ff14] fill-[#39ff14]/20',
  bronze:   'text-[#cd7f32] fill-[#cd7f32]/20',
};

const COLOR_LABELS: Record<string, string> = {
  default: 'Default',
  red: 'Red', blue: 'Blue', green: 'Green', gold: 'Gold', purple: 'Purple',
  pink: 'Pink', cyan: 'Cyan', orange: 'Orange', lime: 'Lime', teal: 'Teal',
  indigo: 'Indigo', rose: 'Rose', amber: 'Amber', emerald: 'Emerald',
  sky: 'Sky', fuchsia: 'Fuchsia', violet: 'Violet', slate: 'Slate',
  white: 'White', black: 'Black', magenta: 'Magenta', crimson: 'Crimson',
  mint: 'Mint', coral: 'Coral', lavender: 'Lavender', neon: 'Neon Green',
  bronze: 'Bronze', rainbow: 'Rainbow', ladybug: 'Ladybug',
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

function LadybugIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {/* antennas */}
      <path d="M9 4 L7 1.5" stroke="#111" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M15 4 L17 1.5" stroke="#111" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <circle cx="7" cy="1.5" r="0.9" fill="#111" />
      <circle cx="17" cy="1.5" r="0.9" fill="#111" />
      {/* head */}
      <ellipse cx="12" cy="5.5" rx="3.2" ry="2.2" fill="#111" />
      {/* body */}
      <ellipse cx="12" cy="14" rx="8" ry="8" fill="#e11d48" stroke="#111" strokeWidth="1" />
      {/* center line */}
      <path d="M12 7 L12 21.5" stroke="#111" strokeWidth="1" />
      {/* spots */}
      <circle cx="8"  cy="11" r="1.3" fill="#111" />
      <circle cx="16" cy="11" r="1.3" fill="#111" />
      <circle cx="7.5" cy="16" r="1.1" fill="#111" />
      <circle cx="16.5" cy="16" r="1.1" fill="#111" />
      <circle cx="12" cy="19" r="0.9" fill="#111" />
    </svg>
  );
}

export function VerifiedBadge({ userId, className }: VerifiedBadgeProps) {
  const color = useVerifiedColor(userId);
  const { theme } = useTheme();
  if (!color) return null;

  const isRainbow = color === 'rainbow';
  const isLadybug = color === 'ladybug';
  const colorClass =
    color === 'default' || (!isRainbow && !isLadybug && !COLOR_CLASSES[color])
      ? themeDefaultClass(theme)
      : isRainbow || isLadybug
        ? ''
        : COLOR_CLASSES[color];

  const label = COLOR_LABELS[color] ?? 'Verified';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className={cn('inline-flex items-center cursor-pointer', className)}
          aria-label={`Verified — ${label}`}
        >
          {isLadybug ? (
            <LadybugIcon className="h-4 w-4" />
          ) : (
            <BadgeCheck
              className={cn('h-4 w-4', colorClass)}
              style={isRainbow ? {
                stroke: 'url(#rainbow-grad)',
                fill: 'url(#rainbow-grad)',
                fillOpacity: 0.2,
              } as any : undefined}
            />
          )}
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
      <PopoverContent className="w-64 text-xs leading-relaxed space-y-1">
        <div className="font-display text-sm font-semibold flex items-center gap-1.5">
          {isLadybug && <LadybugIcon className="h-3.5 w-3.5" />}
          {label} verification badge
        </div>
        {isLadybug ? (
          <p>
            The <span className="font-semibold">Ladybug</span> verification badge is a unique custom badge
            given exclusively to <span className="text-primary font-medium">@Bazicioschi</span> — the founder of bezoSMP.
          </p>
        ) : (
          <p>
            This verification badge (color: <span className="font-semibold">{label}</span>) was given to this account
            by the owner for being a team account or for reaching past 1000 followers.
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
