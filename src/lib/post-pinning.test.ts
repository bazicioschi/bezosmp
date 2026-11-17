import { describe, expect, it } from 'vitest';
import { canPinPost, sortProfilePosts } from './post-pinning';

describe('post pinning', () => {
  it('allows only the original author to pin', () => {
    expect(canPinPost('author', 'author')).toBe(true);
    expect(canPinPost('moderator', 'author')).toBe(false);
    expect(canPinPost(undefined, 'author')).toBe(false);
  });
  it('places pinned posts first and restores chronological order after unpinning', () => {
    const posts = [
      { id: 'new', pinned: false, created_at: '2026-11-17T16:00:00Z' },
      { id: 'old', pinned: true, created_at: '2026-01-28T16:00:00Z' },
    ];
    expect(sortProfilePosts(posts).map(p => p.id)).toEqual(['old', 'new']);
    expect(sortProfilePosts(posts.map(p => ({ ...p, pinned: false }))).map(p => p.id)).toEqual(['new', 'old']);
  });
});