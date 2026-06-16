# Divine Lifting School — Management System

Multi-portal school management platform serving administrators, teachers, students, and parents. Built with React + Supabase, deployed on Vercel.

**Production:** https://divine-lifting-school.vercel.app

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 8 |
| Backend | Supabase (PostgreSQL), Vercel Serverless Functions |
| Database | PostgreSQL with pgcrypto, Row-Level Security |
| Auth | Custom login (login_id + password) + Supabase Auth for email-based features |
| Email | Nodemailer via Vercel function (Gmail SMTP) |
| PDF | jsPDF + jspdf-autotable (report cards, invoices) |
| Charts | Canvas-based (DashboardStats) |

## Portals

| Role | Access | Key Features |
|------|--------|--------------|
| **Admin** | ADM-XXXXX | Full dashboard, manage students/teachers/classes, fees, scores, news, applications, bulk import, grade scales, promotions |
| **Teacher** | TCH-XXXXX | Gradebook, attendance, class roster, homework manager, announcements, student communications |
| **Student** | STD-XXXXX | Grades, homework, fees, attendance, class schedule |
| **Parent** | PAR-XXXXX | Student grades, homework assignments, fee payments |

### ID Format

- **Admin:** `ADM-XXXXX`
- **Teacher:** `TCH-XXXXX` or `TCH-ADMIN-XXX`
- **Student:** `STD-XXXXX`
- **Parent:** `PAR-XXXXX`

## Architecture

### Authentication Flow

1. User enters **login_id + password**
2. `verify_login_password` RPC (pgcrypto `crypt()`) verifies on the server — **password never leaves the DB**
3. `lookupUserByLoginId` fetches user metadata (no password field)
4. On first login, user sets a permanent password
5. Session stored in `localStorage`, checked app-wide
6. Re-auth modal uses the same RPC for sensitive operations

### Security Design

- **Zero password leaks:** No `.select('password')`, no `user.password` reads, no bare `.select('*')` on tables with password columns
- **Server-side verification only:** `verify_login_password` RPC is the sole verification path — no client-side bcrypt compare, no plaintext fallback
- **Rate limiting:** 5 failed attempts per login_id in 15 minutes via `login_attempts` table
- **RLS enabled** on all tables
- **Hardcoded keys eliminated:** `VITE_TEACHER_ACCESS_KEY`, `VITE_STUDENT_ACCESS_KEY`, `VITE_MASTER_ACCESS_KEY` are required Vercel env vars — no fallbacks
- **Git history scrubbed:** Secrets removed from all commits
- **Access keys for registration:** Teacher/student registration requires pre-shared access keys (env vars)

### Data Layer

- **Supabase anon key** for all client queries (proper RLS restricts access)
- **Service role key** in serverless functions (create/reset auth users)
- **Parallel fallback lookups:** `lookupUserByLoginId` queries all 4 user tables in parallel via `Promise.all`
- **Bcrypt hashing** for all passwords — new registrations hash client-side before INSERT, existing passwords bulk-converted via SQL migration

## Project Structure

```
src/
├── components/
│   ├── Admin/          — Dashboard, Students, Teachers, Classes, Fees, etc.
│   ├── TeacherPortal/  — Gradebook, Attendance, Homework, etc.
│   ├── StudentPortal/  — Grades, homework, fees view
│   ├── ParentPortal/   — Student oversight dashboard
│   ├── Academics/      — Scores, grade scales, report cards
│   ├── Finance/        — Fee management
│   ├── Settings/       — School settings, password changes
│   ├── Common/         — Shared UI components
│   ├── Login.jsx       — Auth entry point
│   ├── ReAuthModal.jsx — Password re-verification
│   └── PasswordChangeModal.jsx
├── services/
│   ├── emailService.js      — Email sending
│   ├── authApi.js           — Auth user management API
│   └── announcementService.js
├── supabaseClient.js        — DB client, user lookup functions
├── App.jsx                  — Portal router (state-based)
├── config/                  — Grade scales, academic sessions
└── utils/                   — Utility functions

api/
├── email.js    — Vercel serverless: send all email types
└── auth.js     — Vercel serverless: create/reset/delete auth users

supabase/migrations/   — SQL migrations (applied in order)
scripts/
└── apply-migration.js — Apply SQL via Supabase REST API
```

## Database Migrations (apply in order)

| File | Purpose |
|------|---------|
| `20260611_create_missing_tables.sql` | Core schema |
| `20260611_add_auth_id.sql` | Auth ID column for user sync |
| `20260615_rls_with_login_function.sql` | RLS policies + `lookup_user_by_login_id` |
| `20260615_audit_fixes.sql` | Audit logging fixes |
| `20260615_audit_fixes_v2.sql` | Additional audit corrections |
| `20260616_verify_login_password.sql` | `verify_login_password` RPC with pgcrypto |
| `20260616_bulk_bcrypt_and_cleanup.sql` | Bulk bcrypt conversion of existing passwords |
| `20260616_rate_limiting.sql` | `login_attempts` table + rate-limiting RPC |

## Setup

```bash
npm install
npm run dev
```

### Environment Variables (`.env`)

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:3001
VITE_MASTER_ACCESS_KEY=your_admin_signup_key
VITE_TEACHER_ACCESS_KEY=your_teacher_registration_key
VITE_STUDENT_ACCESS_KEY=your_student_registration_key
VITE_EMAIL_API_KEY=your_email_api_key
```

**Vercel (required for production):**

| Variable | Purpose |
|----------|---------|
| `SUPABASE_SERVICE_KEY` | Service role key for auth API |
| `GMAIL_USER` | SMTP username |
| `GMAIL_APP_PASSWORD` | SMTP password |
| Plus all `VITE_*` vars above | |

### Running Migrations

```bash
node scripts/apply-migration.js supabase/migrations/<filename>.sql
```

Requires `SUPABASE_SERVICE_KEY` in environment (set on Vercel, or pull with `vercel env pull`).

## Deployment

Auto-deploys from `main` branch via Vercel. The `api/` directory is treated as serverless functions.

## ID Conventions

- `ADM-258448` — Admin (VicRousy$2006)
- `TCH-ADMIN-001` — Admin teacher record
- `TCH-XXXXX` — Teacher
- `STD-XXXXX` — Student
- `PAR-XXXXX` — Parent

## Key Design Decisions

- **State-based routing** (no React Router) — portal switching via `App.jsx` state
- **Custom auth over Supabase Auth** — login_id-based authentication with bcrypt; Supabase Auth used only for email features (password reset, verification)
- **Single email function** — all email types (welcome, verification, notifications) handled by one `api/email.js` endpoint
- **Grade scale** — stored in DB with localStorage cache as fallback
- **Bulk import** — auto-generates IDs, hashes passwords, creates parent + student records atomically
- **Audit logging** — RLS-based audit triggers track sensitive operations
