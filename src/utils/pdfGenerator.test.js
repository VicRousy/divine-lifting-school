import { describe, it, expect, vi } from 'vitest'

const mockDoc = vi.hoisted(() => ({
  setFontSize: vi.fn().mockReturnThis(),
  setTextColor: vi.fn().mockReturnThis(),
  text: vi.fn().mockReturnThis(),
  line: vi.fn().mockReturnThis(),
  setFont: vi.fn().mockReturnThis(),
  save: vi.fn().mockReturnThis(),
  autoTable: vi.fn(function () { this.lastAutoTable = { finalY: 200 } }),
  lastAutoTable: { finalY: 200 },
  internal: { pageSize: { getHeight: () => 297, getWidth: () => 210 } },
}))

vi.mock('jspdf', () => ({
  default: vi.fn(function () { return mockDoc }),
}))

describe('pdfGenerator', () => {
  it('exports generateReportCardPDF function', async () => {
    const mod = await import('./pdfGenerator')
    expect(mod.generateReportCardPDF).toBeDefined()
    expect(typeof mod.generateReportCardPDF).toBe('function')
  })

  it('generates a PDF without throwing', async () => {
    const { generateReportCardPDF } = await import('./pdfGenerator')

    const student = {
      first_name: 'John',
      middle_name: 'M',
      last_name: 'Doe',
      admission_number: 'STU-001',
      position: 1,
      subjects: [
        { name: 'Math', ca1: 18, ca2: 19, exam: 55, total: 92, grade: 'A+', remark: 'Excellent' },
        { name: 'English', ca1: 15, ca2: 16, exam: 48, total: 79, grade: 'A', remark: 'Very Good' },
      ],
      totalScore: 171,
      average: 85.5,
      overallGrade: 'A+',
      overallRemark: 'Excellent',
    }

    expect(() => {
      generateReportCardPDF(student, 'Grade 5A', 'First Term', '2025/2026', 30)
    }).not.toThrow()
  })

  it('handles student without middle name', async () => {
    const { generateReportCardPDF } = await import('./pdfGenerator')

    const student = {
      first_name: 'Jane',
      last_name: 'Smith',
      admission_number: 'STU-002',
      position: 3,
      subjects: [
        { name: 'Math', ca1: 12, ca2: 14, exam: 40, total: 66, grade: 'B', remark: 'Good' },
      ],
      totalScore: 66,
      average: 66,
      overallGrade: 'B',
      overallRemark: 'Good',
    }

    expect(() => {
      generateReportCardPDF(student, 'Grade 5B', 'First Term', '2025/2026', 25)
    }).not.toThrow()
  })
})
