import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Privacy settings are stored hidden inside the bio field using a separator
const PRIV_SEP = '|||BEZOSMP_PRIV|||';

export function parseBioPrivacy(bio: string | null): {
  displayBio: string | null;
  isPrivate: boolean;
  allowedViewerIds: string[];
} {
  if (!bio || !bio.includes(PRIV_SEP)) {
    return { displayBio: bio, isPrivate: false, allowedViewerIds: [] };
  }
  const [displayBio, metaStr] = bio.split(PRIV_SEP);
  try {
    const meta = JSON.parse(metaStr);
    return {
      displayBio: displayBio || null,
      isPrivate: !!meta.p,
      allowedViewerIds: Array.isArray(meta.v) ? meta.v : [],
    };
  } catch {
    return { displayBio: bio, isPrivate: false, allowedViewerIds: [] };
  }
}

export function encodeBioPrivacy(
  displayBio: string | null,
  isPrivate: boolean,
  allowedViewerIds: string[]
): string | null {
  if (!isPrivate && allowedViewerIds.length === 0) return displayBio || null;
  const meta = JSON.stringify({ p: isPrivate ? 1 : 0, v: allowedViewerIds });
  return `${displayBio || ''}${PRIV_SEP}${meta}`;
}
