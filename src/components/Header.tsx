import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { LogOut, User, Home, HelpCircle, Shield, Code, FolderOpen, Inbox, Bookmark, Menu } from 'lucide-react';
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
  const { isAdmin, isModerator, isOwner, canModerate } = useAdmin();
  const { theme } = useTheme();
  const { unreadInbox } = useNotifications();
  const [username, setUsername] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) { setUsername(null); return; }
    supabase.from('profiles').select('username').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setUsername(data?.username ?? null));
  }, [user]);

  const adminLabel = isOwner ? 'OWNER' : isAdmin ? 'ADMIN' : 'MOD';

  const mobileLinks: { to: string; label: string; icon: typeof Home }[] = [
    { to: '/', label: 'HOME', icon: Home },
    ...(user
      ? [
          { to: `/user/${user.id}`, label: 'PROFILE', icon: User },
          { to: '/saved', label: 'SAVED', icon: Bookmark },
          { to: '/inbox', label: 'INBOX', icon: Inbox },
          { to: '/support', label: 'SUPPORT', icon: HelpCircle },
          ...(canModerate ? [{ to: '/admin', label: adminLabel, icon: Shield }] : []),
          ...(isAdmin || isOwner ? [{ to: '/ai-coder', label: 'BEZO AI', icon: Code }] : []),
          { to: '/files', label: 'FILES', icon: FolderOpen },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b-2 border-border bg-card/95 backdrop-blur-sm">
      <div className="h-1 bg-primary redstone-glow" />

      <div className="max-w-[1300px] mx-auto flex h-12 items-center justify-between gap-2 px-2 sm:px-4">
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <div className="mc-slot h-8 w-8 flex items-center justify-center group-hover:mc-slot-active transition-all">
            <span className="mc-text text-lg text-primary font-bold" style={{ textShadow: '1px 1px 0 rgba(0,0,0,0.5), -1px -1px 0 rgba(0,0,0,0.3)' }}>B</span>
          </div>
          <span className="mc-text text-2xl text-foreground glow-text hidden sm:block">
            bezoSMP
          </span>
        </Link>

        {/* Mobile nav: essentials + menu */}
        <nav className="flex md:hidden items-center gap-1">
          {user && <NotificationBell />}
          {user && (
            <Button variant="ghost" size="sm" asChild className="mc-slot hover:mc-slot-active px-2 h-8 relative" onClick={() => playClick()}>
              <Link to="/inbox" aria-label="Inbox">
                <Inbox className="h-4 w-4" />
                {unreadInbox > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary flex items-center justify-center mc-text text-xs text-primary-foreground minecraft-notification redstone-glow">
                    {unreadInbox > 9 ? '9+' : unreadInbox}
                  </span>
                )}
              </Link>
            </Button>
          )}
          {user && <ChatPopup />}
          <SettingsButton />
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="mc-slot hover:mc-slot-active px-2 h-8" aria-label="Menu" onClick={() => playClick()}>
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[82vw] max-w-[320px] bg-card border-l-2 border-border overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="mc-text text-xl text-foreground text-left">
                  {username ? `@${username}` : 'bezoSMP'}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 flex flex-col gap-2">
                {mobileLinks.map(({ to, label, icon: Icon }) => (
                  <Button
                    key={to}
                    variant="ghost"
                    asChild
                    className="mc-slot hover:mc-slot-active justify-start h-11 px-3 w-full"
                    onClick={() => { playClick(); setMenuOpen(false); }}
                  >
                    <Link to={to} className="flex items-center gap-3">
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="mc-text text-base">{label}</span>
                    </Link>
                  </Button>
                ))}
                <div className="pt-2">
                  <ConnectButton />
                </div>
                {user ? (
                  <Button
                    variant="ghost"
                    onClick={() => { playClick(); setMenuOpen(false); signOut(); }}
                    className="mc-slot hover:mc-slot-active justify-start h-11 px-3 w-full text-muted-foreground hover:text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    <span className="mc-text text-base">LOG OUT</span>
                  </Button>
                ) : (
                  <>
                    <Button variant="ghost" asChild className="mc-slot hover:mc-slot-active justify-start h-11 px-3 w-full" onClick={() => { playClick(); setMenuOpen(false); }}>
                      <Link to="/login" className="mc-text text-base">LOGIN</Link>
                    </Button>
                    <Button asChild className="mc-btn-primary h-11 w-full" onClick={() => { playClick(); setMenuOpen(false); }}>
                      <Link to="/signup" className="mc-text text-base">SIGN UP</Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </nav>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
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
                <Link to={user ? `/user/${user.id}` : '/profile'} className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden md:inline mc-text text-sm">PROFILE</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="mc-slot hover:mc-slot-active px-3 h-8" onClick={() => playClick()}>
                <Link to="/saved" className="flex items-center gap-2">
                  <Bookmark className="h-4 w-4" />
                  <span className="hidden md:inline mc-text text-sm">SAVED</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="mc-slot hover:mc-slot-active px-3 h-8" onClick={() => playClick()}>
                <Link to="/support" className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  <span className="hidden md:inline mc-text text-sm">SUPPORT</span>
                </Link>
              </Button>
              {canModerate && (
                <Button variant="ghost" size="sm" asChild className="mc-slot hover:mc-slot-active px-3 h-8" onClick={() => playClick()}>
                  <Link to="/admin" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span className="hidden md:inline mc-text text-sm">{adminLabel}</span>
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
