import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const USER_TABLES = {
  admin: { table: 'profiles', idField: 'id', nameField: ['first_name', 'last_name'], extraField: 'school_id' },
  teacher: { table: 'teachers', idField: 'id', nameField: ['first_name', 'last_name'], extraField: 'staff_id' },
  student: { table: 'students', idField: 'id', nameField: ['first_name', 'last_name'], extraField: 'student_id' },
  parent: { table: 'parents', idField: 'id', nameField: ['first_name', 'last_name'], extraField: 'parent_id' },
}

export async function lookupUserByLoginId(loginId) {
  const input = loginId.trim().toUpperCase()

  // Try RPC bypass first (needed when RLS blocks unauthenticated reads)
  try {
    const { data, error } = await supabase.rpc('lookup_user_by_login_id', { p_login_id: input })
    if (!error && data) {
      // Determine role by checking role-specific fields
      if (data.staff_id) return { user: data, role: 'teacher' }
      if (data.student_id) return { user: data, role: 'student' }
      if (data.parent_id) return { user: data, role: 'parent' }
      if (data.role === 'admin' || data.school_id) return { user: data, role: 'admin' }
    }
  } catch (_) {
    // RPC not available, fall through to direct queries
  }

  // Fallback: direct table queries
  for (const [role, config] of Object.entries(USER_TABLES)) {
    const { data, error } = await supabase
      .from(config.table)
      .select('*')
      .eq('login_id', input)
      .maybeSingle()
    if (error) throw error
    if (data) return { user: data, role }
  }
  return null
}

export async function lookupUserByAuthId(authId) {
  for (const [role, config] of Object.entries(USER_TABLES)) {
    const { data, error } = await supabase
      .from(config.table)
      .select('*')
      .eq('auth_id', authId)
      .maybeSingle()
    if (error) throw error
    if (data) return { user: data, role }
  }
  return null
}

export async function lookupUserByEmail(email) {
  const input = email.trim().toLowerCase()

  for (const [role, config] of Object.entries(USER_TABLES)) {
    const { data, error } = await supabase
      .from(config.table)
      .select('*')
      .eq('email', input)
      .maybeSingle()
    if (error) throw error
    if (data) return { user: data, role }
  }
  return null
}

export function buildUserInfo(role, user) {
  const base = { id: user.id, name: `${user.first_name} ${user.last_name}`, loginId: user.login_id }
  if (role === 'admin') base.schoolId = user.school_id
  if (role === 'teacher') base.staffId = user.staff_id
  if (role === 'student') base.studentId = user.student_id
  if (role === 'parent') base.parentId = user.parent_id
  return base
}
