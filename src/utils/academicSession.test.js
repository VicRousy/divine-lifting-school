import { describe, it, expect } from 'vitest'
import {
  TERM_NAMES,
  formatAcademicYear,
  getAcademicYearForDate,
  getUpcomingFirstTermAcademicYear,
  getTermLabel,
  getTermAcademicYear,
  getFallbackTerms,
  normalizeTermRows,
  getPreferredTerm,
  getAcademicYearOptions,
  formatTermSession,
  getNextAcademicYear,
  getNextTermAfter,
} from './academicSession'

describe('formatAcademicYear', () => {
  it('formats a year number', () => {
    expect(formatAcademicYear(2024)).toBe('2024/2025')
  })
  it('formats a year string', () => {
    expect(formatAcademicYear('2024')).toBe('2024/2025')
  })
  it('handles invalid input', () => {
    expect(formatAcademicYear(NaN)).toBe('NaN/NaN')
  })
})

describe('getAcademicYearForDate', () => {
  it('returns correct year for dates before September', () => {
    const d = new Date(2025, 2, 15)
    expect(getAcademicYearForDate(d)).toBe('2024/2025')
  })
  it('returns correct year for dates in September or later', () => {
    const d = new Date(2025, 8, 15)
    expect(getAcademicYearForDate(d)).toBe('2025/2026')
  })
  it('handles December', () => {
    const d = new Date(2025, 11, 1)
    expect(getAcademicYearForDate(d)).toBe('2025/2026')
  })
  it('handles January', () => {
    const d = new Date(2025, 0, 15)
    expect(getAcademicYearForDate(d)).toBe('2024/2025')
  })
})

describe('getUpcomingFirstTermAcademicYear', () => {
  it('returns year starting from given date year', () => {
    const d = new Date(2025, 5, 1)
    expect(getUpcomingFirstTermAcademicYear(d)).toBe('2025/2026')
  })
})

describe('getTermLabel', () => {
  it('returns term_name by default', () => {
    expect(getTermLabel({ term_name: 'First Term' })).toBe('First Term')
  })
  it('falls back through keys', () => {
    expect(getTermLabel({ term_label: 'Second Term' })).toBe('Second Term')
    expect(getTermLabel({ term: 'Third' })).toBe('Third')
    expect(getTermLabel({ name: 'Name' })).toBe('Name')
  })
  it('returns empty string for null/undefined', () => {
    expect(getTermLabel({})).toBe('')
    expect(getTermLabel(null)).toBe('')
  })
})

describe('getTermAcademicYear', () => {
  it('returns term academic_year', () => {
    expect(getTermAcademicYear({ academic_year: '2024/2025' })).toBe('2024/2025')
  })
  it('falls back to given fallback', () => {
    expect(getTermAcademicYear({}, '2025/2026')).toBe('2025/2026')
  })
  it('uses default fallback when not provided', () => {
    const result = getTermAcademicYear({})
    expect(result).toMatch(/\d{4}\/\d{4}/)
  })
})

describe('getFallbackTerms', () => {
  it('returns 3 terms', () => {
    const terms = getFallbackTerms()
    expect(terms).toHaveLength(3)
  })
  it('marks first term as active', () => {
    const terms = getFallbackTerms()
    expect(terms[0].is_active).toBe(true)
    expect(terms[1].is_active).toBe(false)
  })
  it('has fallback ids', () => {
    const terms = getFallbackTerms()
    expect(terms[0].id).toBe('fallback-1')
    expect(terms[1].id).toBe('fallback-2')
  })
})

describe('normalizeTermRows', () => {
  it('normalizes provided rows', () => {
    const rows = [{ id: 1, term_name: 'First Term' }]
    const result = normalizeTermRows(rows)
    expect(result).toHaveLength(1)
    expect(result[0].__label).toBe('First Term')
    expect(result[0].__key).toBe('1')
  })
  it('falls back to getFallbackTerms when rows empty', () => {
    const result = normalizeTermRows([])
    expect(result).toHaveLength(3)
    expect(result[0].__fallback).toBe(true)
  })
  it('generates __key from label and year when no id', () => {
    const rows = [{ term_name: 'First Term', academic_year: '2024/2025' }]
    const result = normalizeTermRows(rows)
    expect(result[0].__key).toContain('First Term')
    expect(result[0].__key).toContain('2024/2025')
  })
})

describe('getPreferredTerm', () => {
  it('returns active term', () => {
    const terms = [{ id: 1, is_active: false }, { id: 2, is_active: true }]
    expect(getPreferredTerm(terms).id).toBe(2)
  })
  it('returns first term if none active', () => {
    const terms = [{ id: 1 }, { id: 2 }]
    expect(getPreferredTerm(terms).id).toBe(1)
  })
  it('returns null for empty array', () => {
    expect(getPreferredTerm([])).toBeNull()
  })
})

describe('getAcademicYearOptions', () => {
  it('returns 3 options', () => {
    const d = new Date(2025, 5, 1)
    expect(getAcademicYearOptions(d)).toEqual(['2024/2025', '2025/2026', '2026/2027'])
  })
})

describe('formatTermSession', () => {
  it('combines term and year', () => {
    expect(formatTermSession('First Term', '2024/2025')).toBe('First Term 2024/2025')
  })
  it('handles missing year', () => {
    expect(formatTermSession('First Term', '')).toBe('First Term')
  })
  it('handles missing term', () => {
    expect(formatTermSession('', '2024/2025')).toBe('2024/2025')
  })
})

describe('getNextAcademicYear', () => {
  it('increments by 1', () => {
    expect(getNextAcademicYear('2024/2025')).toBe('2025/2026')
  })
  it('handles invalid input with default', () => {
    const result = getNextAcademicYear('bad')
    expect(result).toMatch(/\d{4}\/\d{4}/)
  })
})

describe('getNextTermAfter', () => {
  it('returns second term after first', () => {
    const next = getNextTermAfter({ term_name: 'First Term', academic_year: '2024/2025' })
    expect(next.term_name).toBe('Second Term')
    expect(next.academic_year).toBe('2024/2025')
  })
  it('wraps third term to first with next year', () => {
    const next = getNextTermAfter({ term_name: 'Third Term', academic_year: '2024/2025' })
    expect(next.term_name).toBe('First Term')
    expect(next.academic_year).toBe('2025/2026')
  })
  it('handles unrecognized term', () => {
    const next = getNextTermAfter({ term_name: 'Unknown' })
    expect(next.term_name).toBe('First Term')
  })
})
