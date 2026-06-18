CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_students INT;
  v_teachers INT;
  v_classes INT;
  v_assignments INT;
  v_fees_pending NUMERIC;
  v_attendance_today INT;
  result JSON;
BEGIN
  SELECT count(*) INTO v_students FROM students;
  SELECT count(*) INTO v_teachers FROM teachers;
  SELECT count(*) INTO v_classes FROM classes;
  SELECT count(*) INTO v_assignments FROM teacher_assignments;
  SELECT coalesce(sum(amount), 0) INTO v_fees_pending FROM payments WHERE status = 'pending';
  SELECT count(*) INTO v_attendance_today FROM attendance WHERE date = CURRENT_DATE AND status = 'present';

  result := json_build_object(
    'students', v_students,
    'teachers', v_teachers,
    'classes', v_classes,
    'assignments', v_assignments,
    'feesPending', v_fees_pending,
    'attendanceToday', v_attendance_today
  );
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_dashboard_stats TO anon;
GRANT EXECUTE ON FUNCTION get_dashboard_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_stats TO service_role;
