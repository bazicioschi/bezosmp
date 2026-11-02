# Architecture rules

- Store collectible badge ownership in `user_badges` and active choices in `user_badge_selections`; the composite foreign key prevents selecting unowned badges.
- Keep legacy verification records compatible and synchronize their awards into collections; centralized `useVerified` resolves the badge across every existing display.
- Award anniversary badges through an app-owned auth lifecycle trigger and restrict manual awards to the authenticated founder with an owner role; clients never confer ownership.
- Mount date-gated celebration decorations once at the app root and keep their palette in global semantic CSS tokens so all themes share the seasonal layer.
- Enforce exclusive collectible recipients in database constraints and revoke badges through a founder-only atomic RPC that also removes matching legacy verification, preventing fallback resurrection.
- Username sign-in ignores surrounding whitespace and capitalization, escapes search wildcards, and rejects ambiguous matches; missing usernames are expected lookup results, not function failures.