import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Send, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { formatDistanceToNow } from 'date-fns';

interface Conversation {
  odtherUserId: string;
  odtherUsername: string;
  otherAvatarUrl: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export function ChatPopup() {
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const { playClick } = useSoundEffects();
  const { user } = useAuth();

  useEffect(() => {
    if (open && user) {
      fetchConversations();
    }
  }, [open, user]);

  const fetchConversations = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Get all messages where user is sender or receiver
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (!messages) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Group by conversation partner
      const conversationMap = new Map<string, {
        odtherUserId: string;
        lastMessage: string;
        lastMessageTime: string;
        unreadCount: number;
      }>();

      messages.forEach(msg => {
        const odtherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        
        if (!conversationMap.has(odtherUserId)) {
          conversationMap.set(odtherUserId, {
            odtherUserId,
            lastMessage: msg.content,
            lastMessageTime: msg.created_at,
            unreadCount: (!msg.read && msg.receiver_id === user.id) ? 1 : 0,
          });
        } else if (!msg.read && msg.receiver_id === user.id) {
          const existing = conversationMap.get(odtherUserId)!;
          existing.unreadCount++;
        }
      });

      // Fetch profiles for conversation partners
      const otherUserIds = Array.from(conversationMap.keys());
      
      if (otherUserIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', otherUserIds);

      const conversationsWithProfiles = Array.from(conversationMap.values()).map(conv => {
        const profile = profiles?.find(p => p.user_id === conv.odtherUserId);
        return {
          ...conv,
          odtherUsername: profile?.username || 'Unknown User',
          otherAvatarUrl: profile?.avatar_url || null,
        };
      });

      setConversations(conversationsWithProfiles.slice(0, 5)); // Show last 5
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }

    setLoading(false);
  };

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  if (!user) {
    return (
      <Button variant="ghost" size="sm" asChild className="mc-slot hover:mc-slot-active px-3 h-8">
        <Link to="/login">
          <MessageCircle className="h-4 w-4" />
        </Link>
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="mc-slot hover:mc-slot-active px-3 h-8 relative"
          onClick={() => playClick()}
        >
          <MessageCircle className="h-4 w-4" />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center minecraft-notification">
              {totalUnread > 9 ? '9+' : totalUnread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 minecraft-card overflow-hidden z-50" 
        align="end"
      >
        <div className="h-1 bg-primary redstone-glow" />
        <div className="p-3 border-b-2 border-border flex items-center justify-between">
          <h3 className="mc-text text-lg text-foreground glow-text flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary" />
            MESSAGES
          </h3>
          <Button variant="ghost" size="sm" asChild className="text-xs" onClick={() => { playClick(); setOpen(false); }}>
            <Link to="/messages" className="flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>

        <ScrollArea className="max-h-80">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">No conversations yet</p>
              <p className="text-xs text-muted-foreground mt-1">Start chatting with other players!</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {conversations.map((conv) => (
                <Link
                  key={conv.odtherUserId}
                  to={`/messages/${conv.odtherUserId}`}
                  onClick={() => { playClick(); setOpen(false); }}
                  className="flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors"
                >
                  <div className="mc-slot h-10 w-10 p-0.5 shrink-0">
                    <Avatar className="h-full w-full rounded-none">
                      <AvatarImage src={conv.otherAvatarUrl || undefined} style={{ imageRendering: 'pixelated' }} />
                      <AvatarFallback className="bg-secondary text-primary mc-text rounded-none">
                        {conv.odtherUsername.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="mc-text text-sm font-medium truncate">{conv.odtherUsername}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(conv.lastMessageTime), { addSuffix: false })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {conv.unreadCount}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-2 border-t border-border">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mc-btn" 
            asChild
            onClick={() => { playClick(); setOpen(false); }}
          >
            <Link to="/messages" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              <span className="mc-text text-sm">START NEW CHAT</span>
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}