import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, Loader2, User, Users, Check, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface CollabInvite {
  id: string;
  status: string;
  subject: string;
  inviter_id: string;
  invitee_id: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
  message_type: string;
  collab_invite_id: string | null;
  post_collaborations: CollabInvite | null;
}

interface Profile {
  user_id: string;
  username: string;
  avatar_url: string | null;
}

export default function Messages() {
  const { recipientId } = useParams<{ recipientId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recipient, setRecipient] = useState<Profile | null>(null);
  const [recipientOnline, setRecipientOnline] = useState(false);
  const [respondingInvite, setRespondingInvite] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (user && recipientId) {
      fetchRecipientAndMessages();
      setupRealtimeSubscription();
      markMessagesAsRead();
    }

    return () => {
      supabase.channel('messages').unsubscribe();
    };
  }, [user, recipientId, authLoading, navigate]);

  // Presence: any logged-in user with the site open joins this channel
  useEffect(() => {
    if (!user || !recipientId) return;
    const channel = supabase.channel('online-users', {
      config: { presence: { key: user.id } },
    });
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setRecipientOnline(Boolean(state[recipientId] && (state[recipientId] as any[]).length > 0));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });
    return () => { supabase.removeChannel(channel); };
  }, [user, recipientId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const markMessagesAsRead = async () => {
    if (!user || !recipientId) return;

    await supabase
      .from('messages')
      .update({ read: true })
      .eq('receiver_id', user.id)
      .eq('sender_id', recipientId)
      .eq('read', false);
  };

  const fetchRecipientAndMessages = async () => {
    if (!user || !recipientId) return;

    // Fetch recipient profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('user_id, username, avatar_url')
      .eq('user_id', recipientId)
      .maybeSingle();

    if (profileData) {
      setRecipient(profileData);
    }

    // Fetch messages between users
    const { data: messagesData } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (messagesData) {
      setMessages(messagesData as unknown as Message[]);
    }

    setLoading(false);
  };

  const setupRealtimeSubscription = () => {
    if (!user || !recipientId) return;

    supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMsg = payload.new as Message;
          // Only add if it's relevant to this conversation
          if (
            (newMsg.sender_id === user.id && newMsg.receiver_id === recipientId) ||
            (newMsg.sender_id === recipientId && newMsg.receiver_id === user.id)
          ) {
            setMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .subscribe();
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !recipientId || sending) return;

    setSending(true);
    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: recipientId,
      content: newMessage.trim(),
    });

    if (!error) {
      setNewMessage('');
    }
    setSending(false);
  };

  const handleAcceptCollab = async (message: Message) => {
    if (!user || !message.collab_invite_id || !message.post_collaborations) return;
    setRespondingInvite(message.id);

    try {
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', user.id)
        .single();

      if (!myProfile) throw new Error('Profile not found');

      // Update status to accepted
      const { error: updateError } = await supabase
        .from('post_collaborations')
        .update({ status: 'accepted' })
        .eq('id', message.collab_invite_id);

      if (updateError) throw updateError;

      // Send acceptance message to inviter
      await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: message.post_collaborations.inviter_id,
        content: `${myProfile.username} has accepted your invitation`,
        message_type: 'regular',
      });

      // Optimistically update the local message state
      setMessages(prev => prev.map(m =>
        m.id === message.id
          ? { ...m, post_collaborations: m.post_collaborations ? { ...m.post_collaborations, status: 'accepted' } : null }
          : m
      ));

      toast({ title: 'Accepted!', description: 'You can now write the collaborative post.' });

      // Navigate to the collab post editor
      navigate(`/collab/${message.collab_invite_id}`);
    } catch {
      toast({ title: 'Error', description: 'Failed to accept invitation.', variant: 'destructive' });
    } finally {
      setRespondingInvite(null);
    }
  };

  const handleDeleteMessage = async (message: Message) => {
    setMessages(prev => prev.filter(m => m.id !== message.id));
    const { error } = await supabase.from('messages').delete().eq('id', message.id);
    if (error) {
      toast({ title: 'Failed to delete', description: error.message, variant: 'destructive' });
      setMessages(prev => [...prev, message].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
    }
  };

  const handleDenyCollab = async (message: Message) => {
    if (!user || !message.collab_invite_id || !message.post_collaborations) return;
    setRespondingInvite(message.id);

    try {
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', user.id)
        .single();

      if (!myProfile) throw new Error('Profile not found');

      // Update status to denied
      const { error: updateError } = await supabase
        .from('post_collaborations')
        .update({ status: 'denied' })
        .eq('id', message.collab_invite_id);

      if (updateError) throw updateError;

      // Send denial message to inviter
      await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: message.post_collaborations.inviter_id,
        content: `${myProfile.username} has denied your invitation`,
        message_type: 'regular',
      });

      // Optimistically update the local message state
      setMessages(prev => prev.map(m =>
        m.id === message.id
          ? { ...m, post_collaborations: m.post_collaborations ? { ...m.post_collaborations, status: 'denied' } : null }
          : m
      ));

      toast({ title: 'Invitation declined.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to deny invitation.', variant: 'destructive' });
    } finally {
      setRespondingInvite(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background minecraft-stone-bg flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-4 max-w-3xl flex flex-col">
        {/* Chat Header */}
        <div className="minecraft-card minecraft-border minecraft-grass-top p-4 mb-4 flex items-center gap-4 animate-fade-in">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0 minecraft-block-hover"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {recipient && (
            <div
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity flex-1"
              onClick={() => navigate(`/user/${recipientId}`)}
            >
              <Avatar className="h-10 w-10 minecraft-avatar">
                <AvatarImage src={recipient.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary font-display">
                  {recipient.username?.slice(0, 2).toUpperCase() || <User className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
              <div>
                <span className="font-display font-semibold text-foreground glow-text block">
                  {recipient.username}
                </span>
                <span className={`text-xs font-display ${recipientOnline ? 'text-primary' : 'text-muted-foreground'}`}>
                  {recipientOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Messages Container */}
        <div className="flex-1 minecraft-card minecraft-border overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[60vh]">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground font-display">
                <p>No messages yet</p>
                <p className="text-sm mt-2">Send the first message!</p>
              </div>
            ) : (
              messages.map((message) => {
                const isOwn = message.sender_id === user?.id;
                const isCollabInvite = message.message_type === 'collab_invite';
                const collab = message.post_collaborations;
                const isPending = collab?.status === 'pending';
                const isRecipientOfInvite = message.receiver_id === user?.id;
                const isProcessing = respondingInvite === message.id;

                return (
                  <div
                    key={message.id}
                    className={`flex items-end gap-1 group ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    {isOwn && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0 mb-1"
                        onClick={() => handleDeleteMessage(message)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-lg minecraft-border ${
                        isCollabInvite
                          ? 'bg-primary/10 border-primary/40 text-foreground w-full'
                          : isOwn
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-foreground'
                      }`}
                    >
                      {isCollabInvite && collab ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-primary font-display font-semibold text-sm">
                            <Users className="h-4 w-4" />
                            Collaboration Invite
                          </div>
                          <p className="break-words text-sm">{message.content}</p>
                          <div className="bg-background/50 rounded p-2 border border-primary/20">
                            <p className="text-xs text-muted-foreground font-display mb-0.5">Proposed subject</p>
                            <p className="text-sm font-medium text-foreground">{collab.subject}</p>
                          </div>
                          {isRecipientOfInvite && isPending && (
                            <div className="flex gap-2 pt-1">
                              <Button
                                size="sm"
                                className="flex-1 font-display gap-1"
                                onClick={() => handleAcceptCollab(message)}
                                disabled={isProcessing}
                              >
                                {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 font-display gap-1 border-destructive/50 text-destructive hover:bg-destructive/10"
                                onClick={() => handleDenyCollab(message)}
                                disabled={isProcessing}
                              >
                                {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                                Deny
                              </Button>
                            </div>
                          )}
                          {collab.status === 'accepted' && (
                            <p className="text-xs text-green-500 font-display flex items-center gap-1">
                              <Check className="h-3 w-3" /> Accepted
                            </p>
                          )}
                          {collab.status === 'denied' && (
                            <p className="text-xs text-destructive font-display flex items-center gap-1">
                              <X className="h-3 w-3" /> Denied
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="break-words space-y-2">
                          {message.content.split('\n').map((line, i) => {
                            const trimmed = line.trim();
                            const postMatch = trimmed.match(/https?:\/\/[^\s]+\?post=([0-9a-f-]{36})/i);
                            if (postMatch) {
                              return <PostLinkPreview key={i} postId={postMatch[1]} href={trimmed} />;
                            }
                            const isImg = /^https?:\/\/.+\.(png|jpe?g|gif|webp|avif)(\?.*)?$/i.test(trimmed) || /supabase\.co\/storage\/.+\/post-images\//i.test(trimmed);
                            if (isImg) {
                              return <img key={i} src={trimmed} alt="Shared" className="rounded max-h-64 w-auto border border-border" />;
                            }
                            return <p key={i} className="whitespace-pre-wrap">{line}</p>;
                          })}
                        </div>
                      )}
                      <span className={`text-xs mt-1 block ${isOwn && !isCollabInvite ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSend} className="p-4 border-t border-border bg-background/50">
            <div className="flex gap-3">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-secondary/50 border-border input-glow minecraft-border"
                disabled={sending}
              />
              <Button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="minecraft-border font-display"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
