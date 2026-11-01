export function isAnniversarySeason(date = new Date()): boolean {
  const month = date.getMonth();
  const day = date.getDate();
  return (month === 0 && day >= 25) || (month === 1 && day === 1);
}

export function resolveActiveBadge<T extends string>(owned: T[], selected?: T | null, legacy?: T | null): T | null {
  if (selected && owned.includes(selected)) return selected;
  if (legacy) return legacy;
  return owned.includes('party' as T) ? 'party' as T : owned[0] ?? null;
}