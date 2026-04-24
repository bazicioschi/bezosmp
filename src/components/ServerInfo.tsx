import { Globe } from 'lucide-react';
import { useRef } from 'react';

export function ServerInfo() {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY > 0) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  };

  return (
    <div className="minecraft-card p-4" ref={containerRef} onWheel={handleWheel}>
      {/* Header with redstone accent */}
      <div className="h-1 bg-primary redstone-glow mb-4 -mt-4 -mx-4" />
      
      <div className="flex items-center gap-3 mb-4">
        <div className="mc-slot h-12 w-12 flex items-center justify-center mc-slot-active">
          <Globe className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="mc-text text-xl text-foreground glow-text">BEZO COMMUNITY</h2>
        </div>
      </div>

    </div>
  );
}