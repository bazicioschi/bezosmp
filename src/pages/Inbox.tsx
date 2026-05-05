import { useEffect, useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { Loader2, Mail, MailOpen, Trash2, Check, X, Inbox as InboxIcon, PenSquare, Reply, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/hooks/useTheme';

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
  const { theme } = useTheme();
  const inboxBg = (theme === 'dark' || theme === 'pizza') ? 'bg-black' : 'bg-white';
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [senderProfiles, setSenderProfiles] = useState<Record<string, { username: string; avatar_url: string | null }>>({});
  const [composeOpen, setComposeOpen] = useState(false);
  const [toUsername, setToUsername] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [suggestions, setSuggestions] = useState<{ user_id: string; username: string; avatar_url: string | null }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const q = toUsername.trim();
    if (!q || !composeOpen) { setSuggestions([]); return; }
    debounceRef.current = window.setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .ilike('username', `${q}%`)
        .neq('user_id', user?.id ?? '')
        .limit(6);
      setSuggestions(data ?? []);
    }, 200);
  }, [toUsername, composeOpen, user?.id]);

  const sendEmail = async () => {
    if (!user || !toUsername.trim() || !subject.trim()) return;
    setSending(true);
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id, username')
      .ilike('username', toUsername.trim())
      .maybeSingle();
    if (!profile) {
      toast({ title: 'User not found', variant: 'destructive' });
      setSending(false);
      return;
    }
    const { data: me } = await supabase
      .from('profiles')
      .select('username')
      .eq('user_id', user.id)
      .maybeSingle();
    const { error } = await supabase.from('inbox_messages').insert({
      user_id: profile.user_id,
      type: 'mail',
      subject: subject.trim(),
      body: body.trim() || null,
      data: { from_user_id: user.id, sender_id: user.id, from_username: me?.username },
    });
    if (error) {
      toast({ title: 'Failed to send', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `Email sent to ${profile.username}` });
      setComposeOpen(false);
      setToUsername(''); setSubject(''); setBody('');
    }
    setSending(false);
  };
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);

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
    const msgs = (data ?? []) as InboxMessage[];
    setMessages(msgs);
    setLoading(false);

    // Fetch sender profiles for avatars
    const senderIds = [...new Set(
      msgs.map(m => m.data?.from_user_id || m.data?.sender_id || m.data?.inviter_id).filter(Boolean) as string[]
    )];
    if (senderIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', senderIds);
      if (profiles) {
        const map: Record<string, { username: string; avatar_url: string | null }> = {};
        profiles.forEach(p => { map[p.user_id] = { username: p.username, avatar_url: p.avatar_url }; });
        setSenderProfiles(map);
      }
    }
  };

  const markRead = async (m: InboxMessage) => {
    if (m.read) return;
    await supabase.from('inbox_messages').update({ read: true }).eq('id', m.id);
  };

  const remove = async (m: InboxMessage) => {
    setMessages(prev => prev.filter(msg => msg.id !== m.id));
    const { error } = await supabase.from('inbox_messages').delete().eq('id', m.id);
    if (error) {
      toast({ title: 'Failed to delete', description: error.message, variant: 'destructive' });
      setMessages(prev => [m, ...prev].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    }
  };

  const sendReply = async (m: InboxMessage) => {
    if (!user || !replyText.trim()) return;
    const recipientId = m.data?.inviter_id || m.data?.sender_id || m.data?.from_user_id;
    if (!recipientId) {
      // Try lookup by username as fallback
      const senderUsername = m.data?.from_username || m.data?.sender_username;
      if (senderUsername) {
        const { data: found } = await supabase
          .from('profiles')
          .select('user_id')
          .ilike('username', senderUsername)
          .maybeSingle();
        if (!found) {
          toast({ title: 'Cannot reply', description: 'Sender not found.', variant: 'destructive' });
          return;
        }
        return sendReplyTo(m, found.user_id);
      }
      toast({ title: 'Cannot reply', description: 'No sender info found.', variant: 'destructive' });
      return;
    }
    return sendReplyTo(m, recipientId);
  };

  const sendReplyTo = async (m: InboxMessage, recipientId: string) => {
    setReplySending(true);
    const { data: myProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('user_id', user!.id)
      .maybeSingle();
    const { error } = await supabase.from('inbox_messages').insert({
      user_id: recipientId,
      type: 'inbox_reply',
      subject: `Re: ${m.subject}`,
      body: replyText.trim(),
      data: { sender_id: user!.id, from_user_id: user!.id, sender_username: myProfile?.username ?? 'Someone' },
    });
    if (error) {
      console.error('Reply insert error:', error);
      toast({ title: 'Failed to send reply', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Reply sent!' });
      setReplyingTo(null);
      setReplyText('');
    }
    setReplySending(false);
  };

  const acceptInvite = async (m: InboxMessage) => {
    const collabId = m.data?.collab_id;
    const inviterId = m.data?.inviter_id;
    if (!collabId || !inviterId || !user) {
      toast({ title: 'Invalid invite data', description: 'Missing collaboration ID or inviter info.', variant: 'destructive' });
      return;
    }

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
      console.error('Accept collab error:', error);
      toast({ title: 'Could not accept', description: error.message, variant: 'destructive' });
      return;
    }

    // Notify the inviter
    const { error: notifyErr } = await supabase.from('inbox_messages').insert({
      user_id: inviterId,
      type: 'collab_response',
      subject: `${myProfile?.username ?? 'Someone'} has accepted your invitation`,
      body: `They are ready to write the post about "${m.data?.subject}"`,
      data: { collab_id: collabId },
    });
    if (notifyErr) console.error('Notify inviter error:', notifyErr);

    await supabase.from('inbox_messages').update({ read: true }).eq('id', m.id);
    toast({ title: 'Collaboration accepted!' });
    navigate(`/collab/${collabId}`);
  };

  const declineInvite = async (m: InboxMessage) => {
    const collabId = m.data?.collab_id;
    const inviterId = m.data?.inviter_id;
    if (!collabId || !inviterId || !user) {
      toast({ title: 'Invalid invite data', description: 'Missing collaboration ID or inviter info.', variant: 'destructive' });
      return;
    }

    const { data: myProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('user_id', user.id)
      .single();

    const { error } = await supabase
      .from('post_collaborations')
      .update({ status: 'denied' })
      .eq('id', collabId)
      .eq('invitee_id', user.id);

    if (error) {
      console.error('Decline collab error:', error);
      toast({ title: 'Could not decline', description: error.message, variant: 'destructive' });
      return;
    }

    // Notify the inviter
    const { error: notifyErr } = await supabase.from('inbox_messages').insert({
      user_id: inviterId,
      type: 'collab_response',
      subject: `${myProfile?.username ?? 'Someone'} has denied your invitation`,
      body: `They declined to collaborate on "${m.data?.subject}"`,
      data: { collab_id: collabId },
    });
    if (notifyErr) console.error('Notify inviter error:', notifyErr);

    await remove(m);
    toast({ title: 'Invite declined' });
  };

  if (authLoading || loading) {
    return (
      <div className={`min-h-screen ${inboxBg}`}>
        <Header />
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${inboxBg}`}>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="mc-text text-2xl text-foreground glow-text flex items-center gap-2">
            <InboxIcon className="h-6 w-6 text-primary" /> BEZO INBOX
          </h1>
          <Button onClick={() => setComposeOpen(true)} size="sm" className="gap-1">
            <PenSquare className="h-4 w-4" /> Compose
          </Button>
        </div>
        {messages.length === 0 ? (
          <div className="minecraft-card p-8 text-center text-muted-foreground">
            Your inbox is empty.
          </div>
        ) : (
          <ul className="space-y-2">
              {messages.map(m => {
                const senderId = m.data?.from_user_id || m.data?.sender_id || m.data?.inviter_id;
                const senderProfile = senderId ? senderProfiles[senderId] : null;
                return (
              <li
                key={m.id}
                onClick={() => markRead(m)}
                className={`minecraft-card p-4 cursor-pointer transition-colors ${m.read ? 'opacity-70' : 'border-primary/40'}`}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9 shrink-0 mt-0.5">
                    <AvatarImage src={senderProfile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs font-display">
                      {senderProfile?.username?.slice(0,2).toUpperCase() ?? '??'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="mc-text text-sm text-foreground flex items-center gap-1.5">
                        {m.read ? <MailOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <Mail className="h-3.5 w-3.5 text-primary shrink-0" />}
                        {m.subject}
                      </p>
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
                    {/* Reply section */}
                    {(m.data?.inviter_id || m.data?.sender_id || m.data?.from_user_id) && m.type !== 'collab_invite' && (
                      <div className="mt-2">
                        {replyingTo === m.id ? (
                          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                            <Textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Write your reply…"
                              className="minecraft-input min-h-[70px] resize-none text-sm"
                              maxLength={1000}
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => sendReply(m)} disabled={!replyText.trim() || replySending} className="h-7 gap-1">
                                <Send className="h-3 w-3" /> {replySending ? 'Sending…' : 'Send'}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => { setReplyingTo(null); setReplyText(''); }} className="h-7">
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); markRead(m); setReplyingTo(m.id); setReplyText(''); }} className="h-7 gap-1 text-muted-foreground">
                            <Reply className="h-3 w-3" /> Reply
                          </Button>
                        )}
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
                );
              })}
          </ul>
        )}
      </main>

      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="mc-text">New Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Input
                placeholder="To (username)"
                value={toUsername}
                onChange={(e) => { setToUsername(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                autoComplete="off"
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-50 left-0 right-0 mt-1 minecraft-card bg-background border border-border rounded-md max-h-60 overflow-auto">
                  {suggestions.map(s => (
                    <li
                      key={s.user_id}
                      onMouseDown={(e) => { e.preventDefault(); setToUsername(s.username); setShowSuggestions(false); }}
                      className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-secondary/50"
                    >
                      <Avatar className="h-6 w-6"><AvatarImage src={s.avatar_url || undefined} /><AvatarFallback>{s.username.slice(0,2).toUpperCase()}</AvatarFallback></Avatar>
                      <span className="text-sm">{s.username}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
            <Textarea placeholder="Message..." rows={6} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>Cancel</Button>
            <Button onClick={sendEmail} disabled={sending || !toUsername.trim() || !subject.trim()} className="gap-1">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
