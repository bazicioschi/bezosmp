import { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Send, Loader2, ArrowLeft, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: string;
  admin_response: string | null;
  created_at: string;
  username?: string;
}

interface Reply {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  created_at: string;
  username?: string;
  avatar_url?: string | null;
  is_staff?: boolean;
}

interface TicketThreadProps {
  ticket: Ticket;
  canModerate: boolean;
  onBack: () => void;
  onTicketUpdated: () => void;
  ticketAvatarUrl?: string | null;
}

export function TicketThread({ ticket, canModerate, onBack, onTicketUpdated, ticketAvatarUrl }: TicketThreadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [replies, setReplies] = useState<Reply[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchReplies = async () => {
    const { data } = await supabase
      .from('ticket_replies')
      .select('*')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true });

    if (data) {
      const userIds = [...new Set(data.map(r => r.user_id))];
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from('profiles').select('user_id, username, avatar_url').in('user_id', userIds),
        supabase.from('user_roles').select('user_id, role').in('user_id', userIds),
      ]);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

      setReplies(data.map(r => {
        const profile = profileMap.get(r.user_id);
        return {
          ...r,
          username: profile?.username || 'Unknown',
          avatar_url: profile?.avatar_url || null,
          is_staff: roleMap.get(r.user_id) === 'admin' || roleMap.get(r.user_id) === 'moderator',
        };
      }));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReplies();

    const channel = supabase
      .channel(`ticket-${ticket.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ticket_replies',
        filter: `ticket_id=eq.${ticket.id}`,
      }, () => {
        fetchReplies();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [ticket.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [replies]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;
    setSending(true);

    const { error } = await supabase.from('ticket_replies').insert({
      ticket_id: ticket.id,
      user_id: user.id,
      message: newMessage.trim(),
    });

    if (!error) {
      if (canModerate && ticket.status === 'open') {
        await supabase
          .from('support_tickets')
          .update({ status: 'in_progress', admin_response: newMessage.trim(), responded_by: user.id })
          .eq('id', ticket.id);
        onTicketUpdated();
      }
      setNewMessage('');
      fetchReplies();
    } else {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
    setSending(false);
  };

  const handleResolve = async () => {
    await supabase.from('support_tickets').update({ status: 'resolved' }).eq('id', ticket.id);
    onTicketUpdated();
    toast({ title: 'Ticket resolved!' });
  };

  const canReply = ticket.user_id === user?.id || canModerate;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b-2 border-border/50 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden shrink-0" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="mc-text text-base text-foreground truncate">{ticket.subject}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground">from @{ticket.username}</span>
            <span className="text-[10px] text-muted-foreground/60">•</span>
            {ticket.status === 'resolved' ? (
              <span className="flex items-center gap-1 text-xs text-green-500">
                <CheckCircle className="h-3 w-3" /> Resolved
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-yellow-500">
                <Clock className="h-3 w-3" /> {ticket.status === 'in_progress' ? 'In Progress' : 'Open'}
              </span>
            )}
          </div>
        </div>
        {canModerate && ticket.status !== 'resolved' && (
          <Button size="sm" variant="outline" onClick={handleResolve} className="shrink-0 text-xs">
            <CheckCircle className="h-3.5 w-3.5 mr-1" /> Resolve
          </Button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Original message */}
        <div className="flex gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={ticketAvatarUrl || undefined} />
            <AvatarFallback className="bg-secondary text-xs">
              {(ticket.username || '?')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-foreground">@{ticket.username}</span>
              <span className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
              </span>
            </div>
            <div className="mt-1 bg-secondary/50 rounded-lg p-3 text-sm text-foreground/90 whitespace-pre-wrap">
              {ticket.message}
            </div>
          </div>
        </div>

        {/* Legacy admin response */}
        {ticket.admin_response && replies.length === 0 && (
          <div className="flex gap-3 justify-end">
            <div className="flex-1 max-w-[85%]">
              <div className="flex items-baseline gap-2 justify-end">
                <span className="text-[10px] text-muted-foreground">Staff response</span>
              </div>
              <div className="mt-1 bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm text-foreground/90">
                {ticket.admin_response}
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}

        {/* Replies */}
        {replies.map(reply => {
          const isStaff = reply.is_staff;
          return (
            <div key={reply.id} className={`flex gap-3 ${isStaff ? 'justify-end' : ''}`}>
              {!isStaff && (
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={reply.avatar_url || undefined} />
                  <AvatarFallback className="bg-secondary text-xs">
                    {(reply.username || '?')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className={`flex-1 ${isStaff ? 'max-w-[85%]' : ''}`}>
                <div className={`flex items-baseline gap-2 ${isStaff ? 'justify-end' : ''}`}>
                  <span className="text-sm font-semibold text-foreground">
                    @{reply.username}
                    {isStaff && (
                      <span className="ml-1.5 text-[10px] font-normal bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                        Staff
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                  </span>
                </div>
                <div className={`mt-1 rounded-lg p-3 text-sm text-foreground/90 whitespace-pre-wrap ${
                  isStaff ? 'bg-primary/10 border border-primary/20' : 'bg-secondary/50'
                }`}>
                  {reply.message}
                </div>
              </div>
              {isStaff && (
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={reply.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {(reply.username || '?')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          );
        })}
      </div>

      {/* Reply input */}
      {canReply && ticket.status !== 'resolved' && (
        <div className="p-3 border-t-2 border-border/50">
          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your reply..."
              className="min-h-[60px] max-h-[120px] bg-secondary/50 border-2 border-border resize-none flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              onClick={handleSend}
              disabled={sending || !newMessage.trim()}
              className="mc-btn-primary self-end"
              size="icon"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}

      {ticket.status === 'resolved' && (
        <div className="p-3 border-t-2 border-border/50 text-center">
          <p className="text-xs text-muted-foreground">This ticket has been resolved.</p>
        </div>
      )}
    </div>
  );
}