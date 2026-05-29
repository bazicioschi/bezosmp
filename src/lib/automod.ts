import { supabase } from '@/integrations/supabase/client';

// ─── Bot identity ────────────────────────────────────────────────────────────
export const BOT_NAME = 'BezosMP';
export const BOT_AVATAR = 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=BezosMP&backgroundColor=dc2626&eyes=bulging&mouth=smile01';

// ─── Word list with severity tiers ──────────────────────────────────────────
// Tier 1 → 1–3 days   (mild profanity / spam)
// Tier 2 → 7–14 days  (targeted harassment, moderate slurs)
// Tier 3 → 30–90 days (severe slurs, hate speech)

const TIER1: RegExp[] = [
  /\bsh[i1]t\b/i,
  /\ba[s$]{2}\b/i,
  /\bcr[a4]p\b/i,
  /\bdamn\b/i,
  /\bhe[l1]{2}\b/i,
  /\bpiss\b/i,
  /\bstfu\b/i,
  /\bidiot\b/i,
  /\bmoron\b/i,
  /\bstupid\b/i,
];

const TIER2: RegExp[] = [
  /\bb[i1]tch\b/i,
  /\bba[s$]tard\b/i,
  /\bd[i1]ck\b/i,
  /\bp[u*]ssy\b/i,
  /\bslut\b/i,
  /\bwh[o0]re\b/i,
  /\bdouche\b/i,
  /\bkys\b/i,
  /\bk[i1]ll\s*your\s*self\b/i,
  /\bretard\b/i,
  /\bspaz\b/i,
];

const TIER3: RegExp[] = [
  /\bf[u*]ck\b/i,
  /\bn[i1]gg[ae]\b/i,
  /\bf[a4]gg[o0]t\b/i,
  /\bc[u*]nt\b/i,
  /\bk[i1]ke\b/i,
  /\bsp[i1]c\b/i,
  /\bch[i1]nk\b/i,
  /\br[a4]p[e3]\b/i,
  /\bmolest\b/i,
  /\bpedo\b/i,
];

export type AutomodResult =
  | { flagged: false }
  | { flagged: true; tier: 1 | 2 | 3; banDays: number; reason: string };

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function checkContent(text: string): AutomodResult {
  for (const re of TIER3) {
    if (re.test(text)) {
      return { flagged: true, tier: 3, banDays: randomBetween(30, 90), reason: 'Severe language / hate speech detected by BezosMP AutoMod.' };
    }
  }
  for (const re of TIER2) {
    if (re.test(text)) {
      return { flagged: true, tier: 2, banDays: randomBetween(7, 14), reason: 'Harassment or offensive language detected by BezosMP AutoMod.' };
    }
  }
  for (const re of TIER1) {
    if (re.test(text)) {
      return { flagged: true, tier: 1, banDays: randomBetween(1, 3), reason: 'Mild inappropriate language detected by BezosMP AutoMod.' };
    }
  }
  return { flagged: false };
}

/**
 * If content is flagged, inserts a timed ban and sends a bot inbox message.
 * Returns true if the user was banned.
 */
export async function runAutomod(userId: string, content: string): Promise<boolean> {
  const result = checkContent(content);
  if (!result.flagged) return false;

  // Never ban the owner (bazicioschi)
  const { data: ownerRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'owner')
    .maybeSingle();
  if (ownerRole) return false;

  const { banDays, reason } = result;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + banDays);

  // Write ban expiry to the user's own profile row (bypasses RLS — user can update their own profile)
  await supabase
    .from('profiles')
    .update({ automod_banned_until: expiresAt.toISOString() })
    .eq('user_id', userId);

  // Also store in localStorage as instant local fallback
  localStorage.setItem(
    `automod_ban_${userId}`,
    JSON.stringify({ expires_at: expiresAt.toISOString(), reason })
  );

  // Best-effort edge function call (works if/when deployed)
  supabase.functions.invoke('automod-ban', {
    body: { user_id: userId, reason, expires_at: expiresAt.toISOString() },
  }).catch(() => {});

  // Send bot inbox message
  await supabase.from('inbox_messages').insert({
    user_id: userId,
    type: 'bot_ban',
    subject: `⚠️ You have been temporarily banned (${banDays} day${banDays > 1 ? 's' : ''})`,
    body: reason,
    data: {
      bot: 'bezosmp',
      bot_name: BOT_NAME,
      bot_avatar: BOT_AVATAR,
      ban_days: banDays,
      expires_at: expiresAt.toISOString(),
    },
  });

  return true;
}
