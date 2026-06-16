CREATE TABLE IF NOT EXISTS login_attempts (
  id BIGSERIAL PRIMARY KEY,
  login_id TEXT NOT NULL,
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  success BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_login_id ON login_attempts(login_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_attempted_at ON login_attempts(attempted_at);

DROP FUNCTION IF EXISTS verify_login_password;

CREATE OR REPLACE FUNCTION verify_login_password(p_login_id TEXT, p_password TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_pass TEXT;
  user_role TEXT;
  user_id_val UUID;
  attempt_count INT;
  password_valid BOOLEAN := FALSE;
BEGIN
  -- Prune attempts older than 1 hour
  DELETE FROM login_attempts WHERE attempted_at < NOW() - INTERVAL '1 hour';

  -- Rate limit: 5 failed attempts in last 15 minutes
  SELECT COUNT(*) INTO attempt_count
  FROM login_attempts
  WHERE login_id = p_login_id AND success = FALSE AND attempted_at > NOW() - INTERVAL '15 minutes';

  IF attempt_count >= 5 THEN
    RETURN json_build_object('valid', false, 'rate_limited', true);
  END IF;

  -- Check profiles (admin)
  SELECT id, password, 'admin'::text INTO user_id_val, user_pass, user_role
  FROM profiles WHERE LOWER(login_id) = LOWER(p_login_id) LIMIT 1;

  IF NOT FOUND THEN
    SELECT id, password, 'teacher'::text INTO user_id_val, user_pass, user_role
    FROM teachers WHERE LOWER(login_id) = LOWER(p_login_id) LIMIT 1;
  END IF;

  IF NOT FOUND THEN
    SELECT id, password, 'student'::text INTO user_id_val, user_pass, user_role
    FROM students WHERE LOWER(login_id) = LOWER(p_login_id) LIMIT 1;
  END IF;

  IF NOT FOUND THEN
    SELECT id, password, 'parent'::text INTO user_id_val, user_pass, user_role
    FROM parents WHERE LOWER(login_id) = LOWER(p_login_id) LIMIT 1;
  END IF;

  -- If user found, verify password
  IF FOUND THEN
    IF crypt(p_password, user_pass) = user_pass THEN
      password_valid := TRUE;
    END IF;
  END IF;

  -- Record attempt
  INSERT INTO login_attempts (login_id, success) VALUES (p_login_id, password_valid);

  -- Return result
  IF password_valid THEN
    RETURN json_build_object('valid', true, 'user_id', user_id_val, 'role', user_role);
  ELSE
    RETURN json_build_object('valid', false, 'rate_limited', false);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION verify_login_password TO anon;
GRANT EXECUTE ON FUNCTION verify_login_password TO authenticated;
GRANT EXECUTE ON FUNCTION verify_login_password TO service_role;
