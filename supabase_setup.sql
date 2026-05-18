-- Divine Lifting School Supabase setup
-- Run this whole file in Supabase Dashboard > SQL Editor.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- User profile name columns used across admin/teacher/student screens.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS middle_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Core school columns used by the live app. The app supplies the session
-- explicitly, but defaults below match the 2026/2027 first-term launch.
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS last_promotion_date TIMESTAMPTZ;

ALTER TABLE public.subjects
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.terms
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT false;

-- Announcements used by Admin, Teacher, Student, and Parent portals.
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT 'all',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.announcements
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS body TEXT,
ADD COLUMN IF NOT EXISTS audience TEXT DEFAULT 'all',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'announcements_audience_check'
  ) THEN
    ALTER TABLE public.announcements
    ADD CONSTRAINT announcements_audience_check
    CHECK (audience IN ('all', 'teachers', 'students', 'parents'));
  END IF;
END $$;

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read announcements"
ON public.announcements;
CREATE POLICY "Authenticated users can read announcements"
ON public.announcements
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can create announcements"
ON public.announcements;
CREATE POLICY "Authenticated users can create announcements"
ON public.announcements
FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update announcements"
ON public.announcements;
CREATE POLICY "Authenticated users can update announcements"
ON public.announcements
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Exam score fields used by teacher gradebook and report cards.
ALTER TABLE public.exam_scores
ADD COLUMN IF NOT EXISTS teacher_comment TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'exam_scores_approval_status_check'
  ) THEN
    ALTER TABLE public.exam_scores
    ADD CONSTRAINT exam_scores_approval_status_check
    CHECK (approval_status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

-- Teacher grade submission workflow.
-- Using BIGINT to match existing table ID types
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
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.grade_submissions
ADD COLUMN IF NOT EXISTS teacher_id BIGINT,
ADD COLUMN IF NOT EXISTS class_id BIGINT,
ADD COLUMN IF NOT EXISTS subject_id BIGINT,
ADD COLUMN IF NOT EXISTS term TEXT,
ADD COLUMN IF NOT EXISTS academic_year TEXT DEFAULT '2026/2027',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'grade_submissions_status_check'
  ) THEN
    ALTER TABLE public.grade_submissions
    ADD CONSTRAINT grade_submissions_status_check
    CHECK (status IN ('draft', 'submitted', 'approved', 'rejected'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'grade_submissions_unique_entry'
  ) THEN
    ALTER TABLE public.grade_submissions
    ADD CONSTRAINT grade_submissions_unique_entry
    UNIQUE (teacher_id, class_id, subject_id, term, academic_year);
  END IF;

  -- Add foreign key constraints if tables exist and constraints don't exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teachers') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'grade_submissions_teacher_id_fkey'
    ) THEN
      ALTER TABLE public.grade_submissions
      ADD CONSTRAINT grade_submissions_teacher_id_fkey
      FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE;
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'classes') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'grade_submissions_class_id_fkey'
    ) THEN
      ALTER TABLE public.grade_submissions
      ADD CONSTRAINT grade_submissions_class_id_fkey
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subjects') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'grade_submissions_subject_id_fkey'
    ) THEN
      ALTER TABLE public.grade_submissions
      ADD CONSTRAINT grade_submissions_subject_id_fkey
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

ALTER TABLE public.grade_submissions ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS unique_exam_score_entry
ON public.exam_scores(student_id, subject_id, term, academic_year);

CREATE UNIQUE INDEX IF NOT EXISTS unique_attendance_student_date
ON public.attendance(student_id, date);

CREATE UNIQUE INDEX IF NOT EXISTS unique_user_role
ON public.user_roles(user_id, role);

DROP POLICY IF EXISTS "Authenticated users can read grade submissions"
ON public.grade_submissions;
CREATE POLICY "Authenticated users can read grade submissions"
ON public.grade_submissions
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can create grade submissions"
ON public.grade_submissions;
CREATE POLICY "Authenticated users can create grade submissions"
ON public.grade_submissions
FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update grade submissions"
ON public.grade_submissions;
CREATE POLICY "Authenticated users can update grade submissions"
ON public.grade_submissions
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
