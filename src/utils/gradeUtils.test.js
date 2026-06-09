import { describe, it, expect } from 'vitest'
import { getGradeInfo } from './gradeUtils'

describe('getGradeInfo', () => {
  it('returns A+ for scores 80-100', () => {
    expect(getGradeInfo(100).grade).toBe('A+')
    expect(getGradeInfo(80).grade).toBe('A+')
    expect(getGradeInfo(92).grade).toBe('A+')
    expect(getGradeInfo(80).remark).toBe('Excellent')
  })

  it('returns A for scores 70-79', () => {
    expect(getGradeInfo(70).grade).toBe('A')
    expect(getGradeInfo(75).grade).toBe('A')
    expect(getGradeInfo(79).grade).toBe('A')
    expect(getGradeInfo(75).remark).toBe('Very Good')
  })

  it('returns B for scores 60-69', () => {
    expect(getGradeInfo(60).grade).toBe('B')
    expect(getGradeInfo(65).grade).toBe('B')
  })

  it('returns C for scores 50-59', () => {
    expect(getGradeInfo(50).grade).toBe('C')
    expect(getGradeInfo(55).grade).toBe('C')
  })

  it('returns D for scores 40-49', () => {
    expect(getGradeInfo(40).grade).toBe('D')
    expect(getGradeInfo(45).grade).toBe('D')
  })

  it('returns F for scores 0-39', () => {
    expect(getGradeInfo(0).grade).toBe('F')
    expect(getGradeInfo(20).grade).toBe('F')
    expect(getGradeInfo(39).grade).toBe('F')
  })

  it('handles string input', () => {
    expect(getGradeInfo('85').grade).toBe('A+')
    expect(getGradeInfo('45').grade).toBe('D')
  })

  it('falls back to F for out-of-range scores', () => {
    expect(getGradeInfo(-1).grade).toBe('F')
    expect(getGradeInfo(101).grade).toBe('F')
  })

  it('accepts custom scale', () => {
    const custom = [
      { min: 90, max: 100, grade: 'A', remark: 'Top', color: 'green' },
      { min: 0, max: 89, grade: 'B', remark: 'Okay', color: 'blue' },
    ]
    expect(getGradeInfo(95, custom).grade).toBe('A')
    expect(getGradeInfo(80, custom).grade).toBe('B')
  })

  it('returns color for each grade', () => {
    expect(getGradeInfo(85).color).toBe('#10b981')
    expect(getGradeInfo(35).color).toBe('#ef4444')
  })
})
