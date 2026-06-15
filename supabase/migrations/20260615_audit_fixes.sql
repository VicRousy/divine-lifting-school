-- ==========================================
-- AUDIT FIXES: secure login, RLS, indexes
-- ==========================================

-- 1. SECURE lookup_user_by_login_id: exclude password, verification_code
CREATE OR REPLACE FUNCTION lookup_user_by_login_id(p_login_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT row_to_json(t) INTO result FROM (
    SELECT id, login_id, email, first_name, last_name, role, school_id,
           staff_id, student_id, parent_id, class_id, is_first_login,
           'admin'::text AS _role
    FROM profiles WHERE LOWER(login_id) = LOWER(p_login_id) LIMIT 1
  ) t;
  IF result IS NOT NULL THEN RETURN result; END IF;

  SELECT row_to_json(t) INTO result FROM (
    SELECT id, login_id, email, first_name, last_name, staff_id, is_first_login,
           'teacher'::text AS _role
    FROM teachers WHERE LOWER(login_id) = LOWER(p_login_id) LIMIT 1
  ) t;
  IF result IS NOT NULL THEN RETURN result; END IF;

  SELECT row_to_json(t) INTO result FROM (
    SELECT id, login_id, email, first_name, last_name, student_id, class_id,
           parent_id, is_first_login, 'student'::text AS _role
    FROM students WHERE LOWER(login_id) = LOWER(p_login_id) LIMIT 1
  ) t;
  IF result IS NOT NULL THEN RETURN result; END IF;

  SELECT row_to_json(t) INTO result FROM (
    SELECT id, login_id, email, first_name, last_name, parent_id,
           'parent'::text AS _role
    FROM parents WHERE LOWER(login_id) = LOWER(p_login_id) LIMIT 1
  ) t;

  RETURN result;
END;
$$;

-- 2. Add is_admin() helper function for RLS
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- 3. Fix RLS on terms, fees, user_roles
DROP POLICY IF EXISTS "Enable all for authenticated users" ON terms;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON fees;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON user_roles;

ALTER TABLE terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "terms_admin_all" ON terms FOR ALL USING (is_admin());
CREATE POLICY "terms_auth_read" ON terms FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "fees_admin_all" ON fees FOR ALL USING (is_admin());
CREATE POLICY "fees_self_read" ON fees FOR SELECT USING (
  EXISTS (SELECT 1 FROM students s WHERE s.id = fees.student_id AND s.auth_id = auth.uid())
);

CREATE POLICY "user_roles_admin_all" ON user_roles FOR ALL USING (is_admin());

-- 4. Fix INSERT policies for contact_messages and applications (public can submit)
DROP POLICY IF EXISTS "cm_admin_all" ON contact_messages;
DROP POLICY IF EXISTS "app_admin_all" ON applications;

CREATE POLICY "cm_insert_anon" ON contact_messages FOR INSERT TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY "cm_admin_all" ON contact_messages FOR ALL USING (is_admin());

CREATE POLICY "app_insert_anon" ON applications FOR INSERT TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY "app_admin_all" ON applications FOR ALL USING (is_admin());

-- 5. Add INSERT policy for public_news (admins need to create news)
DROP POLICY IF EXISTS "news_auth_read" ON public_news;
CREATE POLICY "news_admin_all" ON public_news FOR ALL USING (is_admin());
CREATE POLICY "news_auth_read" ON public_news FOR SELECT USING (auth.role() = 'authenticated');

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_login_id_lower ON profiles (LOWER(login_id));
CREATE INDEX IF NOT EXISTS idx_teachers_login_id_lower ON teachers (LOWER(login_id));
CREATE INDEX IF NOT EXISTS idx_students_login_id_lower ON students (LOWER(login_id));
CREATE INDEX IF NOT EXISTS idx_parents_login_id_lower ON parents (LOWER(login_id));

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles (email);
CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers (email);
CREATE INDEX IF NOT EXISTS idx_students_email ON students (email);
CREATE INDEX IF NOT EXISTS idx_parents_email ON parents (email);

CREATE INDEX IF NOT EXISTS idx_teachers_auth_id ON teachers (auth_id);
CREATE INDEX IF NOT EXISTS idx_students_auth_id ON students (auth_id);
CREATE INDEX IF NOT EXISTS idx_parents_auth_id ON parents (auth_id);

CREATE INDEX IF NOT EXISTS idx_students_class_id ON students (class_id);
CREATE INDEX IF NOT EXISTS idx_students_is_active ON students (is_active);

CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher_id ON teacher_assignments (teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_class_id ON teacher_assignments (class_id);

CREATE INDEX IF NOT EXISTS idx_exam_scores_class_subject ON exam_scores (class_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance (date);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments (student_id);
CREATE INDEX IF NOT EXISTS idx_homeworks_class_id ON homeworks (class_id);
