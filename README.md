# Divine Lifting School - Management Portal

School management system with admin, teacher, parent, and student portals.

## Tech Stack

- React + Vite (state-based routing, no React Router)
- Supabase (PostgreSQL backend)
- Vercel serverless functions (email notifications)

## Setup

```bash
npm install
npm run dev
```

### Environment Variables

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:3001
```

- `VITE_API_URL` — email API endpoint. Empty string on Vercel (uses relative `/api/email`), `http://localhost:3001` for local dev.

## Portals

| Role      | Features                                                                 |
|-----------|--------------------------------------------------------------------------|
| Admin     | Dashboard, Students, Teachers, Classes, Scores, Fees, News, Applications |
| Teacher   | Gradebook, Attendance, Class Roster, Homework Manager, Announcements      |
| Parent    | Dashboard, Student grades, Homework, Fees                                |
| Student   | Portal with grades, homework, fees                                       |

## Key Architecture

- **Custom auth** via localStorage session, NOT Supabase Auth — all queries use the anon key
- **Email** handled by a single `api/email.js` Vercel function supporting all email types
- **Grade scale** stored in Supabase DB with localStorage fallback
- **Bulk import** auto-generates IDs/passwords, creates parent + student records
- **Password management**: bcrypt hashing, `is_first_login` flag, admin password reset tool

## Database

Run the migration files in Supabase SQL Editor:
1. `website_supabase_migration.sql` — core schema
2. `add_grade_scale.sql` — grade scale table
3. `add_last_login.sql` — last_login column

## Deployment

Deployed on Vercel at `divine-lifting-school.vercel.app`. Auto-deploys from the `main` branch.
