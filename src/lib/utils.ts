import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Privacy settings are stored hidden inside the bio field using a separator
const PRIV_SEP = '|||BEZOSMP_PRIV|||';

export type SocialLink = {
  platform: 'youtube' | 'tiktok' | 'instagram' | 'twitter' | 'twitch' | 'github' | 'discord' | 'reddit' | 'other';
  url: string;
  label?: string;
};

export function parseBioPrivacy(bio: string | null): {
  displayBio: string | null;
  isPrivate: boolean;
  allowedViewerIds: string[];
  linkedAccountIds: string[];
  socialLinks: SocialLink[];
} {
  if (!bio || !bio.includes(PRIV_SEP)) {
    return { displayBio: bio, isPrivate: false, allowedViewerIds: [], linkedAccountIds: [], socialLinks: [] };
  }
  const [displayBio, metaStr] = bio.split(PRIV_SEP);
  try {
    const meta = JSON.parse(metaStr);
    return {
      displayBio: displayBio || null,
      isPrivate: !!meta.p,
      allowedViewerIds: Array.isArray(meta.v) ? meta.v : [],
      linkedAccountIds: Array.isArray(meta.a) ? meta.a : [],
      socialLinks: Array.isArray(meta.s) ? meta.s : [],
    };
  } catch {
    return { displayBio: bio, isPrivate: false, allowedViewerIds: [], linkedAccountIds: [], socialLinks: [] };
  }
}

export function encodeBioPrivacy(
  displayBio: string | null,
  isPrivate: boolean,
  allowedViewerIds: string[],
  linkedAccountIds: string[] = [],
  socialLinks: SocialLink[] = []
): string | null {
  const hasData = isPrivate || allowedViewerIds.length > 0 || linkedAccountIds.length > 0 || socialLinks.length > 0;
  if (!hasData) return displayBio || null;
  const meta: Record<string, unknown> = { p: isPrivate ? 1 : 0, v: allowedViewerIds };
  if (linkedAccountIds.length > 0) meta.a = linkedAccountIds;
  if (socialLinks.length > 0) meta.s = socialLinks;
  return `${displayBio || ''}${PRIV_SEP}${JSON.stringify(meta)}`;
}
