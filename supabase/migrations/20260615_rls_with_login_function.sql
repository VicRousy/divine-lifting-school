-- ==========================================
-- DIVINE LIFTING SCHOOL - RLS SETUP
-- Safe to run: drops existing policies first
-- ==========================================

-- 0. CREATE LOGIN LOOKUP FUNCTION (bypasses RLS, called before user is authenticated)
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
    SELECT p.*, 'admin'::text AS _role FROM profiles p WHERE LOWER(p.login_id) = LOWER(p_login_id) LIMIT 1
  ) t;
  IF result IS NOT NULL THEN RETURN result; END IF;

  SELECT row_to_json(t) INTO result FROM (
    SELECT t.*, 'teacher'::text AS _role FROM teachers t WHERE LOWER(t.login_id) = LOWER(p_login_id) LIMIT 1
  ) t;
  IF result IS NOT NULL THEN RETURN result; END IF;

  SELECT row_to_json(t) INTO result FROM (
    SELECT s.*, 'student'::text AS _role FROM students s WHERE LOWER(s.login_id) = LOWER(p_login_id) LIMIT 1
  ) t;
  IF result IS NOT NULL THEN RETURN result; END IF;

  SELECT row_to_json(t) INTO result FROM (
    SELECT pa.*, 'parent'::text AS _role FROM parents pa WHERE LOWER(pa.login_id) = LOWER(p_login_id) LIMIT 1
  ) t;

  RETURN result;
END;
$$;

-- ===== DROP EXISTING POLICIES =====
DROP POLICY IF EXISTS "anon_all_profiles" ON profiles;
DROP POLICY IF EXISTS "anon_all_teachers" ON teachers;
DROP POLICY IF EXISTS "anon_all_students" ON students;
DROP POLICY IF EXISTS "anon_all_parents" ON parents;
DROP POLICY IF EXISTS "anon_all_classes" ON classes;
DROP POLICY IF EXISTS "anon_all_subjects" ON subjects;
DROP POLICY IF EXISTS "anon_all_teacher_assignments" ON teacher_assignments;
DROP POLICY IF EXISTS "anon_all_exam_scores" ON exam_scores;
DROP POLICY IF EXISTS "anon_all_attendance" ON attendance;
DROP POLICY IF EXISTS "anon_all_payments" ON payments;
DROP POLICY IF EXISTS "anon_all_announcements" ON announcements;
DROP POLICY IF EXISTS "anon_all_homeworks" ON homeworks;
DROP POLICY IF EXISTS "anon_all_grade_scale" ON grade_scale;
DROP POLICY IF EXISTS "anon_all_contact_messages" ON contact_messages;
DROP POLICY IF EXISTS "anon_all_applications" ON applications;

-- Also drop legacy policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Admins have full access to students" ON students;
DROP POLICY IF EXISTS "Teachers can view students in their classes" ON students;
DROP POLICY IF EXISTS "Students can view own profile" ON students;
DROP POLICY IF EXISTS "Parents can view their children" ON students;
DROP POLICY IF EXISTS "Admins have full access to teachers" ON teachers;
DROP POLICY IF EXISTS "Teachers can view own profile" ON teachers;
DROP POLICY IF EXISTS "Admins have full access to parents" ON parents;
DROP POLICY IF EXISTS "Parents can view own profile" ON parents;
DROP POLICY IF EXISTS "Admins have full access to classes" ON classes;
DROP POLICY IF EXISTS "Everyone can view classes" ON classes;
DROP POLICY IF EXISTS "Admins have full access to subjects" ON subjects;
DROP POLICY IF EXISTS "Everyone can view subjects" ON subjects;
DROP POLICY IF EXISTS "Admins have full access to teacher_assignments" ON teacher_assignments;
DROP POLICY IF EXISTS "Admins have full access to exam_scores" ON exam_scores;
DROP POLICY IF EXISTS "Teachers can manage grades for their assignments" ON exam_scores;
DROP POLICY IF EXISTS "Students can view own grades" ON exam_scores;
DROP POLICY IF EXISTS "Parents can view children grades" ON exam_scores;
DROP POLICY IF EXISTS "Admins have full access to attendance" ON attendance;
DROP POLICY IF EXISTS "Teachers can manage attendance for their classes" ON attendance;
DROP POLICY IF EXISTS "Students can view own attendance" ON attendance;
DROP POLICY IF EXISTS "Parents can view children attendance" ON attendance;
DROP POLICY IF EXISTS "Admins have full access to payments" ON payments;
DROP POLICY IF EXISTS "Admins have full access to announcements" ON announcements;
DROP POLICY IF EXISTS "Everyone can view announcements" ON announcements;
DROP POLICY IF EXISTS "Parents can view announcements" ON announcements;
DROP POLICY IF EXISTS "Admins have full access to homeworks" ON homeworks;
DROP POLICY IF EXISTS "Teachers can view homeworks for their classes" ON homeworks;
DROP POLICY IF EXISTS "Students can view homeworks for their class" ON homeworks;
DROP POLICY IF EXISTS "Admins have full access to grade_scale" ON grade_scale;
DROP POLICY IF EXISTS "Everyone can view grade_scale" ON grade_scale;
DROP POLICY IF EXISTS "Admins can manage contact_messages" ON contact_messages;
DROP POLICY IF EXISTS "Admins can manage applications" ON applications;
DROP POLICY IF EXISTS "Everyone can view public_news" ON public_news;

