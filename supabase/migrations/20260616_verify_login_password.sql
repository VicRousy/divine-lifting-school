-- Enable pgcrypto for server-side bcrypt
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Server-side password verification using pgcrypto's crypt()
DROP FUNCTION IF EXISTS verify_login_password;

CREATE OR REPLACE FUNCTION verify_login_password(p_login_id TEXT, p_password TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  user_pass TEXT;
  user_role TEXT;
  user_id_val UUID;
BEGIN
  -- Check profiles (admin)
  SELECT id, password, 'admin'::text INTO user_id_val, user_pass, user_role
  FROM profiles WHERE LOWER(login_id) = LOWER(p_login_id) LIMIT 1;

  IF FOUND THEN
    IF crypt(p_password, user_pass) = user_pass THEN
      RETURN json_build_object('valid', true, 'user_id', user_id_val, 'role', user_role);
    END IF;
  END IF;

  -- Check teachers
  SELECT id, password, 'teacher'::text INTO user_id_val, user_pass, user_role
  FROM teachers WHERE LOWER(login_id) = LOWER(p_login_id) LIMIT 1;

  IF FOUND THEN
    IF crypt(p_password, user_pass) = user_pass THEN
      RETURN json_build_object('valid', true, 'user_id', user_id_val, 'role', user_role);
    END IF;
  END IF;

  -- Check students
  SELECT id, password, 'student'::text INTO user_id_val, user_pass, user_role
  FROM students WHERE LOWER(login_id) = LOWER(p_login_id) LIMIT 1;

  IF FOUND THEN
    IF crypt(p_password, user_pass) = user_pass THEN
      RETURN json_build_object('valid', true, 'user_id', user_id_val, 'role', user_role);
    END IF;
  END IF;

  -- Check parents
  SELECT id, password, 'parent'::text INTO user_id_val, user_pass, user_role
  FROM parents WHERE LOWER(login_id) = LOWER(p_login_id) LIMIT 1;

  IF FOUND THEN
    IF crypt(p_password, user_pass) = user_pass THEN
      RETURN json_build_object('valid', true, 'user_id', user_id_val, 'role', user_role);
    END IF;
  END IF;

  RETURN json_build_object('valid', false);
END;
$$;

-- Grant execute to anon role (needed for login flow before auth)
GRANT EXECUTE ON FUNCTION verify_login_password TO anon;
GRANT EXECUTE ON FUNCTION verify_login_password TO authenticated;
GRANT EXECUTE ON FUNCTION verify_login_password TO service_role;
