-- ==========================================
-- DIVINE LIFTING SCHOOL - RLS SECURITY POLICIES
-- CORRECTED: uses auth_id for integer-ID tables
-- ==========================================

-- 0. DROP EXISTING POLICIES (clean slate)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
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

-- 1. ENABLE RLS ON ALL TABLES
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

-- 2. PROFILES TABLE
-- Admins can manage all profiles
CREATE POLICY "Admins can manage profiles" ON profiles FOR ALL USING (
  auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);
-- Each user can view and update their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (id = auth.uid());

-- 3. ADMIN POLICIES (Full Access on all data tables)
CREATE POLICY "Admins have full access to students" ON students FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins have full access to teachers" ON teachers FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins have full access to parents" ON parents FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins have full access to classes" ON classes FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins have full access to subjects" ON subjects FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins have full access to teacher_assignments" ON teacher_assignments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins have full access to exam_scores" ON exam_scores FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins have full access to attendance" ON attendance FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins have full access to payments" ON payments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins have full access to announcements" ON announcements FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins have full access to homeworks" ON homeworks FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins have full access to grade_scale" ON grade_scale FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins can manage contact_messages" ON contact_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins can manage applications" ON applications FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 4. TEACHER POLICIES
-- Teachers can view their own profile (using auth_id since teachers.id is integer)
CREATE POLICY "Teachers can view own profile" ON teachers FOR SELECT USING (auth_id = auth.uid());
-- Teachers can view students in their assigned classes
CREATE POLICY "Teachers can view students in their classes" ON students FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM teacher_assignments ta
    JOIN teachers t ON t.id = ta.teacher_id
    WHERE t.auth_id = auth.uid() AND ta.class_id = students.class_id
  )
);
-- Teachers can manage attendance for their classes
CREATE POLICY "Teachers can manage attendance for their classes" ON attendance FOR ALL USING (
  EXISTS (
    SELECT 1 FROM teacher_assignments ta
    JOIN teachers t ON t.id = ta.teacher_id
    WHERE t.auth_id = auth.uid() AND ta.class_id = attendance.class_id
  )
);
-- Teachers can manage grades for their subjects/classes
CREATE POLICY "Teachers can manage grades for their assignments" ON exam_scores FOR ALL USING (
  EXISTS (
    SELECT 1 FROM teacher_assignments ta
    JOIN teachers t ON t.id = ta.teacher_id
    WHERE t.auth_id = auth.uid()
    AND ta.class_id = exam_scores.class_id
    AND ta.subject_id = exam_scores.subject_id
  )
);
-- Teachers can view homeworks for their classes
CREATE POLICY "Teachers can view homeworks for their classes" ON homeworks FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM teacher_assignments ta
    JOIN teachers t ON t.id = ta.teacher_id
    WHERE t.auth_id = auth.uid() AND ta.class_id = homeworks.class_id
  )
);

-- 5. STUDENT POLICIES
-- Students can view their own profile (using auth_id)
CREATE POLICY "Students can view own profile" ON students FOR SELECT USING (auth_id = auth.uid());
-- Students can view their own grades
CREATE POLICY "Students can view own grades" ON exam_scores FOR SELECT USING (
  EXISTS (SELECT 1 FROM students s WHERE s.auth_id = auth.uid() AND s.id = exam_scores.student_id)
);
-- Students can view their own attendance
CREATE POLICY "Students can view own attendance" ON attendance FOR SELECT USING (
  EXISTS (SELECT 1 FROM students s WHERE s.auth_id = auth.uid() AND s.id = attendance.student_id)
);
-- Students can view homeworks for their class
CREATE POLICY "Students can view homeworks for their class" ON homeworks FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM students s
    WHERE s.auth_id = auth.uid() AND s.class_id = homeworks.class_id
  )
);

-- 6. PARENT POLICIES
-- Parents can view their own profile (using auth_id)
CREATE POLICY "Parents can view own profile" ON parents FOR SELECT USING (auth_id = auth.uid());
-- Parents can view their children's data
CREATE POLICY "Parents can view their children" ON students FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM parents p
    WHERE p.auth_id = auth.uid()
    AND (p.child1_id = students.id OR p.child2_id = students.id OR p.child3_id = students.id)
  )
);
-- Parents can view their children's grades
CREATE POLICY "Parents can view children grades" ON exam_scores FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM students s
    JOIN parents p ON (p.child1_id = s.id OR p.child2_id = s.id OR p.child3_id = s.id)
    WHERE p.auth_id = auth.uid() AND s.id = exam_scores.student_id
  )
);
-- Parents can view their children's attendance
CREATE POLICY "Parents can view children attendance" ON attendance FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM students s
    JOIN parents p ON (p.child1_id = s.id OR p.child2_id = s.id OR p.child3_id = s.id)
    WHERE p.auth_id = auth.uid() AND s.id = attendance.student_id
  )
);

-- 7. PUBLIC/READ POLICIES
-- Everyone (authenticated) can view classes, subjects, grade_scale (needed for dropdowns)
CREATE POLICY "Everyone can view classes" ON classes FOR SELECT USING (true);
CREATE POLICY "Everyone can view subjects" ON subjects FOR SELECT USING (true);
CREATE POLICY "Everyone can view grade_scale" ON grade_scale FOR SELECT USING (true);
-- Everyone can view announcements
CREATE POLICY "Everyone can view announcements" ON announcements FOR SELECT USING (true);
-- Everyone can view public_news
CREATE POLICY "Everyone can view public_news" ON public_news FOR SELECT USING (true);
