import { formatDistanceToNow } from 'date-fns';
import { Clock, Loader2, CheckCircle, HelpCircle, Mail, MailOpen, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: string;
  admin_response: string | null;
  created_at: string;
  username?: string;
  avatarUrl?: string | null;
}

interface TicketListProps {
  tickets: Ticket[];
  selectedTicketId: string | null;
  onSelectTicket: (id: string) => void;
  canModerate: boolean;
}

export function TicketList({ tickets, selectedTicketId, onSelectTicket, canModerate }: TicketListProps) {
  const statusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Clock className="h-3.5 w-3.5 text-yellow-500" />;
      case 'in_progress': return <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />;
      case 'resolved': return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
      default: return <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <Mail className="h-10 w-10 text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground text-sm">No tickets yet</p>
        <p className="text-muted-foreground/70 text-xs mt-1">Submit a ticket to get started</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/50">
      {tickets.map(ticket => {
        const isSelected = selectedTicketId === ticket.id;
        const isRead = ticket.status === 'resolved';

        return (
          <button
            key={ticket.id}
            onClick={() => onSelectTicket(ticket.id)}
            className={cn(
              "w-full text-left px-4 py-3 transition-colors hover:bg-accent/50",
              isSelected && "bg-accent/70 border-l-2 border-primary",
              !isSelected && "border-l-2 border-transparent"
            )}
          >
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5">
                <AvatarImage src={ticket.avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                  {ticket.username?.slice(0, 2).toUpperCase() || <User className="h-3 w-3" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className={cn(
                    "text-sm truncate",
                    !isRead ? "font-semibold text-foreground" : "text-foreground/80"
                  )}>
                    {ticket.subject}
                  </h3>
                  {statusIcon(ticket.status)}
                </div>
                {canModerate && ticket.username && (
                  <p className="text-xs text-muted-foreground mt-0.5">@{ticket.username}</p>
                )}
                <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-1">{ticket.message}</p>
                <p className="text-[10px] text-muted-foreground/50 mt-1">
                  {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
