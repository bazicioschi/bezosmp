import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

interface Notification {
  id: string;
  type: 'message' | 'like' | 'comment' | 'ticket_reply';
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
  read: boolean;
  ticketId?: string;
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
          setUnreadMessages((prev) => prev + 1);
          const newMsg = payload.new as { sender_id: string; content: string; created_at: string };
          fetchSenderInfo(newMsg);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          const oldMsg = payload.old as { read: boolean };
          const newMsg = payload.new as { read: boolean };
          if (!oldMsg.read && newMsg.read) {
            fetchUnreadCount();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_replies',
        },
        (payload) => {
          const reply = payload.new as { user_id: string; ticket_id: string; message: string; created_at: string };
          // Don't notify yourself
          if (reply.user_id !== user.id) {
            handleTicketReplyNotification(reply);
          }
        }
      )
      .subscribe();
  };

  const handleTicketReplyNotification = async (reply: { user_id: string; ticket_id: string; message: string; created_at: string }) => {
    // Check if this ticket belongs to the current user
    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('user_id, subject')
      .eq('id', reply.ticket_id)
      .maybeSingle();

    if (!ticket || ticket.user_id !== user?.id) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('user_id', reply.user_id)
      .maybeSingle();

    const notification: Notification = {
      id: `ticket-${Date.now()}`,
      type: 'ticket_reply',
      senderId: reply.user_id,
      senderName: profile?.username || 'Staff',
      content: `Re: ${ticket.subject} — ${reply.message.substring(0, 40)}${reply.message.length > 40 ? '...' : ''}`,
      createdAt: reply.created_at,
      read: false,
      ticketId: reply.ticket_id,
    };
    setUnreadMessages((prev) => prev + 1);
    setNotifications((prev) => [notification, ...prev].slice(0, 10));
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
