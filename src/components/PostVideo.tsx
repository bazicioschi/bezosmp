import { useState } from 'react';
import { Download, MoreVertical, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { downloadMedia } from '@/lib/media-download';

interface PostVideoProps {
  src: string;
  /** Opens the "share to user" dialog; the menu item is hidden when omitted. */
  onShare?: () => void;
}

/** Video player shared by posts and news, with a small ⋮ menu for download and sharing. */
export function PostVideo({ src, onShare }: PostVideoProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="mt-3 minecraft-card overflow-hidden relative">
      <video
        key={src}
        src={src}
        className="block w-full max-h-[400px] object-contain bg-black"
        controls
        playsInline
        preload="metadata"
        onLoadedMetadata={() => setFailed(false)}
        onError={(e) => {
          const err = e.currentTarget.error;
          console.error('Video failed to load', { src, code: err?.code, message: err?.message });
          setFailed(true);
        }}
      >
        Your browser does not support the video tag.
      </video>

      {failed && (
        <p className="px-3 py-2 text-xs text-muted-foreground mc-text">
          This video couldn't play here.{' '}
          <a href={src} target="_blank" rel="noopener noreferrer" className="text-primary underline">
            Open video
          </a>
        </p>
      )}

      <div className="absolute top-2 right-2 z-10">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Video options"
              className="h-8 w-8 rounded-full bg-black/60 text-white hover:bg-black/80 hover:text-white"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="mc-text">
            <DropdownMenuItem onSelect={() => downloadMedia(src, 'video')} className="gap-2 cursor-pointer">
              <Download className="h-4 w-4" /> Download
            </DropdownMenuItem>
            {onShare && (
              <DropdownMenuItem onSelect={onShare} className="gap-2 cursor-pointer">
                <Send className="h-4 w-4" /> Share to user
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
