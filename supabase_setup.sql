-- Divine Lifting School - Schema Consistency Migration
-- Run this in Supabase Dashboard > SQL Editor

-- Ensure exam_scores has the correct columns for CA1/CA2/Exam scoring
ALTER TABLE public.exam_scores
ADD COLUMN IF NOT EXISTS ca1_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ca2_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS exam_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS class_id BIGINT,
ADD COLUMN IF NOT EXISTS term TEXT,
ADD COLUMN IF NOT EXISTS academic_year TEXT DEFAULT '2026/2027',
ADD COLUMN IF NOT EXISTS teacher_comment TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Ensure students table has class_id foreign key and login_id
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS class_id BIGINT REFERENCES public.classes(id),
ADD COLUMN IF NOT EXISTS login_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS student_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS parent_id BIGINT REFERENCES public.parents(id),
ADD COLUMN IF NOT EXISTS password TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_promotion_date TIMESTAMPTZ;

-- Ensure parents table has login_id
ALTER TABLE public.parents
ADD COLUMN IF NOT EXISTS parent_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS login_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS password TEXT;

-- Ensure profiles table has verification columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS verification_code TEXT,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin',
ADD COLUMN IF NOT EXISTS password TEXT,
ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN DEFAULT true;

-- Ensure teachers table has login_id
ALTER TABLE public.teachers
ADD COLUMN IF NOT EXISTS login_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS password TEXT,
ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN DEFAULT true;

-- Announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT 'all',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'announcements_audience_check') THEN
    ALTER TABLE public.announcements ADD CONSTRAINT announcements_audience_check CHECK (audience IN ('all', 'teachers', 'students', 'parents', 'admins'));
  END IF;
END $$;

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read announcements" ON public.announcements;
CREATE POLICY "Authenticated users can read announcements" ON public.announcements FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert announcements" ON public.announcements;
CREATE POLICY "Authenticated users can insert announcements" ON public.announcements FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update announcements" ON public.announcements;
CREATE POLICY "Authenticated users can update announcements" ON public.announcements FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete announcements" ON public.announcements;
CREATE POLICY "Authenticated users can delete announcements" ON public.announcements FOR DELETE TO authenticated USING (true);

-- Drop old conflicting columns if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'class_name') THEN
    ALTER TABLE public.students DROP COLUMN class_name;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exam_scores' AND column_name = 'ca_score') THEN
    ALTER TABLE public.exam_scores DROP COLUMN ca_score;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exam_scores' AND column_name = 'total_score') THEN
    ALTER TABLE public.exam_scores DROP COLUMN total_score;
  END IF;
END $$;

-- Create unique index for exam_scores to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS unique_exam_score_entry
ON public.exam_scores(student_id, subject_id, term, academic_year);

-- Add check constraints for score ranges
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'exam_scores_ca1_check') THEN
    ALTER TABLE public.exam_scores ADD CONSTRAINT exam_scores_ca1_check CHECK (ca1_score >= 0 AND ca1_score <= 20);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'exam_scores_ca2_check') THEN
    ALTER TABLE public.exam_scores ADD CONSTRAINT exam_scores_ca2_check CHECK (ca2_score >= 0 AND ca2_score <= 20);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'exam_scores_exam_check') THEN
    ALTER TABLE public.exam_scores ADD CONSTRAINT exam_scores_exam_check CHECK (exam_score >= 0 AND exam_score <= 60);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'exam_scores_approval_status_check') THEN
    ALTER TABLE public.exam_scores ADD CONSTRAINT exam_scores_approval_status_check CHECK (approval_status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

-- Grade submissions workflow table
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

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'grade_submissions_status_check') THEN
    ALTER TABLE public.grade_submissions ADD CONSTRAINT grade_submissions_status_check CHECK (status IN ('draft', 'submitted', 'approved', 'rejected'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'grade_submissions_unique_entry') THEN
    ALTER TABLE public.grade_submissions ADD CONSTRAINT grade_submissions_unique_entry UNIQUE (teacher_id, class_id, subject_id, term, academic_year);
  END IF;
END $$;

ALTER TABLE public.grade_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read grade submissions" ON public.grade_submissions;
CREATE POLICY "Authenticated users can read grade submissions" ON public.grade_submissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can create grade submissions" ON public.grade_submissions;
CREATE POLICY "Authenticated users can create grade submissions" ON public.grade_submissions FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update grade submissions" ON public.grade_submissions;
CREATE POLICY "Authenticated users can update grade submissions" ON public.grade_submissions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Payments table for fee tracking
CREATE TABLE IF NOT EXISTS public.payments (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id BIGINT NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  fee_type TEXT NOT NULL DEFAULT 'Tuition',
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read payments" ON public.payments;
CREATE POLICY "Authenticated users can read payments" ON public.payments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert payments" ON public.payments;
CREATE POLICY "Authenticated users can insert payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update payments" ON public.payments;
CREATE POLICY "Authenticated users can update payments" ON public.payments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete payments" ON public.payments;
CREATE POLICY "Authenticated users can delete payments" ON public.payments FOR DELETE TO authenticated USING (true);

-- Homework table for teacher assignments
CREATE TABLE IF NOT EXISTS public.homeworks (
  id BIGSERIAL PRIMARY KEY,
  teacher_id BIGINT NOT NULL,
  class_id BIGINT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.homeworks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read homeworks" ON public.homeworks;
CREATE POLICY "Authenticated users can read homeworks" ON public.homeworks FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert homeworks" ON public.homeworks;
CREATE POLICY "Authenticated users can insert homeworks" ON public.homeworks FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update homeworks" ON public.homeworks;
CREATE POLICY "Authenticated users can update homeworks" ON public.homeworks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete homeworks" ON public.homeworks;
CREATE POLICY "Authenticated users can delete homeworks" ON public.homeworks FOR DELETE TO authenticated USING (true);

-- Enable RLS on key tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_scores ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read students, parents, teachers
DROP POLICY IF EXISTS "Authenticated users can read students" ON public.students;
CREATE POLICY "Authenticated users can read students" ON public.students FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert students" ON public.students;
CREATE POLICY "Authenticated users can insert students" ON public.students FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update students" ON public.students;
CREATE POLICY "Authenticated users can update students" ON public.students FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can read parents" ON public.parents;
CREATE POLICY "Authenticated users can read parents" ON public.parents FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert parents" ON public.parents;
CREATE POLICY "Authenticated users can insert parents" ON public.parents FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can read teachers" ON public.teachers;
CREATE POLICY "Authenticated users can read teachers" ON public.teachers FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can read exam_scores" ON public.exam_scores;
CREATE POLICY "Authenticated users can read exam_scores" ON public.exam_scores FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert exam_scores" ON public.exam_scores;
CREATE POLICY "Authenticated users can insert exam_scores" ON public.exam_scores FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update exam_scores" ON public.exam_scores;
CREATE POLICY "Authenticated users can update exam_scores" ON public.exam_scores FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
