export const TERM_NAMES = ["First Term", "Second Term", "Third Term"];

const SESSION_START_MONTH_INDEX = 8; // September, normal Nigerian first-term season.

export function formatAcademicYear(startYear) {
  const year = Number(startYear);
  return `${year}/${year + 1}`;
}

export function getAcademicYearForDate(date = new Date()) {
  const year = date.getFullYear();
  const startYear = date.getMonth() >= SESSION_START_MONTH_INDEX ? year : year - 1;
  return formatAcademicYear(startYear);
}

export function getUpcomingFirstTermAcademicYear(date = new Date()) {
  return formatAcademicYear(date.getFullYear());
}

export function getTermLabel(termRow) {
  return (
    termRow?.term_name ??
    termRow?.term_label ??
    termRow?.term ??
    termRow?.name ??
    termRow?.display_name ??
    termRow?.label ??
    termRow?.title ??
    ""
  );
}

export function getTermAcademicYear(termRow, fallbackYear = getUpcomingFirstTermAcademicYear()) {
  return termRow?.academic_year || fallbackYear;
}

export function getFallbackTerms(date = new Date()) {
  const academicYear = getUpcomingFirstTermAcademicYear(date);
  return TERM_NAMES.map((termName, index) => ({
    id: `fallback-${index + 1}`,
    term_name: termName,
    academic_year: academicYear,
    is_active: index === 0,
    __fallback: true,
  }));
}

export function normalizeTermRows(rows = [], date = new Date()) {
  const source = rows.length > 0 ? rows : getFallbackTerms(date);
  return source.map((term, index) => {
    const label = getTermLabel(term) || TERM_NAMES[index] || `Term ${index + 1}`;
    const academicYear = getTermAcademicYear(term);
    return {
      ...term,
      __label: label,
      __academicYear: academicYear,
      __key: String(term.id ?? `${label}-${academicYear}-${index}`),
    };
  });
}

export function getPreferredTerm(terms = []) {
  return terms.find((term) => term.is_active) || terms[0] || null;
}

export function getAcademicYearOptions(date = new Date()) {
  const currentStartYear = date.getFullYear();
  return [currentStartYear - 1, currentStartYear, currentStartYear + 1].map(
    formatAcademicYear
  );
}

export function formatTermSession(termLabel, academicYear) {
  return [termLabel, academicYear].filter(Boolean).join(" ");
}

export function getNextAcademicYear(academicYear) {
  const [startYear] = String(academicYear || "").split("/").map(Number);
  if (!Number.isFinite(startYear)) return getUpcomingFirstTermAcademicYear();
  return formatAcademicYear(startYear + 1);
}

export function getNextTermAfter(termRow) {
  const termLabel = getTermLabel(termRow);
  const academicYear = getTermAcademicYear(termRow);
  const normalizedLabel = termLabel.toLowerCase();
  const termIndex = TERM_NAMES.findIndex((name) =>
    normalizedLabel.startsWith(name.toLowerCase())
  );

  if (termIndex === -1) {
    return { term_name: "First Term", academic_year: getUpcomingFirstTermAcademicYear() };
  }

  const nextTermIndex = (termIndex + 1) % TERM_NAMES.length;
  return {
    term_name: TERM_NAMES[nextTermIndex],
    academic_year:
      termIndex === TERM_NAMES.length - 1
        ? getNextAcademicYear(academicYear)
        : academicYear,
  };
}
