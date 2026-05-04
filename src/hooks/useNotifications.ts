import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

interface Notification {
  id: string;
  type: 'message' | 'like' | 'comment' | 'ticket_reply' | 'new_ticket' | 'inbox';
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
  read: boolean;
  ticketId?: string;
  inboxType?: string;
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

    // Count unread DMs
    const { count: dmCount } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('read', false);

    // Count unread inbox messages
    const { count: inboxCount } = await supabase
      .from('inbox_messages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);

    setUnreadMessages((dmCount || 0) + (inboxCount || 0));
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
          table: 'inbox_messages',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const msg = payload.new as { id: string; type: string; subject: string; data: any; created_at: string };
          handleInboxMessageNotification(msg);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'inbox_messages',
          filter: `user_id=eq.${user.id}`,
        },
        () => { fetchUnreadCount(); }
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
          if (reply.user_id !== user.id) {
            handleTicketReplyNotification(reply);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_tickets',
        },
        (payload) => {
          const ticket = payload.new as { user_id: string; id: string; subject: string; message: string; created_at: string };
          if (ticket.user_id !== user.id) {
            handleNewTicketNotification(ticket);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'inbox_messages',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const m = payload.new as { id: string; type: string; subject: string; data: any; created_at: string };
          handleInboxNotification(m);
        }
      )
      .subscribe();
  };

  const handleInboxNotification = async (m: { id: string; type: string; subject: string; data: any; created_at: string }) => {
    const senderId = m.data?.from_user_id || m.data?.inviter_id || '';
    let senderName = m.data?.from_username || '';
    if (!senderName && senderId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', senderId)
        .maybeSingle();
      senderName = profile?.username || 'Someone';
    }
    const isCollab = m.type === 'collab_invite';
    const notification: Notification = {
      id: `inbox-${m.id}`,
      type: 'inbox',
      senderId,
      senderName: senderName || 'Someone',
      content: isCollab ? `Collab invite: ${m.subject}` : m.subject,
      createdAt: m.created_at,
      read: false,
    };
    setUnreadMessages((prev) => prev + 1);
    setNotifications((prev) => [notification, ...prev].slice(0, 10));
  };

  const handleNewTicketNotification = async (ticket: { user_id: string; id: string; subject: string; message: string; created_at: string }) => {
    // Only notify admins/moderators
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user!.id);

    const userRoles = roles?.map(r => r.role) || [];
    if (!userRoles.includes('admin') && !userRoles.includes('moderator')) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('user_id', ticket.user_id)
      .maybeSingle();

    const notification: Notification = {
      id: `new-ticket-${Date.now()}`,
      type: 'new_ticket',
      senderId: ticket.user_id,
      senderName: profile?.username || 'Unknown',
      content: ticket.subject,
      createdAt: ticket.created_at,
      read: false,
      ticketId: ticket.id,
    };
    setUnreadMessages((prev) => prev + 1);
    setNotifications((prev) => [notification, ...prev].slice(0, 10));
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

  const handleInboxMessageNotification = async (msg: { id: string; type: string; subject: string; data: any; created_at: string }) => {
    const senderId = msg.data?.inviter_id || msg.data?.sender_id || '';
    let senderName = 'Someone';
    if (senderId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', senderId)
        .maybeSingle();
      if (profile) senderName = profile.username;
    }
    const notification: Notification = {
      id: `inbox-${msg.id}`,
      type: 'inbox_message',
      senderId,
      senderName,
      content: msg.subject,
      createdAt: msg.created_at,
      read: false,
      inboxType: msg.type,
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
