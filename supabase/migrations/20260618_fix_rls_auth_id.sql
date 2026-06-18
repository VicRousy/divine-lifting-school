-- Fix ALL RLS policies: profiles.id is INTEGER, auth.uid() is UUID
-- Must use auth_id column for UUID comparison
-- Run this in Supabase SQL Editor

-- ===================== PROFILES =====================
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
DROP POLICY IF EXISTS "profiles_self_read" ON profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON profiles;

CREATE POLICY "profiles_admin_all" ON profiles FOR ALL USING (
  auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM profiles p WHERE p.auth_id = auth.uid() AND p.role = 'admin'
  )
);
CREATE POLICY "profiles_self_read" ON profiles FOR SELECT USING (auth_id = auth.uid());
CREATE POLICY "profiles_self_update" ON profiles FOR UPDATE USING (auth_id = auth.uid());

-- ===================== TEACHERS =====================
DROP POLICY IF EXISTS "teachers_admin_all" ON teachers;
CREATE POLICY "teachers_admin_all" ON teachers FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'admin')
);

-- ===================== STUDENTS =====================
DROP POLICY IF EXISTS "students_admin_all" ON students;
CREATE POLICY "students_admin_all" ON students FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'admin')
);

-- ===================== PARENTS =====================
DROP POLICY IF EXISTS "parents_admin_all" ON parents;
CREATE POLICY "parents_admin_all" ON parents FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'admin')
);

-- ===================== CLASSES =====================
DROP POLICY IF EXISTS "classes_admin_all" ON classes;
CREATE POLICY "classes_admin_all" ON classes FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'admin')
);

-- ===================== SUBJECTS =====================
DROP POLICY IF EXISTS "subjects_admin_all" ON subjects;
CREATE POLICY "subjects_admin_all" ON subjects FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'admin')
);

-- ===================== TEACHER ASSIGNMENTS =====================
DROP POLICY IF EXISTS "teacher_assignments_admin_all" ON teacher_assignments;
CREATE POLICY "teacher_assignments_admin_all" ON teacher_assignments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'admin')
);

-- ===================== EXAM SCORES =====================
DROP POLICY IF EXISTS "exam_scores_admin_all" ON exam_scores;
CREATE POLICY "exam_scores_admin_all" ON exam_scores FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'admin')
);

-- ===================== ATTENDANCE =====================
DROP POLICY IF EXISTS "attendance_admin_all" ON attendance;
CREATE POLICY "attendance_admin_all" ON attendance FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'admin')
);

-- ===================== PAYMENTS =====================
DROP POLICY IF EXISTS "payments_admin_all" ON payments;
CREATE POLICY "payments_admin_all" ON payments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'admin')
);

-- ===================== FEES =====================
DROP POLICY IF EXISTS "fees_admin_all" ON fees;
CREATE POLICY "fees_admin_all" ON fees FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'admin')
);

-- ===================== HOMEWORKS =====================
DROP POLICY IF EXISTS "homeworks_admin_all" ON homeworks;
CREATE POLICY "homeworks_admin_all" ON homeworks FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'admin')
);

-- ===================== APPLICATIONS =====================
DROP POLICY IF EXISTS "applications_admin_all" ON applications;
CREATE POLICY "applications_admin_all" ON applications FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'admin')
);
