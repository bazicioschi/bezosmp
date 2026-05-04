import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Mail, MailOpen, Trash2, Check, X, Inbox as InboxIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { useToast } from '@/hooks/use-toast';

interface InboxMessage {
  id: string;
  type: string;
  subject: string;
  body: string | null;
  data: any;
  read: boolean;
  created_at: string;
}

export default function Inbox() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { navigate('/login'); return; }
    if (!user) return;
    load();
    const channel = supabase
      .channel(`inbox-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inbox_messages', filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('inbox_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setMessages((data ?? []) as InboxMessage[]);
    setLoading(false);
  };

  const markRead = async (m: InboxMessage) => {
    if (m.read) return;
    await supabase.from('inbox_messages').update({ read: true }).eq('id', m.id);
  };

  const remove = async (m: InboxMessage) => {
    await supabase.from('inbox_messages').delete().eq('id', m.id);
  };

  const acceptInvite = async (m: InboxMessage) => {
    const collabId = m.data?.collab_id;
    const inviterId = m.data?.inviter_id;
    if (!collabId || !inviterId || !user) return;

    const { data: myProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('user_id', user.id)
      .single();

    const { error } = await supabase
      .from('post_collaborations')
      .update({ status: 'accepted' })
      .eq('id', collabId)
      .eq('invitee_id', user.id);

    if (error) {
      toast({ title: 'Could not accept', description: error.message, variant: 'destructive' });
      return;
    }

    // Notify the inviter
    await supabase.from('inbox_messages').insert({
      user_id: inviterId,
      type: 'collab_response',
      subject: `${myProfile?.username ?? 'Someone'} has accepted your invitation`,
      body: `They are ready to write the post about "${m.data?.subject}"`,
      data: { collab_id: collabId },
    });

    await supabase.from('inbox_messages').update({ read: true }).eq('id', m.id);
    toast({ title: 'Collaboration accepted!' });
    navigate(`/collab/${collabId}`);
  };

  const declineInvite = async (m: InboxMessage) => {
    const collabId = m.data?.collab_id;
    const inviterId = m.data?.inviter_id;
    if (!collabId || !inviterId || !user) return;

    const { data: myProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('user_id', user.id)
      .single();

    await supabase
      .from('post_collaborations')
      .update({ status: 'denied' })
      .eq('id', collabId)
      .eq('invitee_id', user.id);

    // Notify the inviter
    await supabase.from('inbox_messages').insert({
      user_id: inviterId,
      type: 'collab_response',
      subject: `${myProfile?.username ?? 'Someone'} has denied your invitation`,
      body: `They declined to collaborate on "${m.data?.subject}"`,
      data: { collab_id: collabId },
    });

    await remove(m);
    toast({ title: 'Invite declined' });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="mc-text text-2xl text-foreground glow-text mb-4 flex items-center gap-2">
          <InboxIcon className="h-6 w-6 text-primary" /> BEZO INBOX
        </h1>
        {messages.length === 0 ? (
          <div className="minecraft-card p-8 text-center text-muted-foreground">
            Your inbox is empty.
          </div>
        ) : (
          <ul className="space-y-2">
            {messages.map(m => (
              <li
                key={m.id}
                onClick={() => markRead(m)}
                className={`minecraft-card p-4 cursor-pointer transition-colors ${m.read ? 'opacity-70' : 'border-primary/40'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {m.read ? <MailOpen className="h-5 w-5 text-muted-foreground" /> : <Mail className="h-5 w-5 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="mc-text text-sm text-foreground">{m.subject}</p>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    {m.body && <p className="text-sm text-muted-foreground mt-1 break-words">{m.body}</p>}
                    {m.type === 'collab_invite' && (
                      <div className="mt-2 flex items-center gap-2">
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); acceptInvite(m); }} className="h-7 gap-1">
                          <Check className="h-3 w-3" /> Accept
                        </Button>
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); declineInvite(m); }} className="h-7 gap-1">
                          <X className="h-3 w-3" /> Decline
                        </Button>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); remove(m); }}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
