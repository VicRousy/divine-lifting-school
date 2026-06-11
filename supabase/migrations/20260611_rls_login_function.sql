-- ==========================================
-- SECURITY DEFINER: RLS bypass for login lookup
-- Called via supabase.rpc() before user is authenticated
-- ==========================================

CREATE OR REPLACE FUNCTION lookup_user_by_login_id(p_login_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  result := row_to_json(p) FROM profiles p WHERE p.login_id = p_login_id LIMIT 1;
  IF result IS NOT NULL THEN RETURN result; END IF;

  result := row_to_json(t) FROM teachers t WHERE t.login_id = p_login_id LIMIT 1;
  IF result IS NOT NULL THEN RETURN result; END IF;

  result := row_to_json(s) FROM students s WHERE s.login_id = p_login_id LIMIT 1;
  IF result IS NOT NULL THEN RETURN result; END IF;

  result := row_to_json(pa) FROM parents pa WHERE pa.login_id = p_login_id LIMIT 1;

  RETURN result;
END;
$$;
