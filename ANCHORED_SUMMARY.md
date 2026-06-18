# Project Summary — Divine Lifting School

## Goal
Full system hardening + project maturity: security (RPC-only auth, rate limiting, MFA), Sentry error tracking, incremental TypeScript migration, performance optimization (memoization, debounced search), mobile responsiveness, accessibility, scalability, and test coverage.

## Constraints & Preferences
- Zero password leaks from DB to client — all verification via `verify_login_password` RPC (pgcrypto `crypt()`).
- No `.select('*')` on tables with password columns — explicit columns only.
- No hardcoded fallback keys — all env vars required.
- Login stays login_id + password — users never see email.
- Admin account (ADM-258448 / Vicrousy$2006) must remain functional.
- Build must pass `vite build` with zero errors.
- TypeScript: incremental via `allowJs: true`. Components convert one by one.
- Tests: vitest with jsdom, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event.

## Progress
### Done
- **N+1 queries fixed** — all lookups use `Promise.all` parallel queries on 4 tables.
- **`verify_login_password` RPC** — server-side only, pgcrypto `crypt()`. No client-side bcrypt, no plaintext, no auto-migration.
- **Bulk bcrypt conversion** — `20260616_bulk_bcrypt_and_cleanup.sql` converts all plaintext to bcrypt hashes.
- **`password` removed from all client queries** — no `.select('password')`, no `user.password`, no bare `.select('*')` on tables with password columns.
- **ReAuthModal.jsx rewritten** — `verify_login_password` RPC only, no DB password fetch fallback.
- **PasswordChangeModal.jsx rewritten** — verifies via RPC, hashes new password with bcrypt.
- **Hardcoded fallback keys removed** — `DLS-TEACHER-2026` and `DLS-STUDENT-2026` eliminated.
- **All `.select('*')` changed to explicit columns** — across every component.
- **`server/.env` scrubbed from git history** — via `git filter-branch`, force-pushed.
- **Vercel env vars set** — all 11 vars.
- **Rate limiting** — `login_attempts` table + RPC checks: max 5 failed per login_id per 15min, max 20 per IP per 15min.
- **Session expiry** — 24h timeout, checked every 60s.
- **Re-auth gates** — `requireReAuth(description, callback)` for all sensitive ops.
- **Email API hardening** — max 100 recipients per announcement.
- **IP-based rate limiting** — `api/get-ip.js` Vercel function.
- **MFA support** — Supabase Auth TOTP via `MfaSetup.jsx`.
- **CI/CD** — build + test + typecheck (blocking), lint (non-blocking).
- **Sentry** — `@sentry/react`, `@sentry/vite-plugin`, conditional init.
- **Performance optimization** — `React.memo` on Sidebar + HeaderBar, `useDeferredValue` search debounce on 4 list components, extracted memo'd row components (ScoreRow, GradebookRow, QuickAttendanceRow, AttendanceRow), `useCallback` on all row update handlers.
- **Mobile responsiveness** — all tables scrollable, all sidebars overlay on mobile, all modals fit screen, touch targets 44px, responsive stats grids.
- **Accessibility** — `:focus-visible` ring on all elements. `useFocusTrap` for modal keyboard trapping. `role="button"` + keyboard handlers on all clickable non-buttons. `role="dialog"` + `aria-modal` on modals. `aria-label` on all form inputs. `role="alert"` on errors. `aria-live` on toasts. Escape handlers on overlays.
- **TypeScript conversion (~27% of source files now `.ts`/`.tsx`):**
  - **Shared components:** `Skeleton.tsx`, `Pagination.tsx`, `ErrorBoundary.tsx`, `Toast.tsx`, `HeaderBar.tsx`, `ConfirmModal.tsx`
  - **Services:** `config/api.ts`, `services/authApi.ts`
  - **Utils:** `useFocusTrap.ts` (new), `useServerPagination.ts` (new)
  - Total: 9 more files converted (was 9 `.ts` files, now 18 `.ts`/`.tsx` files)
- **Server-side pagination** — `useServerPagination` hook with Supabase `.range()`, `.ilike()` search, and count queries. Implemented in `StudentList.jsx` — no longer loads all rows into memory. Filtering and paging done on the DB side.
- **Test expansion:** 64 → 94 tests (30 new). 11 test files (5 old + 6 new).
  - New: `useFocusTrap.test.js` (3), `useUnsavedChanges.test.js` (4), `pdfGenerator.test.js` (3), `useServerPagination.test.js` (6), `Toast.test.jsx` (5), `Pagination.test.jsx` (9)
  - Component tests using `@testing-library/react` + `userEvent` + `jsdom`.

### Blocked
- Gmail app password rotation — old password still in Vercel.
- MFA not yet enrolled — user needs to enable TOTP in Supabase dashboard.

## Key Decisions
- TypeScript: incremental — 18 source files converted (27%), 47 JSX + 5 JS remain.
- Server pagination via `useServerPagination` hook — generic, takes two async functions. Implements `.range()`, `.ilike()` search, and count queries.
- Component testing via `@testing-library/react` — `vite.config.js` has `test.environment: 'jsdom'` with `setupFiles`.

## Next Steps
1. Continue TypeScript conversion (Login, ReAuthModal, PasswordChangeModal, Sidebar next).
2. User to enable TOTP + rotate Gmail password.
3. Implement server pagination in remaining list components (TeacherList, SubjectList, ClassList, ContactMessages, Applications).

## Relevant Files
- `src/utils/useServerPagination.ts` — generic server pagination hook
- `src/utils/useFocusTrap.ts` — focus trapping hook
- `src/components/Students/StudentList.jsx` — uses server pagination with `useServerPagination`
- `src/components/Toast.tsx` → `Toast.test.jsx`
- `src/components/Common/Pagination.tsx` → `Pagination.test.jsx`
- `src/components/Common/Skeleton.tsx`
- `src/components/Common/ErrorBoundary.tsx`
- `src/components/Common/HeaderBar.tsx`
- `src/components/ConfirmModal.tsx`
- `src/config/api.ts`
- `src/services/authApi.ts`
- `vite.config.js` — includes `test.environment: 'jsdom'`, `setupFiles`
- `src/utils/test-setup.js` — imports `@testing-library/jest-dom/vitest`
- Remaining `.jsx` components: 47 files in `src/components/` + `App.jsx` + `main.jsx`
- Remaining `.js` files: 3 services + test files + `useFocusTrap.js` → `.ts` done
