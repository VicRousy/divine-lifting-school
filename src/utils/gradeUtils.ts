export interface GradeScaleEntry {
  min: number
  max: number
  grade: string
  remark: string
  color: string
}

export interface GradeInfo {
  grade: string
  remark: string
  color: string
}

const DEFAULT_SCALE: GradeScaleEntry[] = [
  { min: 80, max: 100, grade: 'A+', remark: 'Excellent', color: '#10b981' },
  { min: 70, max: 79, grade: 'A', remark: 'Very Good', color: '#34d399' },
  { min: 60, max: 69, grade: 'B', remark: 'Good', color: '#38bdf8' },
  { min: 50, max: 59, grade: 'C', remark: 'Satisfactory', color: '#f59e0b' },
  { min: 40, max: 49, grade: 'D', remark: 'Pass', color: '#fbbf24' },
  { min: 0, max: 39, grade: 'F', remark: 'Fail', color: '#ef4444' },
]

export function getGradeInfo(total: number | string, scale: GradeScaleEntry[] = DEFAULT_SCALE): GradeInfo {
  const score = Number(total)
  for (const s of scale) {
    if (score >= s.min && score <= s.max) return { grade: s.grade, remark: s.remark, color: s.color }
  }
  return { grade: 'F', remark: 'Fail', color: '#ef4444' }
}
