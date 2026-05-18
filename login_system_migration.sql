-- Divine Lifting School - Login System Migration
-- Run this in Supabase Dashboard > SQL Editor
-- Adds password and login ID columns to support the custom ID/password login system

-- Add password column to teachers table
ALTER TABLE public.teachers
ADD COLUMN IF NOT EXISTS password TEXT;

-- Create admins table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to admins" ON public.admins;
CREATE POLICY "Allow read access to admins"
  ON public.admins FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow insert to admins" ON public.admins;
CREATE POLICY "Allow insert to admins"
  ON public.admins FOR INSERT
  WITH CHECK (true);

-- Ensure user_roles table has the columns we need
ALTER TABLE public.user_roles
ADD COLUMN IF NOT EXISTS reference_id BIGINT;

-- Enable RLS on teachers if not already enabled
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to teachers" ON public.teachers;
CREATE POLICY "Allow read access to teachers"
  ON public.teachers FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow insert to teachers" ON public.teachers;
CREATE POLICY "Allow insert to teachers"
  ON public.teachers FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update to teachers" ON public.teachers;
CREATE POLICY "Allow update to teachers"
  ON public.teachers FOR UPDATE
  USING (true);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to user_roles" ON public.user_roles;
CREATE POLICY "Allow read access to user_roles"
  ON public.user_roles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow insert to user_roles" ON public.user_roles;
CREATE POLICY "Allow insert to user_roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (true);
