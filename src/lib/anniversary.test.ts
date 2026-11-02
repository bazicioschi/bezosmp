import { describe, expect, it } from 'vitest';
import { canReceiveWinterBadge, isAnniversarySeason, resolveActiveBadge } from './anniversary';

describe('exclusive Winter awards', () => {
  it('allows BsBosso', () => expect(canReceiveWinterBadge('4c6f9f37-7af7-42f4-9f66-102306f47609')).toBe(true));
  it('allows Vacescu', () => expect(canReceiveWinterBadge('da6d228d-9e1f-486a-8cb5-c31176989fa6')).toBe(true));
  it('allows Waitescu', () => expect(canReceiveWinterBadge('88be6d44-e200-433e-a6bd-f9b3af59e4b7')).toBe(true));
  it('rejects other users', () => expect(canReceiveWinterBadge('1c2fd2f9-d5d2-4a3b-bd6a-b735200b7200')).toBe(false));
});

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