import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Gamepad2, LogOut, User, Home, MessageCircle, Search } from 'lucide-react';
import { NotificationBell } from './NotificationBell';

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-[1300px] mx-auto flex h-14 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center">
            <Gamepad2 className="h-6 w-6 text-primary" />
          </div>
          <span className="font-display text-lg font-bold tracking-wider text-foreground hidden sm:block">
            bezoSMP
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild className="rounded-full">
            <Link to="/" className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              <span className="hidden md:inline text-sm">Home</span>
            </Link>
          </Button>
          
          {user ? (
            <>
              <NotificationBell />
              <Button variant="ghost" size="sm" asChild className="rounded-full">
                <Link to="/messages" className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  <span className="hidden md:inline text-sm">Messages</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="rounded-full">
                <Link to="/profile" className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <span className="hidden md:inline text-sm">Profile</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={signOut} className="rounded-full text-muted-foreground hover:text-foreground">
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="rounded-full">
                <Link to="/login" className="text-sm">Log in</Link>
              </Button>
              <Button size="sm" asChild className="rounded-full bg-foreground text-background hover:bg-foreground/90">
                <Link to="/signup" className="text-sm font-semibold">Sign up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}