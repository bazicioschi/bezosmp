import { useState, useEffect } from 'react';
import { Send, Loader2, MessageSquare, Plus, Inbox } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TicketList } from '@/components/support/TicketList';
import { TicketThread } from '@/components/support/TicketThread';
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
}

export default function Support() {
  const { user } = useAuth();
  const { canModerate } = useAdmin();
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [fetchingTickets, setFetchingTickets] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showNewTicket, setShowNewTicket] = useState(false);

  const selectedTicket = tickets.find(t => t.id === selectedTicketId) || null;

  const fetchTickets = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      const userIds = [...new Set(data.map(t => t.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      setTickets(data.map(t => ({
        ...t,
        username: profileMap.get(t.user_id) || 'Unknown',
      })));
    }
    setFetchingTickets(false);
  };

  useEffect(() => {
    fetchTickets();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !subject.trim() || !message.trim()) return;

    setLoading(true);
    const { error } = await supabase.from('support_tickets').insert({
      user_id: user.id,
      subject: subject.trim(),
      message: message.trim(),
    });

    if (!error) {
      setSubject('');
      setMessage('');
      setShowNewTicket(false);
      toast({ title: 'Ticket submitted!', description: 'We will review your request.' });
      await fetchTickets();
    } else {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background mc-bedrock">
        <Header />
        <main className="max-w-2xl mx-auto p-6 text-center">
          <p className="text-muted-foreground">Please <a href="/login" className="text-primary hover:underline">sign in</a> to access support.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background mc-bedrock">
      <Header />
      <main className="max-w-5xl mx-auto p-4 relative z-10">
        {/* Title bar */}
        <div className="minecraft-card p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Inbox className="h-5 w-5 text-primary" />
            <h1 className="mc-text text-xl text-primary glow-text">BEZO MAILBOX</h1>
          </div>
          <Button
            size="sm"
            className="mc-btn-primary"
            onClick={() => { setShowNewTicket(true); setSelectedTicketId(null); }}
          >
            <Plus className="h-4 w-4 mr-1" /> New Ticket
          </Button>
        </div>

        {/* Mailbox layout */}
        <div className="minecraft-card overflow-hidden flex" style={{ minHeight: '500px' }}>
          {/* Sidebar - ticket list */}
          <div className={cn(
            "w-full md:w-80 border-r-2 border-border/50 flex-shrink-0 overflow-y-auto",
            selectedTicketId && "hidden md:block"
          )}>
            <div className="p-3 border-b-2 border-border/50">
              <p className="mc-text text-xs text-muted-foreground uppercase tracking-wider">
                {canModerate ? 'All Tickets' : 'Your Tickets'}
              </p>
            </div>
            {fetchingTickets ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : (
              <TicketList
                tickets={tickets}
                selectedTicketId={selectedTicketId}
                onSelectTicket={(id) => { setSelectedTicketId(id); setShowNewTicket(false); }}
                canModerate={canModerate}
              />
            )}
          </div>

          {/* Main content area */}
          <div className={cn(
            "flex-1 flex flex-col",
            !selectedTicketId && !showNewTicket && "hidden md:flex"
          )}>
            {showNewTicket ? (
              <div className="p-6 max-w-lg mx-auto w-full">
                <h2 className="mc-text text-lg text-foreground mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" /> Submit a Ticket
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Subject (e.g. Ban appeal, Bug report)"
                    className="bg-secondary/50 border-2 border-border"
                    maxLength={100}
                    required
                  />
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your issue in detail..."
                    className="min-h-[150px] bg-secondary/50 border-2 border-border resize-none"
                    maxLength={2000}
                    required
                  />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => setShowNewTicket(false)}>Cancel</Button>
                    <Button type="submit" disabled={loading || !subject.trim() || !message.trim()} className="mc-btn-primary">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                      Submit
                    </Button>
                  </div>
                </form>
              </div>
            ) : selectedTicket ? (
              <TicketThread
                ticket={selectedTicket}
                canModerate={canModerate}
                onBack={() => setSelectedTicketId(null)}
                onTicketUpdated={fetchTickets}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-6">
                <div>
                  <Inbox className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground mc-text">Select a ticket to view</p>
                  <p className="text-muted-foreground/60 text-xs mt-1">Or create a new one</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
