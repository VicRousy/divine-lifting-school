-- Revert: disable RLS on login-facing user tables only
-- Data tables remain RLS-protected

DROP FUNCTION IF EXISTS lookup_user_by_login_id;

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE parents DISABLE ROW LEVEL SECURITY;
