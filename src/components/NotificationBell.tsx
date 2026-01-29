import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

export function NotificationBell() {
  const navigate = useNavigate();
  const { unreadMessages, notifications, clearNotification } = useNotifications();
  const [open, setOpen] = useState(false);

  const totalUnread = unreadMessages;

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    if (notification.type === 'message') {
      navigate(`/messages/${notification.senderId}`);
    }
    clearNotification(notification.id);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative minecraft-block-hover"
        >
          <Bell className="h-4 w-4" />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center text-[10px] font-display font-bold text-primary-foreground animate-pulse-glow minecraft-border">
              {totalUnread > 9 ? '9+' : totalUnread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 minecraft-card minecraft-border" 
        align="end"
      >
        <div className="p-3 border-b border-border minecraft-grass-top">
          <h3 className="font-display font-semibold text-foreground glow-text">
            NOTIFICATIONS
          </h3>
        </div>
        
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground font-display">
                No new notifications
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-3 hover:bg-secondary/50 cursor-pointer transition-colors flex items-start gap-3 group"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="h-8 w-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 minecraft-slot">
                    {notification.type === 'message' && (
                      <MessageCircle className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-display">
                      <span className="font-semibold text-primary">{notification.senderName}</span>
                      <span className="text-muted-foreground"> sent you a message</span>
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1">
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
          <div className="p-3 border-t border-border">
            <Button
              variant="outline"
              className="w-full minecraft-border font-display"
              onClick={() => {
                navigate('/messages');
                setOpen(false);
              }}
            >
              VIEW ALL MESSAGES ({unreadMessages})
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
