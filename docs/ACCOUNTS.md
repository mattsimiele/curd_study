# Curd accounts and iPhone installation

## Deployment status

Account implementation is prepared. `dist/config.js` is intentionally unconfigured until the dedicated Supabase project is ready. A visible setup message prevents pretending browser-only data is synced. The previous guest key (`curd-v1`) is preserved.

## Connect the dedicated Supabase project

1. Run `supabase/schema.sql` in its SQL editor. The progress event table must have row-level security enabled. Only an authenticated user matching `user_id` can select or insert. No anonymous reads/writes, updates, or client deletes are granted.
2. Set Authentication → URL Configuration → Site URL to `https://mattsimiele.github.io/curd_study/`. Allow that exact redirect and `http://127.0.0.1:4173/` during local testing; remove the local URL when no longer needed.
3. Enable email authentication. Configure the Magic Link email template to include the OTP: `<h2>Your Curd sign-in code</h2><p>{{ .Token }}</p><p>Enter this code in Curd. If you did not request it, ignore this email.</p>`. This keeps the iPhone Home Screen app in the same sign-in context. Verify new-user and returning-user code delivery.
4. Configure a production SMTP provider with a verified sending domain. Supabase's default sender is restricted to project team addresses and is not a public signup delivery service. Keep email confirmation enabled. Do not disable verification to work around delivery restrictions.
5. Put only the project URL and public publishable key in `dist/config.js`. Never commit service-role keys, SMTP passwords, database passwords, or user access tokens.
6. Test two real accounts: A's API token cannot select B's rows or insert with B's user ID; an unauthenticated call cannot read progress. Test OTP expiry, bad codes, logout, new signup, returning login, and progress restoration on another browser/device. Enable live accounts only after these checks. The mobile shell can be published with blank connection values and an explicit setup message.

## Persistence behavior

- Progress changes become immutable events with random UUIDs; a retried request reuses its UUID. Simultaneous devices append events rather than overwriting whole snapshots.
- Confirmed events are ordered by the database sequence. Completion and study dates accumulate; XP deltas add; best scores take the maximum. Latest server-ordered mistake/resolution wins. Note deletions are tombstones and cannot be undone by an older device.
- Pending events use separate local-storage keys per user and event, so concurrent tabs cannot overwrite each other's queues. Responses are discarded if the signed-in account changed during a request.
- The app refreshes on focus, reconnect and visible-page transitions, and after saves. It does not claim continuous real-time push sync.
- Explicit guest import is allowed once per account, with a fixed event ID. Existing account XP is not added twice during import. Guest data is never silently attached to an account.
- Logout waits for pending changes to sync; if offline, the user is told to reconnect first. Confirmed account cache is cleared after logout. Guest data remains separate.
- Browser storage can be evicted or cleared; only confirmed cloud progress survives that. The app does not claim offline cold-start support. A loaded page can queue changes through a temporary connection loss.
- This is a self-study tracker, not an authoritative exam/leaderboard scoring service. An account owner can manipulate their own API event data. Database RLS still isolates other accounts.

## iPhone

Safari → Share → Add to Home Screen → Open as Web App (if shown) → Add. Open the Curd icon and sign in. The manifest uses relative paths for GitHub Pages, includes 192/512px app icons, and an Apple 180px touch icon. Layout supports safe-area insets, readable 16px inputs and touch-sized controls. This is an installable web app, not an App Store binary. A physical iPhone install/keyboard check remains part of release QA.

## Development

`pnpm install --frozen-lockfile`, `node scripts/build-auth.mjs`, `npm run check`, `npm test`. The pinned official Supabase SDK is bundled locally so authentication does not depend on a runtime CDN. Deployment serves checked-in `dist/`; CI does not need to install dependencies just to validate the static app.
