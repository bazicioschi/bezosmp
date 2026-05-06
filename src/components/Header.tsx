import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { LogOut, User, Home, HelpCircle, Shield, Code, FolderOpen, Inbox } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { SettingsButton } from './SettingsButton';
import { ChatPopup } from './ChatPopup';
import { ConnectButton } from './ConnectButton';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useAdmin } from '@/hooks/useAdmin';
import { useTheme } from '@/hooks/useTheme';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';

export function Header() {
  const { playClick } = useSoundEffects();
  const { user, signOut } = useAuth();
  const { isAdmin, isOwner } = useAdmin();
  const { theme } = useTheme();
  const { unreadInbox } = useNotifications();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setUsername(null); return; }
    supabase.from('profiles').select('username').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setUsername(data?.username ?? null));
  }, [user]);

  const adminLabel = username?.toLowerCase() === 'bazicioschi' ? 'OWNER' : 'ADMIN';

  return (
    <header className="sticky top-0 z-50 border-b-2 border-border bg-card/95 backdrop-blur-sm">
      <div className="h-1 bg-primary redstone-glow" />
      
      <div className="max-w-[1300px] mx-auto flex h-12 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="mc-slot h-8 w-8 flex items-center justify-center group-hover:mc-slot-active transition-all">
            <span className="mc-text text-lg text-primary font-bold" style={{ textShadow: '1px 1px 0 rgba(0,0,0,0.5), -1px -1px 0 rgba(0,0,0,0.3)' }}>B</span>
          </div>
          <span className="mc-text text-2xl text-foreground glow-text hidden sm:block">
            bezoSMP
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild className={`mc-slot hover:mc-slot-active px-3 h-8 ${theme === 'dark' ? 'text-white' : 'text-black'}`} onClick={() => playClick()}>
            <Link to="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden md:inline mc-text text-sm">HOME</span>
            </Link>
          </Button>
          
          <ConnectButton />
          
          {user ? (
            <>
              <NotificationBell />
              <Button variant="ghost" size="sm" asChild className="mc-slot hover:mc-slot-active px-3 h-8 relative" onClick={() => playClick()}>
                <Link to="/inbox" className="flex items-center gap-2">
                  <Inbox className="h-4 w-4" />
                  <span className="hidden md:inline mc-text text-sm">INBOX</span>
                  {unreadInbox > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary flex items-center justify-center mc-text text-xs text-primary-foreground minecraft-notification redstone-glow">
                      {unreadInbox > 9 ? '9+' : unreadInbox}
                    </span>
                  )}
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="mc-slot hover:mc-slot-active px-3 h-8" onClick={() => playClick()}>
                <Link to="/profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden md:inline mc-text text-sm">PROFILE</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="mc-slot hover:mc-slot-active px-3 h-8" onClick={() => playClick()}>
                <Link to="/support" className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  <span className="hidden md:inline mc-text text-sm">SUPPORT</span>
                </Link>
              </Button>
              {isAdmin && (
                <Button variant="ghost" size="sm" asChild className="mc-slot hover:mc-slot-active px-3 h-8" onClick={() => playClick()}>
                  <Link to="/admin" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span className="hidden md:inline mc-text text-sm">ADMIN</span>
                  </Link>
                </Button>
              )}
              {(isAdmin || isOwner) && (
                <Button variant="ghost" size="sm" asChild className="mc-slot hover:mc-slot-active px-3 h-8" onClick={() => playClick()}>
                  <Link to="/ai-coder" className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    <span className="hidden md:inline mc-text text-sm">BEZO AI</span>
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" asChild className="mc-slot hover:mc-slot-active px-3 h-8" onClick={() => playClick()}>
                <Link to="/files" className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  <span className="hidden md:inline mc-text text-sm">FILES</span>
                </Link>
              </Button>
              <SettingsButton />
              <ChatPopup />
              <Button
                variant="ghost" 
                size="sm" 
                onClick={() => { playClick(); signOut(); }} 
                className="mc-slot hover:mc-slot-active px-3 h-8 text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <SettingsButton />
              <Button variant="ghost" size="sm" asChild className={`mc-slot hover:mc-slot-active px-3 h-8 ${theme === 'dark' ? 'text-white' : 'text-black'}`} onClick={() => playClick()}>
                <Link to="/login" className="mc-text text-sm">LOGIN</Link>
              </Button>
              <Button size="sm" asChild className={`mc-btn-primary px-4 h-8 ${theme === 'dark' ? 'text-white' : 'text-black'}`} onClick={() => playClick()}>
                <Link to="/signup" className="mc-text text-sm">SIGN UP</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}