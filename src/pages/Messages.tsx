import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, Loader2, User, Sword } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recipient, setRecipient] = useState<Profile | null>(null);
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
      setMessages(messagesData);
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
                <span className="text-xs text-muted-foreground font-display">
                  Online
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
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] px-4 py-2 rounded-lg minecraft-border ${
                        isOwn
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-foreground'
                      }`}
                    >
                      <p className="break-words">{message.content}</p>
                      <span className={`text-xs mt-1 block ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
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
