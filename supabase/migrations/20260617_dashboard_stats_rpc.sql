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
  v_avg_total NUMERIC;
  v_active_count INT;
  v_total_count INT;
  v_class_distribution JSON;
  v_teacher_distribution JSON;
  v_performance_trend JSON;
  result JSON;
BEGIN
  -- Basic counts
  SELECT count(*) INTO v_students FROM students;
  SELECT count(*) INTO v_teachers FROM teachers;
  SELECT count(*) INTO v_classes FROM classes;
  SELECT count(*) INTO v_assignments FROM teacher_assignments;

  -- Fees pending
  SELECT coalesce(sum(amount), 0) INTO v_fees_pending FROM payments WHERE status = 'pending';

  -- Attendance today
  SELECT count(*) INTO v_attendance_today FROM attendance WHERE date = CURRENT_DATE AND status = 'present';

  -- Academic average (approved scores only)
  SELECT coalesce(avg(ca1_score + ca2_score + exam_score), 0) INTO v_avg_total
  FROM exam_scores WHERE approval_status = 'approved';

  -- Retention counts
  SELECT count(*) INTO v_active_count FROM students WHERE is_active = true;
  SELECT count(*) INTO v_total_count FROM students;

  -- Class distribution
  SELECT json_agg(json_build_object('name', COALESCE(c.class_name, 'Unknown'), 'count', sc.cnt) ORDER BY sc.cnt DESC)
  INTO v_class_distribution
  FROM (
    SELECT s.class_id, count(*) AS cnt
    FROM students s
    WHERE s.is_active = true
    GROUP BY s.class_id
  ) sc
  LEFT JOIN classes c ON c.id = sc.class_id;

  IF v_class_distribution IS NULL THEN
    v_class_distribution := '[]'::json;
  END IF;

  -- Teacher distribution by subject
  SELECT json_agg(json_build_object('name', COALESCE(s.subject_name, 'Unknown'), 'count', ts.cnt) ORDER BY ts.cnt DESC)
  INTO v_teacher_distribution
  FROM (
    SELECT ta.subject_id, count(*) AS cnt
    FROM teacher_assignments ta
    GROUP BY ta.subject_id
  ) ts
  LEFT JOIN subjects s ON s.id = ts.subject_id;

  IF v_teacher_distribution IS NULL THEN
    v_teacher_distribution := '[]'::json;
  END IF;

  -- Performance trend (last 6 terms)
  SELECT json_agg(json_build_object('term', t.term, 'avg', t.avg_score) ORDER BY t.term)
  INTO v_performance_trend
  FROM (
    SELECT
      concat(academic_year, ' - ', term) AS term,
      round(avg(ca1_score + ca2_score + exam_score), 2) AS avg_score
    FROM exam_scores
    WHERE approval_status = 'approved'
    GROUP BY academic_year, term
    ORDER BY academic_year, term
    LIMIT 6
  ) t;

  IF v_performance_trend IS NULL THEN
    v_performance_trend := '[]'::json;
  END IF;

  -- Build result JSON
  result := json_build_object(
    'students', v_students,
    'teachers', v_teachers,
    'classes', v_classes,
    'assignments', v_assignments,
    'feesPending', v_fees_pending,
    'attendanceToday', v_attendance_today,
    'averageGrade', CASE WHEN v_avg_total > 0 THEN round((v_avg_total / 100) * 4, 2)::text ELSE '0' END,
    'activityIndex', CASE WHEN v_students > 0 THEN round(v_attendance_today::numeric / (v_students::numeric * 30) * 100) ELSE 0 END,
    'retentionRate', CASE WHEN v_total_count > 0 THEN round(v_active_count::numeric / v_total_count::numeric * 100) ELSE 100 END,
    'classDistribution', v_class_distribution,
    'teacherDistribution', v_teacher_distribution,
    'performanceTrend', v_performance_trend
  );

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_dashboard_stats TO anon;
GRANT EXECUTE ON FUNCTION get_dashboard_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_stats TO service_role;
