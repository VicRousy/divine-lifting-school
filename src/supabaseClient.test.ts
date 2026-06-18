import { describe, it, expect, beforeEach, vi } from 'vitest'
import { seed, clear, mockSupabase } from './utils/__mocks__/supabaseData'

vi.mock('@supabase/supabase-js', () => ({ createClient: () => mockSupabase }))

import { lookupUserByLoginId, lookupUserByAuthId, lookupUserByEmail, buildUserInfo, USER_TABLES } from './supabaseClient'

beforeEach(() => { clear() })

describe('lookupUserByLoginId', () => {
  it('finds admin by login ID', async () => {
    seed('profiles', [{ id: 1, first_name: 'Admin', last_name: 'User', email: 'admin@school.com', login_id: 'ADM-001', school_id: 'SCH-001', is_first_login: false }])
    expect(await lookupUserByLoginId('ADM-001')).not.toBeNull()
  })

  it('returns null for unknown login ID', async () => {
    expect(await lookupUserByLoginId('UNKNOWN')).toBeNull()
  })

  it('finds student by login ID', async () => {
    seed('students', [{ id: 10, first_name: 'Bob', last_name: 'Student', email: 'bob@school.com', login_id: 'STU-010', student_id: 'STU-010', class_id: 1, is_first_login: true }])
    const result = await lookupUserByLoginId('STU-010')
    expect(result).not.toBeNull()
    expect(result!.role).toBe('student')
  })
})

describe('lookupUserByAuthId', () => {
  it('finds user by auth_id', async () => {
    seed('teachers', [{ id: 5, first_name: 'Jane', last_name: 'Smith', email: 'jane@school.com', login_id: 'TCH-005', staff_id: 'STF-005', is_first_login: false, auth_id: 'auth-123' }])
    const result = await lookupUserByAuthId('auth-123')
    expect(result).not.toBeNull()
    expect(result!.role).toBe('teacher')
  })

  it('returns null when no match', async () => {
    expect(await lookupUserByAuthId('nonexistent')).toBeNull()
  })
})

describe('lookupUserByEmail', () => {
  it('finds user by email', async () => {
    seed('profiles', [{ id: 1, first_name: 'Admin', last_name: 'User', email: 'admin@school.com', login_id: 'ADM-001', school_id: 'SCH-001', is_first_login: false }])
    const result = await lookupUserByEmail('admin@school.com')
    expect(result).not.toBeNull()
    expect(result!.role).toBe('admin')
  })
})

describe('buildUserInfo', () => {
  it('builds admin info', () => {
    const info = buildUserInfo('admin', { id: 1, first_name: 'Admin', last_name: 'User', email: 'a@b.com', login_id: 'ADM-001', school_id: 'SCH-001' } as any)
    expect(info.name).toBe('Admin User')
    expect(info.schoolId).toBe('SCH-001')
  })

  it('builds teacher info', () => {
    const info = buildUserInfo('teacher', { id: 5, first_name: 'Jane', last_name: 'Smith', email: 'j@b.com', login_id: 'TCH-005', staff_id: 'STF-005' } as any)
    expect(info.name).toBe('Jane Smith')
    expect(info.staffId).toBe('STF-005')
  })
})

describe('USER_TABLES', () => {
  it('no password column in selects', () => {
    Object.values(USER_TABLES).forEach(c => expect(c.select).not.toContain('password'))
  })
  it('no star selects', () => {
    Object.values(USER_TABLES).forEach(c => expect(c.select).not.toBe('*'))
  })
})
