import { BadgeCheck } from 'lucide-react';
import { useIsVerified } from '@/hooks/useVerified';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface VerifiedBadgeProps {
  userId?: string | null;
  className?: string;
}

export function VerifiedBadge({ userId, className }: VerifiedBadgeProps) {
  const verified = useIsVerified(userId);
  if (!verified) return null;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn('inline-flex items-center', className)}>
            <BadgeCheck className="h-4 w-4 text-primary fill-primary/20" />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Verified by Bazicioschi</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
