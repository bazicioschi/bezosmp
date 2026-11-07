export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024 * 1024;

export function isImageSizeAllowed(size: number): boolean {
  return size >= 0 && size <= MAX_IMAGE_SIZE_BYTES;
}