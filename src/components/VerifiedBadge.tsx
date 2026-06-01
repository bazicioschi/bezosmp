import { BadgeCheck } from 'lucide-react';
import { useVerifiedColor, type BadgeColor } from '@/hooks/useVerified';
import { useTheme } from '@/hooks/useTheme';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface VerifiedBadgeProps {
  userId?: string | null;
  className?: string;
}

const COLOR_CLASSES: Record<Exclude<BadgeColor, 'default'>, string> = {
  red:    'text-red-500 fill-red-500/20',
  blue:   'text-blue-500 fill-blue-500/20',
  green:  'text-green-500 fill-green-500/20',
  gold:   'text-yellow-400 fill-yellow-400/20',
  purple: 'text-purple-500 fill-purple-500/20',
  pink:   'text-pink-500 fill-pink-500/20',
  cyan:   'text-cyan-400 fill-cyan-400/20',
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

  const colorClass =
    color === 'default' || !COLOR_CLASSES[color as Exclude<BadgeColor, 'default'>]
      ? themeDefaultClass(theme)
      : COLOR_CLASSES[color as Exclude<BadgeColor, 'default'>];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn('inline-flex items-center', className)}>
            <BadgeCheck className={cn('h-4 w-4', colorClass)} />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Verified by Bazicioschi</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
