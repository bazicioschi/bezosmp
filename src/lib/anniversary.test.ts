import { describe, expect, it } from 'vitest';
import { isAnniversarySeason, resolveActiveBadge } from './anniversary';

describe('annual celebration dates', () => {
  it('starts on January 25 each year', () => {
    for (const year of [2026, 2027, 2028]) {
      expect(isAnniversarySeason(new Date(year, 0, 24, 23, 59))).toBe(false);
      expect(isAnniversarySeason(new Date(year, 0, 25))).toBe(true);
    }
  });
  it('includes February 1 and stops February 2', () => {
    expect(isAnniversarySeason(new Date(2027, 0, 31))).toBe(true);
    expect(isAnniversarySeason(new Date(2027, 1, 1, 23, 59))).toBe(true);
    expect(isAnniversarySeason(new Date(2027, 1, 2))).toBe(false);
    expect(isAnniversarySeason(new Date(2026, 10, 1))).toBe(false);
  });
});
describe('owned badge choices', () => {
  it('lets users select an awarded Winter badge', () => {
    expect(resolveActiveBadge(['party', 'winter'], 'winter', 'ladybug')).toBe('winter');
  });
  it('does not display an unowned selection', () => {
    expect(resolveActiveBadge(['party'], 'winter')).toBe('party');
  });
  it('preserves existing verification until a new badge is selected', () => {
    expect(resolveActiveBadge(['party', 'ladybug'], null, 'ladybug')).toBe('ladybug');
  });
  it('gives accounts without a previous verification the Party badge', () => {
    expect(resolveActiveBadge(['party'])).toBe('party');
  });
});