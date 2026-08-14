# Security Deployment Checklist

This hardening update removes browser-held administrative keys, protects portal serverless endpoints with the signed-in administrator's Supabase session, and moves public website form writes to server-side code.

1. In the **website** Vercel project, set `SUPABASE_SERVICE_KEY`, `GMAIL_USER`, and `GMAIL_APP_PASSWORD`.
2. In the **portal** Vercel project, confirm `SUPABASE_SERVICE_KEY`, `GMAIL_USER`, and `GMAIL_APP_PASSWORD` are set.
3. Deploy both projects. Do not remove the older `VITE_*_ACCESS_KEY` variables until the portal deployment has completed; the new build does not use them.
4. Apply `supabase/migrations/20260813_lock_public_intake_and_news.sql` after the website deployment. This is the step that removes anonymous access to contact messages and applications.
5. Confirm every existing active portal account has an `auth_id` linked to a Supabase Auth user. Newly created teacher, student, and parent accounts are provisioned automatically. A legacy account without this link must be provisioned by an authenticated administrator before it can sign in.
6. Remove `VITE_MASTER_ACCESS_KEY`, `VITE_TEACHER_ACCESS_KEY`, `VITE_STUDENT_ACCESS_KEY`, and `VITE_EMAIL_API_KEY` from Vercel after the deployments succeed.

The migration intentionally keeps `public_news` readable by website visitors and keeps the `news_images` bucket publicly readable. All writes to those resources require an authenticated administrator.
