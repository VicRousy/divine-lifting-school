-- Recreate lookup_user_by_login_id WITH password field
DROP FUNCTION IF EXISTS lookup_user_by_login_id;
DROP FUNCTION IF EXISTS verify_login_password;

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
    SELECT id, login_id, email, first_name, last_name, role, password,
           is_first_login, 'admin'::text AS _role
    FROM profiles WHERE LOWER(login_id) = LOWER(p_login_id) LIMIT 1
  ) t;
  IF result IS NOT NULL THEN RETURN result; END IF;

  SELECT row_to_json(t) INTO result FROM (
    SELECT id, login_id, email, first_name, last_name, staff_id, password,
           is_first_login, 'teacher'::text AS _role
    FROM teachers WHERE LOWER(login_id) = LOWER(p_login_id) LIMIT 1
  ) t;
  IF result IS NOT NULL THEN RETURN result; END IF;

  SELECT row_to_json(t) INTO result FROM (
    SELECT id, login_id, email, first_name, last_name, student_id,
           class_id, parent_id, password, is_first_login, 'student'::text AS _role
    FROM students WHERE LOWER(login_id) = LOWER(p_login_id) LIMIT 1
  ) t;
  IF result IS NOT NULL THEN RETURN result; END IF;

  SELECT row_to_json(t) INTO result FROM (
    SELECT id, login_id, email, first_name, last_name, parent_id, password,
           'parent'::text AS _role
    FROM parents WHERE LOWER(login_id) = LOWER(p_login_id) LIMIT 1
  ) t;

  RETURN result;
END;
$$;
