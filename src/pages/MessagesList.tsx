import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Loader2, User, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { formatDistanceToNow } from 'date-fns';

interface Conversation {
  recipientId: string;
  username: string;
  avatarUrl: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export default function MessagesList() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (user) {
      fetchConversations();
    }
  }, [user, authLoading, navigate]);

  const fetchConversations = async () => {
    if (!user) return;

    // Get all messages where user is sender or receiver
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!messages) {
      setLoading(false);
      return;
    }

    // Group by conversation partner
    const conversationMap = new Map<string, {
      recipientId: string;
      lastMessage: string;
      lastMessageAt: string;
      unreadCount: number;
    }>();

    messages.forEach((msg) => {
      const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          recipientId: partnerId,
          lastMessage: msg.content,
          lastMessageAt: msg.created_at,
          unreadCount: (!msg.read && msg.receiver_id === user.id) ? 1 : 0,
        });
      } else if (!msg.read && msg.receiver_id === user.id) {
        const conv = conversationMap.get(partnerId)!;
        conv.unreadCount += 1;
      }
    });

    // Fetch profiles for all partners
    const partnerIds = Array.from(conversationMap.keys());
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, username, avatar_url')
      .in('user_id', partnerIds);

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

    const convList: Conversation[] = Array.from(conversationMap.entries()).map(([id, conv]) => {
      const profile = profileMap.get(id);
      return {
        ...conv,
        username: profile?.username || 'Unknown',
        avatarUrl: profile?.avatar_url || null,
      };
    });

    setConversations(convList);
    setLoading(false);
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
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 font-display"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          BACK
        </Button>

        <h1 className="font-display text-2xl font-bold text-foreground glow-text mb-6 flex items-center gap-3">
          <MessageCircle className="h-6 w-6 text-primary" />
          Messages
        </h1>

        {conversations.length === 0 ? (
          <div className="minecraft-card minecraft-border minecraft-grass-top p-8 text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-display">No conversations yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Visit a user's profile to start chatting!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conv) => (
              <div
                key={conv.recipientId}
                onClick={() => navigate(`/messages/${conv.recipientId}`)}
                className="minecraft-card minecraft-border card-hover p-4 cursor-pointer flex items-center gap-4"
              >
                <Avatar className="h-12 w-12 border-2 border-primary/30">
                  <AvatarImage src={conv.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary font-display">
                    {conv.username?.slice(0, 2).toUpperCase() || <User className="h-5 w-5" />}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display font-semibold text-foreground">{conv.username}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-1">{conv.lastMessage}</p>
                </div>

                {conv.unreadCount > 0 && (
                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-xs font-display font-bold text-primary-foreground animate-pulse-glow">
                    {conv.unreadCount}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
