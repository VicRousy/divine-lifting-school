CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'students', (SELECT COUNT(*) FROM students),
    'teachers', (SELECT COUNT(*) FROM teachers),
    'classes', (SELECT COUNT(*) FROM classes),
    'assignments', (SELECT COUNT(*) FROM teacher_assignments),
    'feesPending', (SELECT COUNT(*) FROM fees WHERE status = 'pending'),
    'attendanceToday', (SELECT COUNT(*) FROM attendance WHERE date = CURRENT_DATE)
  ) INTO result;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_dashboard_stats TO anon;
GRANT EXECUTE ON FUNCTION get_dashboard_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_stats TO service_role;
