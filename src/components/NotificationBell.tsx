import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MessageCircle, X, Ticket, AlertCircle, Newspaper, Ban, Heart, UserPlus } from 'lucide-react';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNotifications } from '@/hooks/useNotifications';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { formatDistanceToNow } from 'date-fns';

export function NotificationBell() {
  const navigate = useNavigate();
  const { unreadMessages, notifications, clearNotification, markAllMessagesAsRead } = useNotifications();
  const { playClick, playNotification } = useSoundEffects();
  const [open, setOpen] = useState(false);
  const prevUnreadRef = useRef(unreadMessages);

  // Play notification sound when new messages arrive
  useEffect(() => {
    if (unreadMessages > prevUnreadRef.current) {
      playNotification();
    }
    prevUnreadRef.current = unreadMessages;
  }, [unreadMessages, playNotification]);

  const totalUnread = unreadMessages;

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    playClick();
    if (notification.type === 'message') {
      navigate(`/messages/${notification.senderId}`);
    } else if (notification.type === 'ticket_reply' || notification.type === 'new_ticket') {
      navigate('/support');
    } else if (notification.type === 'news') {
      navigate('/');
    } else if (notification.type === 'post_blocked') {
      navigate('/');
    }
    clearNotification(notification.id);
    setOpen(false);
  };

  const handleBellClick = () => {
    playClick();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative mc-slot hover:mc-slot-active px-3 h-8"
          onClick={handleBellClick}
        >
          <Bell className="h-4 w-4" />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary flex items-center justify-center mc-text text-xs text-primary-foreground minecraft-notification redstone-glow">
              {totalUnread > 9 ? '9+' : totalUnread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 minecraft-card overflow-hidden" 
        align="end"
      >
        <div className="h-1 bg-primary redstone-glow" />
        <div className="p-3 border-b-2 border-border">
          <h3 className="mc-text text-lg text-foreground glow-text">
            NOTIFICATIONS
          </h3>
        </div>
        
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center mc-dirt">
              <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="mc-text text-muted-foreground">
                No new notifications
              </p>
            </div>
          ) : (
            <div className="divide-y-2 divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-3 hover:bg-secondary/50 cursor-pointer transition-colors flex items-start gap-3 group"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="mc-slot h-9 w-9 flex items-center justify-center shrink-0">
                    {notification.type === 'message' && (
                      <MessageCircle className="h-4 w-4 text-primary" />
                    )}
                    {notification.type === 'news' && (
                      <Newspaper className="h-4 w-4 text-green-400" />
                    )}
                    {notification.type === 'ticket_reply' && (
                      <Ticket className="h-4 w-4 text-primary" />
                    )}
                    {notification.type === 'new_ticket' && (
                      <AlertCircle className="h-4 w-4 text-primary" />
                    )}
                    {notification.type === 'post_blocked' && (
                      <Ban className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm inline-flex items-center gap-1 flex-wrap">
                      <span className="font-semibold text-primary mc-text inline-flex items-center gap-1">
                        {notification.senderName}
                        {notification.type !== 'post_blocked' && <VerifiedBadge userId={notification.senderId} />}
                      </span>
                      <span className="text-muted-foreground">
                        {notification.type === 'message' ? ' sent you a message' :
                         notification.type === 'news' ? ' posted new news' :
                         notification.type === 'new_ticket' ? ' submitted a new ticket' :
                         notification.type === 'post_blocked' ? ' Your post was blocked by a moderator' :
                         ' replied to your ticket'}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {notification.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        playClick();
                        clearNotification(notification.id);
                      }}
                    >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {unreadMessages > 0 && (
          <div className="p-3 border-t-2 border-border space-y-2">
            <Button
              className="w-full mc-btn-primary"
              onClick={() => {
                playClick();
                navigate('/messages');
                setOpen(false);
              }}
            >
              <span className="mc-text">VIEW ALL ({unreadMessages})</span>
            </Button>
            <Button
              variant="outline"
              className="w-full mc-btn"
              onClick={() => {
                playClick();
                markAllMessagesAsRead();
              }}
            >
              <span className="mc-text">MARK ALL AS READ</span>
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}