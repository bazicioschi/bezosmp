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
  avatarUrl?: string | null;
}

export default function Support() {
  const { user } = useAuth();
  const { canModerate } = useAdmin();
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [contactName, setContactName] = useState('');
  const [anonSubmitted, setAnonSubmitted] = useState(false);
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

      setTickets(data.map(t => {
        const profile = profileMap.get(t.user_id);
        return {
          ...t,
          username: profile?.username || 'Unknown',
          avatarUrl: profile?.avatar_url || null,
        };
      }));
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

  const handleAnonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !subject.trim() || !message.trim()) return;

    setLoading(true);
    const { error } = await supabase.from('support_tickets').insert({
      user_id: null,
      contact_name: contactName.trim().slice(0, 50),
      subject: subject.trim(),
      message: message.trim(),
    } as any);

    if (!error) {
      setAnonSubmitted(true);
      setContactName('');
      setSubject('');
      setMessage('');
    } else {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  // Not signed in (e.g. banned users) — public contact form, no login required
  if (!user) {
    return (
      <div className="min-h-screen bg-background mc-bedrock">
        <Header />
        <main className="max-w-lg mx-auto p-4 relative z-10">
          <div className="minecraft-card p-6 mt-6">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h1 className="mc-text text-xl text-primary glow-text">CONTACT SUPPORT</h1>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              You don't need to be signed in. If your account is banned, submit a ban appeal here and the admins will review it.
            </p>
            {anonSubmitted ? (
              <div className="text-center py-8 space-y-3">
                <p className="mc-text text-lg text-primary">✅ Ticket submitted!</p>
                <p className="text-sm text-muted-foreground">The admins and mods will review your request.</p>
                <Button variant="outline" onClick={() => setAnonSubmitted(false)}>Send another ticket</Button>
              </div>
            ) : (
              <form onSubmit={handleAnonSubmit} className="space-y-4">
                <Input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Your username (so we know who you are)"
                  className="bg-secondary/50 border-2 border-border"
                  maxLength={50}
                  required
                />
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject (e.g. Ban appeal)"
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
                <Button type="submit" disabled={loading || !contactName.trim() || !subject.trim() || !message.trim()} className="mc-btn-primary w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Submit Ticket
                </Button>
              </form>
            )}
          </div>
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
                ticketAvatarUrl={selectedTicket.avatarUrl}
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
