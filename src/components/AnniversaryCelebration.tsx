import { useEffect, useState } from 'react';
import { PartyPopper } from 'lucide-react';
import { isAnniversarySeason } from '@/lib/anniversary';

export function AnniversaryCelebration() {
  const [active, setActive] = useState(() => isAnniversarySeason());
  useEffect(() => {
    const timer = window.setInterval(() => setActive(isAnniversarySeason()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  if (!active) return null;
  return (
    <>
      <div className="anniversary-banner" role="status">
        <PartyPopper className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span>happy bezosmp day</span>
        <PartyPopper className="h-5 w-5 shrink-0 -scale-x-100" aria-hidden="true" />
      </div>
      <div className="anniversary-confetti" aria-hidden="true">
        {Array.from({ length: 24 }, (_, i) => <i key={i} />)}
      </div>
    </>
  );
}