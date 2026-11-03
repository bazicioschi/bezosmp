export const WINTER_BADGE_USER_IDS = ['4c6f9f37-7af7-42f4-9f66-102306f47609', 'da6d228d-9e1f-486a-8cb5-c31176989fa6', '88be6d44-e200-433e-a6bd-f9b3af59e4b7'];

export function canReceiveWinterBadge(userId: string): boolean {
  return WINTER_BADGE_USER_IDS.includes(userId);
}

export function isAnniversarySeason(date = new Date()): boolean {
  const month = date.getMonth();
  const day = date.getDate();
  return (month === 0 && day >= 25) || (month === 1 && day === 1);
}

export function resolveActiveBadge<T extends string>(owned: T[], selected?: T | null, legacy?: T | null, hidden = false): T | null {
  if (hidden) return null;
  if (selected && owned.includes(selected)) return selected;
  if (legacy) return legacy;
  return owned.includes('party' as T) ? 'party' as T : owned[0] ?? null;
}