-- ===== ENABLE RLS ON ALL TABLES =====
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE homeworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_scale ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- ===== PROFILES TABLE (admin accounts, linked to auth.users via auth_id) =====
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL USING (
  auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM profiles p WHERE p.auth_id = auth.uid() AND p.role = 'admin'
  )
);
CREATE POLICY "profiles_self_read" ON profiles FOR SELECT USING (auth_id = auth.uid());
CREATE POLICY "profiles_self_update" ON profiles FOR UPDATE USING (auth_id = auth.uid());

-- ===== TEACHERS TABLE =====
CREATE POLICY "teachers_admin_all" ON teachers FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "teachers_self_read" ON teachers FOR SELECT USING (auth_id = auth.uid());
CREATE POLICY "teachers_self_update" ON teachers FOR UPDATE USING (auth_id = auth.uid());

-- ===== STUDENTS TABLE =====
CREATE POLICY "students_admin_all" ON students FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "students_teacher_view" ON students FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM teacher_assignments ta
    JOIN teachers t ON t.id = ta.teacher_id
    WHERE t.auth_id = auth.uid() AND ta.class_id = students.class_id
  )
);
CREATE POLICY "students_self_read" ON students FOR SELECT USING (auth_id = auth.uid());
CREATE POLICY "students_parent_view" ON students FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM parents p WHERE p.auth_id = auth.uid() AND p.id = students.parent_id
  )
);

-- ===== PARENTS TABLE =====
CREATE POLICY "parents_admin_all" ON parents FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "parents_self_read" ON parents FOR SELECT USING (auth_id = auth.uid());

-- ===== CLASSES TABLE =====
CREATE POLICY "classes_admin_all" ON classes FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "classes_auth_read" ON classes FOR SELECT USING (auth.role() = 'authenticated');

-- ===== SUBJECTS TABLE =====
CREATE POLICY "subjects_admin_all" ON subjects FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "subjects_auth_read" ON subjects FOR SELECT USING (auth.role() = 'authenticated');

-- ===== TEACHER ASSIGNMENTS =====
CREATE POLICY "ta_admin_all" ON teacher_assignments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "ta_teacher_view" ON teacher_assignments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM teachers t WHERE t.auth_id = auth.uid() AND t.id = teacher_assignments.teacher_id
  )
);

-- ===== EXAM SCORES =====
CREATE POLICY "scores_admin_all" ON exam_scores FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "scores_teacher_manage" ON exam_scores FOR ALL USING (
  EXISTS (
    SELECT 1 FROM teacher_assignments ta
    JOIN teachers t ON t.id = ta.teacher_id
    WHERE t.auth_id = auth.uid() AND ta.class_id = exam_scores.class_id AND ta.subject_id = exam_scores.subject_id
  )
);
CREATE POLICY "scores_student_view" ON exam_scores FOR SELECT USING (
  EXISTS (SELECT 1 FROM students s WHERE s.auth_id = auth.uid() AND s.id = exam_scores.student_id)
);
CREATE POLICY "scores_parent_view" ON exam_scores FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM students s
    JOIN parents p ON p.id = s.parent_id
    WHERE p.auth_id = auth.uid() AND s.id = exam_scores.student_id
  )
);

-- ===== ATTENDANCE =====
CREATE POLICY "att_admin_all" ON attendance FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "att_teacher_manage" ON attendance FOR ALL USING (
  EXISTS (
    SELECT 1 FROM teacher_assignments ta
    JOIN teachers t ON t.id = ta.teacher_id
    JOIN students s ON s.class_id = ta.class_id
    WHERE t.auth_id = auth.uid() AND s.id = attendance.student_id
  )
);
CREATE POLICY "att_student_view" ON attendance FOR SELECT USING (
  EXISTS (SELECT 1 FROM students s WHERE s.auth_id = auth.uid() AND s.id = attendance.student_id)
);
CREATE POLICY "att_parent_view" ON attendance FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM students s
    JOIN parents p ON p.id = s.parent_id
    WHERE p.auth_id = auth.uid() AND s.id = attendance.student_id
  )
);

-- ===== PAYMENTS =====
CREATE POLICY "pay_admin_all" ON payments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "pay_student_view" ON payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM students s WHERE s.auth_id = auth.uid() AND s.id = payments.student_id)
);
CREATE POLICY "pay_parent_view" ON payments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM students s
    JOIN parents p ON p.id = s.parent_id
    WHERE p.auth_id = auth.uid() AND s.id = payments.student_id
  )
);

-- ===== ANNOUNCEMENTS =====
CREATE POLICY "ann_admin_all" ON announcements FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "ann_auth_read" ON announcements FOR SELECT USING (auth.role() = 'authenticated');

-- ===== HOMEWORKS =====
CREATE POLICY "hw_admin_all" ON homeworks FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "hw_teacher_view" ON homeworks FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM teacher_assignments ta
    JOIN teachers t ON t.id = ta.teacher_id
    WHERE t.auth_id = auth.uid() AND ta.class_id = homeworks.class_id
  )
);
CREATE POLICY "hw_student_view" ON homeworks FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM students s WHERE s.auth_id = auth.uid() AND s.class_id = homeworks.class_id
  )
);

-- ===== GRADE SCALE =====
CREATE POLICY "gs_admin_all" ON grade_scale FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "gs_auth_read" ON grade_scale FOR SELECT USING (auth.role() = 'authenticated');

-- ===== CONTACT MESSAGES =====
CREATE POLICY "cm_admin_all" ON contact_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'admin')
);

-- ===== APPLICATIONS =====
CREATE POLICY "app_admin_all" ON applications FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'admin')
);

-- ===== PUBLIC NEWS =====
CREATE POLICY "news_auth_read" ON public_news FOR SELECT USING (auth.role() = 'authenticated');
