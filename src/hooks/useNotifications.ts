import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

interface Notification {
  id: string;
  type: 'message' | 'like' | 'comment';
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export function useNotifications() {
  const { user } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) {
      setUnreadMessages(0);
      setNotifications([]);
      return;
    }

    fetchUnreadCount();
    setupRealtimeSubscription();

    return () => {
      supabase.channel('notifications').unsubscribe();
    };
  }, [user]);

  const fetchUnreadCount = async () => {
    if (!user) return;

    // Count unread messages
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('read', false);

    setUnreadMessages(count || 0);
  };

  const setupRealtimeSubscription = () => {
    if (!user) return;

    supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          // New message received
          setUnreadMessages((prev) => prev + 1);
          
          // Show toast notification (handled in component)
          const newMsg = payload.new as { sender_id: string; content: string; created_at: string };
          fetchSenderInfo(newMsg);
        }
      )
      .subscribe();
  };

  const fetchSenderInfo = async (msg: { sender_id: string; content: string; created_at: string }) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('user_id', msg.sender_id)
      .maybeSingle();

    if (profile) {
      const notification: Notification = {
        id: `msg-${Date.now()}`,
        type: 'message',
        senderId: msg.sender_id,
        senderName: profile.username,
        content: msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : ''),
        createdAt: msg.created_at,
        read: false,
      };
      setNotifications((prev) => [notification, ...prev].slice(0, 10));
    }
  };

  const markMessagesAsRead = async (senderId: string) => {
    if (!user) return;

    await supabase
      .from('messages')
      .update({ read: true })
      .eq('receiver_id', user.id)
      .eq('sender_id', senderId)
      .eq('read', false);

    fetchUnreadCount();
  };

  const markAllMessagesAsRead = async () => {
    if (!user) return;

    await supabase
      .from('messages')
      .update({ read: true })
      .eq('receiver_id', user.id)
      .eq('read', false);

    setUnreadMessages(0);
    setNotifications([]);
  };

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return {
    unreadMessages,
    notifications,
    markMessagesAsRead,
    markAllMessagesAsRead,
    clearNotification,
    refreshCount: fetchUnreadCount,
  };
}
