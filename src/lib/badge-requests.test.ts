import { describe, expect, it } from 'vitest';
import { qualifiesForBadgeRequest, isRequestableBadge } from './badge-requests';

describe('badge request rules', () => {
  it('rejects fewer than 1,000 followers and accepts exactly 1,000', () => {
    expect(qualifiesForBadgeRequest(999)).toBe(false);
    expect(qualifiesForBadgeRequest(1000)).toBe(true);
    expect(qualifiesForBadgeRequest(1001)).toBe(true);
  });
  it('allows only default verification, never exclusive badges', () => {
    expect(isRequestableBadge('default')).toBe(true);
    for (const badge of ['ladybug', 'rat', 'party', 'winter', 'rainbow']) {
      expect(isRequestableBadge(badge)).toBe(false);
    }
  });
});