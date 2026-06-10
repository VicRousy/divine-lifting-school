import { describe, it, expect } from 'vitest'
import { splitFullName, formatDisplayName } from './nameUtils'

describe('splitFullName', () => {
  it('splits first and last name', () => {
    expect(splitFullName('John Doe')).toEqual({ firstName: 'John', middleName: '', lastName: 'Doe' })
  })
  it('splits full name with middle', () => {
    expect(splitFullName('John Michael Doe')).toEqual({ firstName: 'John', middleName: 'Michael', lastName: 'Doe' })
  })
  it('handles single name', () => {
    expect(splitFullName('John')).toEqual({ firstName: 'John', middleName: '', lastName: '' })
  })
  it('handles null/undefined', () => {
    expect(splitFullName(null)).toEqual({ firstName: '', middleName: '', lastName: '' })
    expect(splitFullName(undefined)).toEqual({ firstName: '', middleName: '', lastName: '' })
  })
  it('handles non-string input', () => {
    expect(splitFullName(123)).toEqual({ firstName: '', middleName: '', lastName: '' })
  })
  it('trims whitespace', () => {
    expect(splitFullName('  John  Doe  ')).toEqual({ firstName: 'John', middleName: '', lastName: 'Doe' })
  })
})

describe('formatDisplayName', () => {
  it('formats first and last name', () => {
    expect(formatDisplayName({ first_name: 'John', last_name: 'Doe' })).toBe('John Doe')
  })
  it('includes middle name', () => {
    expect(formatDisplayName({ first_name: 'John', middle_name: 'Michael', last_name: 'Doe' })).toBe('John Michael Doe')
  })
  it('falls back to full_name', () => {
    expect(formatDisplayName({ full_name: 'Dr. John Doe' })).toBe('Dr. John Doe')
  })
  it('falls back to email', () => {
    expect(formatDisplayName({ email: 'john@school.com' })).toBe('john@school.com')
  })
  it('prefers structured names over full_name', () => {
    expect(formatDisplayName({ first_name: 'Jane', last_name: 'Smith', full_name: 'Old Name' })).toBe('Jane Smith')
  })
  it('returns User when nothing provided', () => {
    expect(formatDisplayName({})).toBe('User')
  })
})
