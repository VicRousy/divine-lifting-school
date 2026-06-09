/**
 * Nigerian grading scale used across all grade-displaying components.
 * Each entry defines a score range with its letter grade, remark, and display color.
 * @type {{ min: number, max: number, grade: string, remark: string, color: string }[]}
 */
const DEFAULT_SCALE = [
  { min: 80, max: 100, grade: 'A+', remark: 'Excellent', color: '#10b981' },
  { min: 70, max: 79, grade: 'A', remark: 'Very Good', color: '#34d399' },
  { min: 60, max: 69, grade: 'B', remark: 'Good', color: '#38bdf8' },
  { min: 50, max: 59, grade: 'C', remark: 'Satisfactory', color: '#f59e0b' },
  { min: 40, max: 49, grade: 'D', remark: 'Pass', color: '#fbbf24' },
  { min: 0, max: 39, grade: 'F', remark: 'Fail', color: '#ef4444' },
]

/**
 * Converts a numeric score to its grade/remark/color based on the grading scale.
 * Falls back to 'F' / 'Fail' if no scale entry matches.
 *
 * @param {number|string} total - The numeric score (0-100)
 * @param {{ min: number, max: number, grade: string, remark: string, color: string }[]} [scale=DEFAULT_SCALE] - Custom grade scale (optional)
 * @returns {{ grade: string, remark: string, color: string }} Grade info object
 *
 * @example
 * getGradeInfo(85) // { grade: 'A+', remark: 'Excellent', color: '#10b981' }
 * getGradeInfo(42) // { grade: 'D', remark: 'Pass', color: '#fbbf24' }
 */
export function getGradeInfo(total, scale = DEFAULT_SCALE) {
  const score = Number(total)
  for (const s of scale) {
    if (score >= s.min && score <= s.max) return { grade: s.grade, remark: s.remark, color: s.color }
  }
  return { grade: 'F', remark: 'Fail', color: '#ef4444' }
}
