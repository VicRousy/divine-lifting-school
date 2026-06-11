-- ==========================================
-- DIVINE LIFTING SCHOOL - RLS SECURITY POLICIES
-- ==========================================

-- 1. ENABLE RLS ON ALL TABLES
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

-- 2. ADMIN POLICIES (Full Access)
-- Note: Assumes 'profiles' table exists with 'role' column. 
-- If using auth.users metadata, adjust accordingly.
-- For now, we assume a 'profiles' table links to auth.users.

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

-- 3. TEACHER POLICIES
-- Teachers can view students in their assigned classes
CREATE POLICY "Teachers can view students in their classes" ON students FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM teacher_assignments ta 
    WHERE ta.teacher_id = auth.uid() AND ta.class_id = students.class_id
  )
);

-- Teachers can view their own profile
CREATE POLICY "Teachers can view own profile" ON teachers FOR SELECT USING (id = auth.uid());

-- Teachers can update attendance for their classes
CREATE POLICY "Teachers can manage attendance for their classes" ON attendance FOR ALL USING (
  EXISTS (
    SELECT 1 FROM teacher_assignments ta 
    WHERE ta.teacher_id = auth.uid() AND ta.class_id = attendance.class_id
  )
);

-- Teachers can manage grades for their subjects/classes
CREATE POLICY "Teachers can manage grades for their assignments" ON exam_scores FOR ALL USING (
  EXISTS (
    SELECT 1 FROM teacher_assignments ta 
    WHERE ta.teacher_id = auth.uid() 
    AND ta.class_id = exam_scores.class_id 
    AND ta.subject_id = exam_scores.subject_id
  )
);

-- Teachers can view homeworks for their classes
CREATE POLICY "Teachers can view homeworks for their classes" ON homeworks FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM teacher_assignments ta 
    WHERE ta.teacher_id = auth.uid() AND ta.class_id = homeworks.class_id
  )
);

-- 4. STUDENT POLICIES
-- Students can view their own data
CREATE POLICY "Students can view own profile" ON students FOR SELECT USING (id = auth.uid());

-- Students can view their own grades
CREATE POLICY "Students can view own grades" ON exam_scores FOR SELECT USING (student_id = auth.uid());

-- Students can view their own attendance
CREATE POLICY "Students can view own attendance" ON attendance FOR SELECT USING (student_id = auth.uid());

-- Students can view homeworks for their class
CREATE POLICY "Students can view homeworks for their class" ON homeworks FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM students s 
    WHERE s.id = auth.uid() AND s.class_id = homeworks.class_id
  )
);

-- 5. PARENT POLICIES
-- Parents can view their children's data
CREATE POLICY "Parents can view their children" ON students FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM parents p 
    WHERE p.id = auth.uid() AND (p.child1_id = students.id OR p.child2_id = students.id OR p.child3_id = students.id)
  )
);

-- Parents can view their children's grades
CREATE POLICY "Parents can view children grades" ON exam_scores FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM students s 
    JOIN parents p ON (p.child1_id = s.id OR p.child2_id = s.id OR p.child3_id = s.id)
    WHERE p.id = auth.uid() AND s.id = exam_scores.student_id
  )
);

-- Parents can view their children's attendance
CREATE POLICY "Parents can view children attendance" ON attendance FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM students s 
    JOIN parents p ON (p.child1_id = s.id OR p.child2_id = s.id OR p.child3_id = s.id)
    WHERE p.id = auth.uid() AND s.id = attendance.student_id
  )
);

-- Parents can view announcements
CREATE POLICY "Parents can view announcements" ON announcements FOR SELECT USING (true);

-- 6. PUBLIC/READ POLICIES
-- Everyone can view classes and subjects (needed for dropdowns)
CREATE POLICY "Everyone can view classes" ON classes FOR SELECT USING (true);
CREATE POLICY "Everyone can view subjects" ON subjects FOR SELECT USING (true);

-- Everyone can view announcements
CREATE POLICY "Everyone can view announcements" ON announcements FOR SELECT USING (true);
