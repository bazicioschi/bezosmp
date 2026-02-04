import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Gamepad2, LogOut, User, Home, MessageCircle } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { SettingsButton } from './SettingsButton';
import { useSoundEffects } from '@/hooks/useSoundEffects';

export function Header() {
  const { playClick } = useSoundEffects();
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b-2 border-border bg-card/95 backdrop-blur-sm">
      {/* Redstone accent line */}
      <div className="h-1 bg-primary redstone-glow" />
      
      <div className="max-w-[1300px] mx-auto flex h-12 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="mc-slot h-8 w-8 flex items-center justify-center group-hover:mc-slot-active transition-all">
            <Gamepad2 className="h-5 w-5 text-primary" />
          </div>
          <span className="mc-text text-2xl text-foreground glow-text hidden sm:block">
            bezoSMP
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild className="mc-slot hover:mc-slot-active px-3 h-8" onClick={() => playClick()}>
            <Link to="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden md:inline mc-text text-sm">HOME</span>
            </Link>
          </Button>
          
          {user ? (
            <>
              <NotificationBell />
              <Button variant="ghost" size="sm" asChild className="mc-slot hover:mc-slot-active px-3 h-8" onClick={() => playClick()}>
                <Link to="/messages">
                  <MessageCircle className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="mc-slot hover:mc-slot-active px-3 h-8" onClick={() => playClick()}>
                <Link to="/profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden md:inline mc-text text-sm">PROFILE</span>
                </Link>
              </Button>
              <SettingsButton />
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
              <Button variant="ghost" size="sm" asChild className="mc-slot hover:mc-slot-active px-3 h-8" onClick={() => playClick()}>
                <Link to="/login" className="mc-text text-sm">LOGIN</Link>
              </Button>
              <Button size="sm" asChild className="mc-btn-primary px-4 h-8" onClick={() => playClick()}>
                <Link to="/signup" className="mc-text text-sm">SIGN UP</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}