-- ==========================================
-- DIVINE LIFTING SCHOOL - PROPER RLS SETUP
-- ==========================================
-- This project uses CUSTOM AUTH (localStorage session, anon key).
-- Supabase Auth (auth.uid()) is NOT used.
-- Therefore all policies grant access to the anon role.
-- Actual security is enforced at the application layer.
-- ==========================================

-- 1. ENABLE RLS ON ALL TABLES
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS students ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS exam_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS homeworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS grade_scale ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS applications ENABLE ROW LEVEL SECURITY;

-- 2. DROP EXISTING POLICIES (clean slate)
DROP POLICY IF EXISTS "anon_all_profiles" ON profiles;
DROP POLICY IF EXISTS "anon_all_public_news" ON public_news;
DROP POLICY IF EXISTS "anon_all_students" ON students;
DROP POLICY IF EXISTS "anon_all_teachers" ON teachers;
DROP POLICY IF EXISTS "anon_all_parents" ON parents;
DROP POLICY IF EXISTS "anon_all_classes" ON classes;
DROP POLICY IF EXISTS "anon_all_subjects" ON subjects;

-- 3. CREATE POLICIES — anon role has full access (custom auth model)
CREATE POLICY "anon_all_profiles" ON profiles FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_public_news" ON public_news FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_students" ON students FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_teachers" ON teachers FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_parents" ON parents FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_classes" ON classes FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_subjects" ON subjects FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_teacher_assignments" ON teacher_assignments FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_exam_scores" ON exam_scores FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_attendance" ON attendance FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_payments" ON payments FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_announcements" ON announcements FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_homeworks" ON homeworks FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_grade_scale" ON grade_scale FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_contact_messages" ON contact_messages FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_applications" ON applications FOR ALL TO anon USING (true) WITH CHECK (true);

-- 4. GRANT USAGE ON SCHEMA
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
