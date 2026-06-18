ALTER TABLE login_attempts ADD COLUMN IF NOT EXISTS ip_address TEXT;

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);

DROP FUNCTION IF EXISTS verify_login_password;

CREATE OR REPLACE FUNCTION verify_login_password(p_login_id TEXT, p_password TEXT, p_ip_address TEXT DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_pass TEXT;
  user_role TEXT;
  user_id_val UUID;
  user_is_first_login BOOLEAN := FALSE;
  login_attempt_count INT;
  ip_attempt_count INT;
  password_valid BOOLEAN := FALSE;
BEGIN
  -- Prune attempts older than 1 hour
  DELETE FROM login_attempts WHERE attempted_at < NOW() - INTERVAL '1 hour';

  -- Rate limit: 5 failed attempts per login_id in last 15 minutes
  SELECT COUNT(*) INTO login_attempt_count
  FROM login_attempts
  WHERE login_id = p_login_id AND success = FALSE AND attempted_at > NOW() - INTERVAL '15 minutes';

  IF login_attempt_count >= 5 THEN
    RETURN json_build_object('valid', false, 'rate_limited', true);
  END IF;

  -- Rate limit: 20 failed attempts per IP in last 15 minutes (if IP provided)
  IF p_ip_address IS NOT NULL THEN
    SELECT COUNT(*) INTO ip_attempt_count
    FROM login_attempts
    WHERE ip_address = p_ip_address AND success = FALSE AND attempted_at > NOW() - INTERVAL '15 minutes';

    IF ip_attempt_count >= 20 THEN
      RETURN json_build_object('valid', false, 'rate_limited', true);
    END IF;
  END IF;

  -- Check profiles (admin)
  SELECT id, password, 'admin'::text, COALESCE(is_first_login, FALSE) INTO user_id_val, user_pass, user_role, user_is_first_login
  FROM profiles WHERE LOWER(login_id) = LOWER(p_login_id) LIMIT 1;

  IF NOT FOUND THEN
    SELECT id, password, 'teacher'::text, COALESCE(is_first_login, FALSE) INTO user_id_val, user_pass, user_role, user_is_first_login
    FROM teachers WHERE LOWER(login_id) = LOWER(p_login_id) LIMIT 1;
  END IF;

  IF NOT FOUND THEN
    SELECT id, password, 'student'::text, COALESCE(is_first_login, FALSE) INTO user_id_val, user_pass, user_role, user_is_first_login
    FROM students WHERE LOWER(login_id) = LOWER(p_login_id) LIMIT 1;
  END IF;

  IF NOT FOUND THEN
    SELECT id, password, 'parent'::text, FALSE INTO user_id_val, user_pass, user_role, user_is_first_login
    FROM parents WHERE LOWER(login_id) = LOWER(p_login_id) LIMIT 1;
  END IF;

  -- If user found, verify password
  IF FOUND THEN
    IF crypt(p_password, user_pass) = user_pass THEN
      password_valid := TRUE;
    END IF;
  END IF;

  -- Record attempt with IP
  INSERT INTO login_attempts (login_id, success, ip_address) VALUES (p_login_id, password_valid, p_ip_address);

  -- Return result
  IF password_valid THEN
    RETURN json_build_object('valid', true, 'user_id', user_id_val, 'role', user_role, 'is_first_login', user_is_first_login);
  ELSE
    RETURN json_build_object('valid', false, 'rate_limited', false);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION verify_login_password TO anon;
GRANT EXECUTE ON FUNCTION verify_login_password TO authenticated;
GRANT EXECUTE ON FUNCTION verify_login_password TO service_role;
