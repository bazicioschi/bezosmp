import { useEffect, useState } from 'react';

export type NotifCategory =
  | 'message'
  | 'news'
  | 'ticket_reply'
  | 'new_ticket'
  | 'post_blocked'
  | 'like'
  | 'access_request';

export type NotifPrefs = Record<NotifCategory, boolean>;

const STORAGE_KEY = 'bezosmp:notif_prefs';

const DEFAULTS: NotifPrefs = {
  message: true,
  news: true,
  ticket_reply: true,
  new_ticket: true,
  post_blocked: true,
  like: true,
  access_request: true,
};

function load(): NotifPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

const listeners = new Set<(p: NotifPrefs) => void>();
let current: NotifPrefs = typeof window === 'undefined' ? DEFAULTS : load();

export function getNotificationPrefs(): NotifPrefs {
  return current;
}

export function setNotificationPref(cat: NotifCategory, enabled: boolean) {
  current = { ...current, [cat]: enabled };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(current)); } catch {}
  listeners.forEach((l) => l(current));
}

export function useNotificationPrefs() {
  const [prefs, setPrefs] = useState<NotifPrefs>(current);
  useEffect(() => {
    const l = (p: NotifPrefs) => setPrefs(p);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return {
    prefs,
    setPref: setNotificationPref,
  };
}

export const NOTIF_CATEGORY_LABELS: Record<NotifCategory, string> = {
  message: 'Messages',
  like: 'Likes on your posts',
  news: 'News announcements',
  ticket_reply: 'Support replies',
  new_ticket: 'New tickets (staff)',
  post_blocked: 'Post blocked alerts',
  access_request: 'Profile access requests',
};
