# Database Migrations

## Database Type

**This project uses BIGINT for all table IDs.** All foreign key relationships use BIGINT to match existing table structures.

## Recommended Setup

Run `supabase_setup.sql` in Supabase first. It contains the currently required setup for announcements, grade approvals, teacher comments, profile name columns, and the 2026/2027 session columns used by the app.

Path in this project:

```text
supabase_setup.sql
```

Open Supabase Dashboard -> SQL Editor -> New query, paste the full file, then click Run.

## Announcements Setup

The admin and teacher announcement screens require the `announcements` table in Supabase:

```sql
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT 'all'
    CHECK (audience IN ('all', 'teachers', 'students', 'parents')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read announcements"
ON public.announcements
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create announcements"
ON public.announcements
FOR INSERT
TO authenticated
WITH CHECK (true);
```

## Grade Approval Setup

Grade approval uses the `grade_submissions` table as the approval workflow source of truth. The teacher submits a class/subject/term, and the admin approves that submission.

```sql
CREATE TABLE IF NOT EXISTS public.grade_submissions (
  id BIGSERIAL PRIMARY KEY,
  teacher_id BIGINT NOT NULL,
  class_id BIGINT NOT NULL,
  subject_id BIGINT NOT NULL,
  term TEXT NOT NULL,
  academic_year TEXT NOT NULL DEFAULT '2026/2027',
  status TEXT NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (teacher_id, class_id, subject_id, term, academic_year),
  CHECK (status IN ('draft', 'submitted', 'approved', 'rejected'))
);
```

## Teacher Gradebook Setup

The Teacher Gradebook component requires the following columns in the `exam_scores` table:

### Required Columns

- `student_id` (bigint, foreign key to students)
- `class_id` (bigint, foreign key to classes)
- `subject_id` (bigint, foreign key to subjects)
- `term` (text) - the term name/label
- `academic_year` (text) - e.g., "2026/2027"
- `ca1_score` (numeric, 0-20)
- `ca2_score` (numeric, 0-20)
- `exam_score` (numeric, 0-60)
- `teacher_comment` (text) - **NEW** - Teacher's comment field for each student

### Migration SQL

If the `teacher_comment` column doesn't exist, run this migration in Supabase:

```sql
-- Add teacher_comment column to exam_scores table
ALTER TABLE exam_scores
ADD COLUMN teacher_comment TEXT DEFAULT '';

-- Add or update unique constraint for upsert operations
-- Note: This uses bigint to match existing table structure
ALTER TABLE exam_scores
ADD CONSTRAINT unique_exam_score_entry
UNIQUE(student_id, subject_id, term, academic_year);
```

### Grade Calculation

The Teacher Gradebook automatically calculates:

- **Total**: CA1 + CA2 + Exam = 0-100
- **Grade**:
  - A+ (90-100) - Excellent
  - A (80-89) - Very Good
  - B+ (70-79) - Good
  - B (60-69) - Satisfactory
  - C (50-59) - Pass
  - F (0-49) - Fail

All grades and comments are saved to the `exam_scores` table.

## Profile Name Columns

To use consistent `first_name`, `middle_name`, and `last_name` fields for all users, add these columns to the `profiles` table in Supabase.

```sql
ALTER TABLE profiles
ADD COLUMN first_name TEXT,
ADD COLUMN middle_name TEXT,
ADD COLUMN last_name TEXT;
```

Once these columns exist, the app can store names in split fields instead of only `full_name`, making teacher and admin names consistent across the system.

If you already removed `full_name` and want to keep existing profile rows, do not delete profiles that are referenced by other tables. Instead, update the existing rows and leave their foreign-key relationships intact.

To populate blank names safely, use this SQL:

```sql
UPDATE profiles
SET first_name = split_part(full_name, ' ', 1),
    last_name = split_part(full_name, ' ', array_length(regexp_split_to_array(full_name, E'\\s+'), 1)),
    middle_name = CASE
      WHEN array_length(regexp_split_to_array(full_name, E'\\s+'), 1) > 2 THEN
        substring(full_name FROM E'^\\S+\\s+(.*)\\s+\\S+$')
      ELSE
        ''
    END
WHERE full_name IS NOT NULL;
```

Then normalize missing middle names safely:

```sql
UPDATE profiles
SET middle_name = ''
WHERE middle_name IS NULL;
```

This keeps the profile row in place and avoids deleting data that is still referenced by other tables like `attendance`.

## Academic Session Rule

The app now treats the academic year as a Nigerian school session:

- First Term starts a new session, for example `2026/2027`.
- Second Term and Third Term remain in that same session.
- The next First Term starts the next session, for example `2027/2028`.

Use the `terms` table as the source of truth by creating terms such as:

```text
First Term  | 2026/2027 | active
Second Term | 2026/2027
Third Term  | 2026/2027
```

When the next school year begins, add `First Term | 2027/2028` and make it active.
