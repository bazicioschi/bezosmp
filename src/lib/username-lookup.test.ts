import { describe, expect, it } from 'vitest';
import { normalizeUsername, uniqueUsernameMatch, usernameSearchPattern } from '../../supabase/functions/lookup-email/username';

describe('username login matching', () => {
  it('matches Waitescu despite stored trailing whitespace and entered case', () => {
    expect(uniqueUsernameMatch([{ username: 'Waitescu ', user_id: 'waitescu' }], ' waitescu ')).toEqual({ username: 'Waitescu ', user_id: 'waitescu' });
  });
  it('does not match a different username with the same prefix', () => {
    expect(uniqueUsernameMatch([{ username: 'Waitescu2' }], 'Waitescu')).toBeNull();
  });
  it('rejects ambiguous normalized usernames', () => {
    expect(uniqueUsernameMatch([{ username: 'Waitescu' }, { username: 'Waitescu ' }], 'waitescu')).toBeNull();
  });
  it('escapes database search wildcards', () => {
    expect(usernameSearchPattern(' User_100% ')).toBe('user\\_100\\%%');
    expect(normalizeUsername(' Waitescu ')).toBe('waitescu');
  });
});