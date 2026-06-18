# Agent Instructions

## Git Configuration
- User name: Victor
- User email: 188392460+VicRousy@users.noreply.github.com
- Vercel auto-deploy requires commit author email to match the GitHub account email, otherwise deployments are silently ignored.

## Project Overview
Divine Lifting School — full-stack school management system.
- **Stack:** React 19 + Vite 8 + Supabase + Vercel serverless (api/ folder)
- **Auth:** login_id + password, RPC-only verification (`verify_login_password` returns `is_first_login` too), MFA via Supabase Auth TOTP
- **Portals:** admin (lazy-loaded chunk), teacher, student, parent
- **Test:** vitest (128 tests across 16 files)
- **Code-split:** AdminPanel lazy-loaded (162KB separate chunk)
- **CI/CD:** GitHub Actions — build, test, typecheck (blocking), lint (non-blocking)
- **Error tracking:** Sentry (@sentry/react, @sentry/vite-plugin) — requires `VITE_SENTRY_DSN`

## Architecture Decisions
- **Zero password leaks:** All password verification goes through `verify_login_password` RPC (pgcrypto `crypt()`). No `.select('*')` on password tables. Explicit column selects everywhere.
- **Rate limiting:** `login_attempts` table — max 5 failed attempts per login_id per 15min, max 20 per IP per 15min. Applied in `verify_login_password` RPC. IP fetched via `api/get-ip.js`.
- **Session:** 24h expiry, checked every 60s. Stored in localStorage + Supabase Auth session.
- **Re-auth gates:** `requireReAuth(description, callback)` in App.jsx — sensitive ops require password re-entry.
- **Access keys:** Must be set as Vercel env vars (`VITE_MASTER_ACCESS_KEY`, `VITE_TEACHER_ACCESS_KEY`, `VITE_STUDENT_ACCESS_KEY`). No hardcoded fallbacks.
- **TypeScript:** Incremental migration — `tsconfig.json` with `strict: true` + `allowJs: true`. Core data layer (`supabaseClient.ts`) and utils converted. Components remain `.jsx`.

## Critical Context
- **Admin:** ADM-258448 / Vicrousy$2006 / victormatthew368@gmail.com / Auth user ID `a3a3e119-3bfe-4e2b-8eb8-054c964e72b1`
- **Teacher record ID:** 9, TCH-ADMIN-001
- **SQL migrations deployed (in order):** `20260611_create_missing_tables`, `20260611_add_auth_id`, `20260615_rls_with_login_function`, `20260615_audit_fixes`, `20260615_audit_fixes_v2`, `20260616_verify_login_password`, `20260616_bulk_bcrypt_and_cleanup`, `20260616_rate_limiting`, `20260616_ip_rate_limiting`
- **Vercel env vars required:** `SUPABASE_SERVICE_KEY`, `VITE_MASTER_ACCESS_KEY`, `VITE_TEACHER_ACCESS_KEY`, `VITE_STUDENT_ACCESS_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `EMAIL_API_KEY`, `VITE_API_URL`, `VITE_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`

## Relevant Files
- `src/supabaseClient.ts`: Core data layer — `lookupUserByLoginId`, `lookupUserByAuthId`, `lookupUserByEmail`, `buildUserInfo`, `USER_TABLES` config. Typed with `UserRole`, `UserRow`, `UserInfo`, `UserLookupResult`.
- `src/utils/`: All converted to `.ts` — `academicSession`, `asyncUtils`, `gradeUtils`, `nameUtils`, `safeQuery` (with TTL cache + `invalidateCache`), `useUnsavedChanges`, `pdfGenerator`.
- `src/vite-env.d.ts`: Vite env type declarations (`VITE_SUPABASE_URL`, `VITE_SENTRY_DSN`, etc.)
- `src/components/Login.tsx`: RPC-only password verify with IP, MFA verification step. Uses `.verify_login_password.is_first_login` — no redundant DB query.
- `src/components/ReAuthModal.jsx`: Generalized re-auth with description prop
- `src/components/Settings/MfaSetup.jsx`: Supabase Auth MFA enrollment (TOTP)
- `api/get-ip.js`, `api/email.js`, `api/auth.js`: Vercel serverless functions
- `supabase/migrations/`: All migration SQL files

## Commands
- `npm run dev` — dev server
- `npm run build` — production build
- `npm test` — run vitest
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — eslint (may have pre-existing errors)
