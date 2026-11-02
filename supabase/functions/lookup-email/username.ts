export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function usernameSearchPattern(username: string): string {
  return normalizeUsername(username).replace(/[\\%_]/g, '\\$&') + '%';
}

export function uniqueUsernameMatch<T extends { username: string }>(profiles: T[], username: string): T | null {
  const matches = profiles.filter(profile => normalizeUsername(profile.username) === normalizeUsername(username));
  return matches.length === 1 ? matches[0] : null;
}