import { cn } from '@/lib/utils';

interface OnlineStatusProps {
  isOnline?: boolean;
  className?: string;
  showLabel?: boolean;
}

export function OnlineStatus({ isOnline = false, className, showLabel = false }: OnlineStatusProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className={cn(
        "w-2.5 h-2.5 rounded-full border-2 border-background",
        isOnline 
          ? "bg-primary animate-pulse shadow-[0_0_8px_hsl(var(--primary)/0.6)]" 
          : "bg-muted-foreground/50"
      )} />
      {showLabel && (
        <span className={cn(
          "text-xs mc-text",
          isOnline ? "text-primary" : "text-muted-foreground"
        )}>
          {isOnline ? "ONLINE" : "OFFLINE"}
        </span>
      )}
    </div>
  );
}