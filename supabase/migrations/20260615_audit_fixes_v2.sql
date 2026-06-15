-- ==========================================
-- AUDIT FIXES v2: corrected function queries
-- ==========================================

-- 1. Enable pgcrypto for bcrypt on server
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Fix lookup_user_by_login_id: only select existing columns
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
    SELECT id, login_id, email, first_name, last_name, role,
           is_first_login,
           'admin'::text AS _role
    FROM profiles WHERE LOWER(login_id) = LOWER(p_login_id) LIMIT 1
  ) t;
  IF result IS NOT NULL THEN RETURN result; END IF;

  SELECT row_to_json(t) INTO result FROM (
    SELECT id, login_id, email, first_name, last_name, staff_id,
           is_first_login,
           'teacher'::text AS _role
    FROM teachers WHERE LOWER(login_id) = LOWER(p_login_id) LIMIT 1
  ) t;
  IF result IS NOT NULL THEN RETURN result; END IF;

  SELECT row_to_json(t) INTO result FROM (
    SELECT id, login_id, email, first_name, last_name, student_id,
           class_id, parent_id, is_first_login,
           'student'::text AS _role
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

-- 3. Server-side password verification using pgcrypto
CREATE OR REPLACE FUNCTION verify_login_password(p_login_id TEXT, p_password TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
BEGIN
  SELECT * INTO r FROM profiles WHERE LOWER(login_id) = LOWER(p_login_id) LIMIT 1;
  IF r.id IS NOT NULL THEN
    IF r.password IS NOT NULL AND (r.password = p_password OR crypt(p_password, r.password) = r.password) THEN
      RETURN json_build_object('valid', true, 'id', r.id, 'email', r.email, 'role', 'admin', 'table', 'profiles');
    ELSE
      RETURN json_build_object('valid', false);
    END IF;
  END IF;

  SELECT * INTO r FROM teachers WHERE LOWER(login_id) = LOWER(p_login_id) LIMIT 1;
  IF r.id IS NOT NULL THEN
    IF r.password IS NOT NULL AND (r.password = p_password OR crypt(p_password, r.password) = r.password) THEN
      RETURN json_build_object('valid', true, 'id', r.id, 'email', r.email, 'role', 'teacher', 'table', 'teachers');
    ELSE
      RETURN json_build_object('valid', false);
    END IF;
  END IF;

  SELECT * INTO r FROM students WHERE LOWER(login_id) = LOWER(p_login_id) LIMIT 1;
  IF r.id IS NOT NULL THEN
    IF r.password IS NOT NULL AND (r.password = p_password OR crypt(p_password, r.password) = r.password) THEN
      RETURN json_build_object('valid', true, 'id', r.id, 'email', r.email, 'role', 'student', 'table', 'students');
    ELSE
      RETURN json_build_object('valid', false);
    END IF;
  END IF;

  SELECT * INTO r FROM parents WHERE LOWER(login_id) = LOWER(p_login_id) LIMIT 1;
  IF r.id IS NOT NULL THEN
    IF r.password IS NOT NULL AND (r.password = p_password OR crypt(p_password, r.password) = r.password) THEN
      RETURN json_build_object('valid', true, 'id', r.id, 'email', r.email, 'role', 'parent', 'table', 'parents');
    ELSE
      RETURN json_build_object('valid', false);
    END IF;
  END IF;

  RETURN json_build_object('valid', false);
END;
$$;
