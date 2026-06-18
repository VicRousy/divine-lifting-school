export const TERM_NAMES = ["First Term", "Second Term", "Third Term"] as const

const SESSION_START_MONTH_INDEX = 8

export function formatAcademicYear(startYear: number): string {
  const year = Number(startYear)
  return `${year}/${year + 1}`
}

export function getAcademicYearForDate(date: Date = new Date()): string {
  const year = date.getFullYear()
  const startYear = date.getMonth() >= SESSION_START_MONTH_INDEX ? year : year - 1
  return formatAcademicYear(startYear)
}

export function getUpcomingFirstTermAcademicYear(date: Date = new Date()): string {
  return formatAcademicYear(date.getFullYear())
}

export function getTermLabel(termRow: Record<string, any>): string {
  return (
    termRow?.term_name ??
    termRow?.term_label ??
    termRow?.term ??
    termRow?.name ??
    termRow?.display_name ??
    termRow?.label ??
    termRow?.title ??
    ""
  )
}

export function getTermAcademicYear(termRow: Record<string, any>, fallbackYear: string = getUpcomingFirstTermAcademicYear()): string {
  return termRow?.academic_year || fallbackYear
}

export interface TermRow {
  id?: number | string
  term_name?: string
  academic_year?: string
  is_active?: boolean
  __fallback?: boolean
  [key: string]: any
}

export function getFallbackTerms(date: Date = new Date()): TermRow[] {
  const academicYear = getUpcomingFirstTermAcademicYear(date)
  return TERM_NAMES.map((termName, index) => ({
    id: `fallback-${index + 1}`,
    term_name: termName,
    academic_year: academicYear,
    is_active: index === 0,
    __fallback: true,
  }))
}

export interface NormalizedTerm extends TermRow {
  __label: string
  __academicYear: string
  __key: string
}

export function normalizeTermRows(rows: TermRow[] = [], date: Date = new Date()): NormalizedTerm[] {
  const source = rows.length > 0 ? rows : getFallbackTerms(date)
  return source.map((term, index) => {
    const label = getTermLabel(term) || TERM_NAMES[index] || `Term ${index + 1}`
    const academicYear = getTermAcademicYear(term)
    return {
      ...term,
      __label: label,
      __academicYear: academicYear,
      __key: String(term.id ?? `${label}-${academicYear}-${index}`),
    }
  })
}

export function getPreferredTerm(terms: TermRow[] = []): TermRow | null {
  return terms.find((term) => term.is_active) || terms[0] || null
}

export function getAcademicYearOptions(date: Date = new Date()): string[] {
  const currentStartYear = date.getFullYear()
  return [currentStartYear - 1, currentStartYear, currentStartYear + 1].map(
    formatAcademicYear
  )
}

export function formatTermSession(termLabel: string, academicYear: string): string {
  return [termLabel, academicYear].filter(Boolean).join(" ")
}

export function getNextAcademicYear(academicYear: string): string {
  const [startYear] = String(academicYear || "").split("/").map(Number)
  if (!Number.isFinite(startYear)) return getUpcomingFirstTermAcademicYear()
  return formatAcademicYear(startYear + 1)
}

export function getNextTermAfter(termRow: Record<string, any>): { term_name: string; academic_year: string } {
  const termLabel = getTermLabel(termRow)
  const academicYear = getTermAcademicYear(termRow)
  const normalizedLabel = termLabel.toLowerCase()
  const termIndex = TERM_NAMES.findIndex((name) =>
    normalizedLabel.startsWith(name.toLowerCase())
  )

  if (termIndex === -1) {
    return { term_name: "First Term", academic_year: getUpcomingFirstTermAcademicYear() }
  }

  const nextTermIndex = (termIndex + 1) % TERM_NAMES.length
  return {
    term_name: TERM_NAMES[nextTermIndex],
    academic_year:
      termIndex === TERM_NAMES.length - 1
        ? getNextAcademicYear(academicYear)
        : academicYear,
  }
}
