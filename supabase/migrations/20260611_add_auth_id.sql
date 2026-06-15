ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL UNIQUE;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL UNIQUE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL UNIQUE;
ALTER TABLE parents ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL UNIQUE;

-- Link existing users where email matches auth.users
UPDATE profiles SET auth_id = id WHERE auth_id IS NULL AND id IN (SELECT id FROM auth.users);
UPDATE teachers   SET auth_id = au.id FROM auth.users au WHERE teachers.email = au.email AND teachers.auth_id IS NULL;
UPDATE students   SET auth_id = au.id FROM auth.users au WHERE students.email = au.email AND students.auth_id IS NULL;
UPDATE parents    SET auth_id = au.id FROM auth.users au WHERE parents.email = au.email AND parents.auth_id IS NULL;
