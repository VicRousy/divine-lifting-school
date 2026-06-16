-- ============================================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- https://supabase.com/dashboard/project/dxnsrxfpnbkwdrvkvfpo/sql/new
-- ============================================================

-- Bulk convert all plaintext passwords to bcrypt hashes via pgcrypto
-- This ensures verify_login_password RPC works for every user immediately.

-- Convert admin profiles
UPDATE profiles
SET password = crypt(password, gen_salt('bf'))
WHERE password IS NOT NULL AND password !~ '^\$2[abxy]\$\d{2}\$';

-- Convert teachers
UPDATE teachers
SET password = crypt(password, gen_salt('bf'))
WHERE password IS NOT NULL AND password !~ '^\$2[abxy]\$\d{2}\$';

-- Convert students
UPDATE students
SET password = crypt(password, gen_salt('bf'))
WHERE password IS NOT NULL AND password !~ '^\$2[abxy]\$\d{2}\$';

-- Convert parents
UPDATE parents
SET password = crypt(password, gen_salt('bf'))
WHERE password IS NOT NULL AND password !~ '^\$2[abxy]\$\d{2}\$';

-- Recreate lookup_user_by_login_id WITHOUT the password field
-- Password should never leave the database now that server-side verify is the only path.
DROP FUNCTION IF EXISTS lookup_user_by_login_id;

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
    SELECT id, login_id, email, first_name, last_name, role, is_first_login, 'admin'::text AS _role
    FROM profiles WHERE LOWER(login_id) = LOWER(p_login_id) LIMIT 1
  ) t;
  IF result IS NOT NULL THEN RETURN result; END IF;

  SELECT row_to_json(t) INTO result FROM (
    SELECT id, login_id, email, first_name, last_name, staff_id, is_first_login, 'teacher'::text AS _role
    FROM teachers WHERE LOWER(login_id) = LOWER(p_login_id) LIMIT 1
  ) t;
  IF result IS NOT NULL THEN RETURN result; END IF;

  SELECT row_to_json(t) INTO result FROM (
    SELECT id, login_id, email, first_name, last_name, student_id,
           class_id, parent_id, is_first_login, 'student'::text AS _role
    FROM students WHERE LOWER(login_id) = LOWER(p_login_id) LIMIT 1
  ) t;
  IF result IS NOT NULL THEN RETURN result; END IF;

  SELECT row_to_json(t) INTO result FROM (
    SELECT id, login_id, email, first_name, last_name, parent_id, 'parent'::text AS _role
    FROM parents WHERE LOWER(login_id) = LOWER(p_login_id) LIMIT 1
  ) t;

  RETURN result;
END;
$$;
