import { Github, Twitter, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t-2 border-border bg-card/50 mt-8">
      <div className="h-1 bg-primary redstone-glow" />
      
      <div className="max-w-[1300px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="mc-slot h-10 w-10 flex items-center justify-center">
                <span className="mc-text text-lg text-primary font-bold">B</span>
              </div>
              <span className="mc-text text-2xl text-foreground glow-text">bezoSMP</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              BezoSMP is an online platform created by Bazicioschi in late january 2026
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mc-text text-primary mb-3">QUICK LINKS</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Profile
                </Link>
              </li>
              <li>
                <Link to="/messages" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Messages
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="mc-text text-primary mb-3">CONNECT</h4>
            <div className="flex gap-2">
              <a 
                href="https://x.com/Bazicioschi" 
                target="_blank"
                rel="noopener noreferrer"
                className="mc-slot h-9 w-9 flex items-center justify-center hover:mc-slot-active transition-all"
              >
                <Twitter className="h-4 w-4 text-primary" />
              </a>
              <a 
                href="https://www.reddit.com/user/Bazicioschi/" 
                target="_blank"
                rel="noopener noreferrer"
                className="mc-slot h-9 w-9 flex items-center justify-center hover:mc-slot-active transition-all"
              >
                <MessageCircle className="h-4 w-4 text-primary" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border mt-8 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            © {currentYear} bezoSMP. Not affiliated with Mojang or Microsoft.
          </p>
        </div>
      </div>
    </footer>
  );
}