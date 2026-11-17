export function canPinPost(viewerId: string | undefined, authorId: string) {
  return !!viewerId && viewerId === authorId;
}

export function sortProfilePosts<T extends { pinned: boolean; created_at: string }>(posts: T[]): T[] {
  return [...posts].sort((a, b) =>
    Number(b.pinned) - Number(a.pinned) ||
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}