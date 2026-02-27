import { useState, useEffect } from 'react';
import { Send, Loader2, HelpCircle, CheckCircle, Clock, MessageSquare } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

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
  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [fetchingTickets, setFetchingTickets] = useState(true);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [adminResponse, setAdminResponse] = useState('');

  const fetchTickets = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      // Fetch usernames for tickets
      const userIds = [...new Set(data.map(t => t.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.username]) || []);
      
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
      toast({ title: 'Ticket submitted!', description: 'We will review your request.' });
      fetchTickets();
    } else {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleRespond = async (ticketId: string) => {
    if (!adminResponse.trim()) return;

    const { error } = await supabase
      .from('support_tickets')
      .update({
        admin_response: adminResponse.trim(),
        responded_by: user?.id,
        status: 'resolved',
      })
      .eq('id', ticketId);

    if (!error) {
      toast({ title: 'Response sent!' });
      setRespondingTo(null);
      setAdminResponse('');
      fetchTickets();
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Clock className="h-4 w-4 text-primary" />;
      case 'in_progress': return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-primary" />;
      default: return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
    }
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
      <main className="max-w-2xl mx-auto p-4 relative z-10">
        <div className="minecraft-card p-6 mb-6">
          <h1 className="mc-text text-2xl text-primary glow-text mb-2 flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            BEZO SUPPORT
          </h1>
          <p className="text-muted-foreground text-sm">
            Need help? Got banned unfairly? Submit a ticket and our team will review it.
          </p>
        </div>

        {/* Submit ticket form */}
        <form onSubmit={handleSubmit} className="minecraft-card p-4 mb-6 space-y-4">
          <h2 className="mc-text text-lg text-foreground">Submit a Ticket</h2>
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
            className="min-h-[120px] bg-secondary/50 border-2 border-border resize-none"
            maxLength={2000}
            required
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={loading || !subject.trim() || !message.trim()} className="mc-btn-primary">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Submit Ticket
            </Button>
          </div>
        </form>

        {/* Tickets list */}
        <div className="space-y-4">
          <h2 className="mc-text text-lg text-foreground">
            {isAdmin ? 'All Tickets' : 'Your Tickets'}
          </h2>
          {fetchingTickets ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="minecraft-card p-6 text-center">
              <p className="text-muted-foreground">No tickets yet.</p>
            </div>
          ) : (
            tickets.map(ticket => (
              <div key={ticket.id} className="minecraft-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {isAdmin && (
                      <span className="text-xs text-muted-foreground">from @{ticket.username}</span>
                    )}
                    <h3 className="font-semibold text-foreground">{ticket.subject}</h3>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    {statusIcon(ticket.status)}
                    <span className="capitalize text-muted-foreground">{ticket.status}</span>
                  </div>
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap">{ticket.message}</p>

                {ticket.admin_response && (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                    <p className="text-xs font-semibold text-primary mb-1">Admin Response:</p>
                    <p className="text-sm text-foreground/90">{ticket.admin_response}</p>
                  </div>
                )}

                {isAdmin && !ticket.admin_response && (
                  <div>
                    {respondingTo === ticket.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={adminResponse}
                          onChange={(e) => setAdminResponse(e.target.value)}
                          placeholder="Write your response..."
                          className="min-h-[80px] bg-secondary/50 border-2 border-border resize-none"
                        />
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => setRespondingTo(null)}>Cancel</Button>
                          <Button size="sm" onClick={() => handleRespond(ticket.id)} className="mc-btn-primary">Send Response</Button>
                        </div>
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => { setRespondingTo(ticket.id); setAdminResponse(''); }}>
                        Reply
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
