import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type UserRole = 'admin' | 'teacher' | 'student' | 'parent'

interface UserTableConfig {
  table: string
  idField: string
  nameField: string[]
  extraField: string
  select: string
}

export interface UserRow {
  id: number
  first_name: string
  last_name: string
  email: string
  login_id: string
  school_id?: string
  staff_id?: string
  student_id?: string
  class_id?: number
  parent_id?: number
  is_first_login?: boolean
}

export interface UserLookupResult {
  user: UserRow
  role: UserRole
}

export const USER_TABLES: Record<UserRole, UserTableConfig> = {
  admin: { table: 'profiles', idField: 'id', nameField: ['first_name', 'last_name'], extraField: 'school_id', select: 'id,first_name,last_name,email,login_id,school_id,is_first_login' },
  teacher: { table: 'teachers', idField: 'id', nameField: ['first_name', 'last_name'], extraField: 'staff_id', select: 'id,first_name,last_name,email,login_id,staff_id,is_first_login' },
  student: { table: 'students', idField: 'id', nameField: ['first_name', 'last_name'], extraField: 'student_id', select: 'id,first_name,last_name,email,login_id,student_id,class_id,parent_id,is_first_login' },
  parent: { table: 'parents', idField: 'id', nameField: ['first_name', 'last_name'], extraField: 'parent_id', select: 'id,first_name,last_name,email,login_id,parent_id' },
}

async function lookupInAllTables(field: string, value: string): Promise<UserLookupResult | null> {
  const results = await Promise.all(
    Object.entries(USER_TABLES).map(async ([role, config]) => {
      try {
        const { data, error } = await supabase
          .from(config.table)
          .select(config.select)
          .eq(field, value)
          .maybeSingle()
        if (error || !data) return null
        return { user: data as unknown as UserRow, role: role as UserRole }
      } catch {
        return null
      }
    })
  )
  return results.find(r => r !== null) || null
}

export async function lookupUserByLoginId(loginId: string): Promise<UserLookupResult | null> {
  const input = loginId.trim().toUpperCase()

  try {
    const { data, error } = await supabase.rpc('lookup_user_by_login_id', { p_login_id: input })
    if (!error && data) {
      const role: UserRole = data._role
      delete data._role
      return { user: data as unknown as UserRow, role }
    }
  } catch (_) {
    // function doesn't exist yet — fall through
  }

  return lookupInAllTables('login_id', input)
}

export async function lookupUserByAuthId(authId: string): Promise<UserLookupResult | null> {
  return lookupInAllTables('auth_id', authId)
}

export async function lookupUserByEmail(email: string): Promise<UserLookupResult | null> {
  return lookupInAllTables('email', email.trim().toLowerCase())
}

export interface UserInfo {
  id: number
  name: string
  loginId: string
  email: string
  schoolId?: string
  staffId?: string
  studentId?: string
  parentId?: string
}

export function buildUserInfo(role: UserRole, user: UserRow): UserInfo {
  const base: UserInfo = { id: user.id, name: `${user.first_name} ${user.last_name}`, loginId: user.login_id, email: user.email }
  if (role === 'admin') base.schoolId = user.school_id
  if (role === 'teacher') base.staffId = user.staff_id
  if (role === 'student') base.studentId = user.student_id
  if (role === 'parent') base.parentId = String(user.parent_id ?? '')
  return base
}
