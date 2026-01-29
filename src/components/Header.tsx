import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Gamepad2, LogOut, User, Home, MessageCircle } from 'lucide-react';
import { NotificationBell } from './NotificationBell';

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b-4 border-primary/30 bg-background/95 backdrop-blur-xl minecraft-grass-top">
      {/* Pixelated top accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[repeating-linear-gradient(90deg,hsl(120_40%_35%)_0px,hsl(120_40%_35%)_4px,hsl(120_50%_25%)_4px,hsl(120_50%_25%)_8px)]" />
      
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center bg-primary/20 border-2 border-primary/30 minecraft-slot group-hover:shadow-glow transition-all duration-300">
            <Gamepad2 className="h-5 w-5 text-primary" />
          </div>
          <span className="font-display text-xl font-bold tracking-wider text-foreground glow-text">
            bezoSMP
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="sm" asChild className="minecraft-block-hover">
            <Link to="/" className="flex items-center gap-2 font-display">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">HOME</span>
            </Link>
          </Button>
          
          {user ? (
            <>
              <NotificationBell />
              <Button variant="ghost" size="sm" asChild className="minecraft-block-hover">
                <Link to="/messages" className="flex items-center gap-2 font-display">
                  <MessageCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">MESSAGES</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="minecraft-block-hover">
                <Link to="/profile" className="flex items-center gap-2 font-display">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">PROFILE</span>
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={signOut} className="minecraft-border font-display">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">LOGOUT</span>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="minecraft-block-hover font-display">
                <Link to="/login">LOGIN</Link>
              </Button>
              <Button variant="default" size="sm" asChild className="minecraft-border font-display">
                <Link to="/signup">SIGN UP</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
