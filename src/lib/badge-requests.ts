export const BADGE_REQUEST_MIN_FOLLOWERS = 1000;
export const REQUESTABLE_BADGE = 'default' as const;

export function qualifiesForBadgeRequest(followers: number): boolean {
  return Number.isInteger(followers) && followers >= BADGE_REQUEST_MIN_FOLLOWERS;
}

export function isRequestableBadge(badge: string): boolean {
  return badge === REQUESTABLE_BADGE;
}