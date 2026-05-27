import { Link2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const RedditIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true">
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
  </svg>
);

export function ConnectButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="mc-slot hover:mc-slot-active px-3 h-8">
          <Link2 className="h-4 w-4" />
          <span className="hidden md:inline mc-text text-sm ml-1">CONNECT</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="minecraft-card sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Community</DialogTitle>
        </DialogHeader>

        {/* Banner */}
        <div className="relative h-24 overflow-hidden">
          <img
            src="https://styles.redditmedia.com/t5_hrz0mx/styles/bannerBackgroundImage_tu9hd3tx850h1.png"
            alt="r/bezocomunity banner"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Avatar overlapping banner */}
        <div className="px-5 pb-5">
          <div className="-mt-8 mb-3 flex items-end justify-between relative z-10">
            <div className="h-16 w-16 rounded-full border-4 border-background overflow-hidden shadow-lg">
              <img
                src="https://styles.redditmedia.com/t5_hrz0mx/styles/communityIcon_anv7cuws850h1.png"
                alt="r/bezocomunity icon"
                className="w-full h-full object-cover"
              />
            </div>
            <a
              href="https://www.reddit.com/r/bezocomunity/"
              target="_blank"
              rel="noopener noreferrer"
              className="mc-text text-sm font-bold bg-[#FF4500] hover:bg-[#e03d00] text-white px-4 py-1.5 rounded-full transition-colors"
            >
              Join
            </a>
          </div>

          <h2 className="mc-text text-lg font-bold text-foreground">bezo Community</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            The official bezoSMP community on Reddit — news, updates & more.
          </p>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4 text-primary" />
            <span className="mc-text">Community members</span>
            <span className="ml-auto text-xs text-primary mc-text">reddit.com</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}