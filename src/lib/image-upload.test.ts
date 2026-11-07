import { describe, expect, it } from 'vitest';
import { isImageSizeAllowed } from './image-upload';

describe('image upload size limit', () => {
  it('allows an image of exactly 5 GB', () => {
    expect(isImageSizeAllowed(5 * 1024 * 1024 * 1024)).toBe(true);
  });
  it('rejects an image larger than 5 GB', () => {
    expect(isImageSizeAllowed(5 * 1024 * 1024 * 1024 + 1)).toBe(false);
  });
});