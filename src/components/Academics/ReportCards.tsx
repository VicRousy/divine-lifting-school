import { useState, useEffect, useRef, memo } from 'react'
import { supabase } from '../../supabaseClient'
import { safeQuery } from '../../utils/safeQuery'
import { getGradeInfo } from '../../utils/gradeUtils'
import { getPreferredTerm, getTermAcademicYear, getTermLabel, normalizeTermRows } from '../../utils/academicSession'

interface ReportCardsProps {
  showToast: (msg: string, type: string) => void
}

function ReportCards({ showToast }: ReportCardsProps) {
  const [classes, setClasses] = useState<any[]>([])
  const [terms, setTerms] = useState<any[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedTermId, setSelectedTermId] = useState('')
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const setup = async () => {
      const [{ data: cls }, { data: termData }] = await Promise.all([
        safeQuery(() => supabase.from('classes').select('id, class_name').order('class_name')),
        safeQuery(() => supabase.from('terms').select('id, academic_year, is_active').order('id', { ascending: true })),
      ])
      setClasses(cls || [])
      const normalizedTerms = normalizeTermRows(termData || [])
      setTerms(normalizedTerms)
      const preferred = getPreferredTerm(normalizedTerms); if (preferred) setSelectedTermId(String(preferred.id))
    }
    setup()
  }, [])

  const generateReport = async () => {
    if (!selectedClass || !selectedTermId) { showToast?.('Select class and term first.', 'error'); return }
    setLoading(true)
    try {
      const selectedTerm = terms.find((t: any) => String(t.id) === String(selectedTermId))
      const termLabel = getTermLabel(selectedTerm)
      const academicYear = getTermAcademicYear(selectedTerm)

      const { data: studentsData } = await supabase.from('students').select('id, first_name, middle_name, last_name, admission_number, student_id').eq('class_id', selectedClass).eq('is_active', true).order('last_name')
      if (!studentsData || studentsData.length === 0) { showToast?.('No students found in this class.', 'error'); setLoading(false); return }

      const studentIds = studentsData.map((s: any) => s.id)
      const { data: scoresData } = await supabase.from('exam_scores').select('student_id, subject_id, ca1_score, ca2_score, exam_score, approval_status, subjects(subject_name)').in('student_id', studentIds).eq('term', termLabel).eq('academic_year', academicYear).eq('approval_status', 'approved')

      const classScores = scoresData || []
      const studentReports = studentsData.map((student: any) => {
        const studentScores = classScores.filter((s: any) => s.student_id === student.id)
        let totalScore = 0
        const subjects = studentScores.map((s: any) => {
          const total = Number(s.ca1_score || 0) + Number(s.ca2_score || 0) + Number(s.exam_score || 0)
          totalScore += total
          return { name: s.subjects?.subject_name || 'Unknown', ca1: s.ca1_score, ca2: s.ca2_score, exam: s.exam_score, total, grade: getGradeInfo(total).grade, remark: getGradeInfo(total).remark }
        })
        return { ...student, subjects, totalScore, average: subjects.length > 0 ? (totalScore / subjects.length).toFixed(1) : 0, overallGrade: getGradeInfo(subjects.length > 0 ? totalScore / subjects.length : 0).grade, overallRemark: getGradeInfo(subjects.length > 0 ? totalScore / subjects.length : 0).remark }
      })

      studentReports.sort((a: any, b: any) => b.totalScore - a.totalScore)
      studentReports.forEach((s: any, i: number) => (s.position = i + 1))
      studentReports.sort((a: any, b: any) => a.last_name.localeCompare(b.last_name))

      setStudents(studentReports)
    } catch (err: any) { showToast?.('Failed to generate reports: ' + err.message, 'error') }
    setLoading(false)
  }

  const handleDownloadPDF = async (student: any) => {
    try {
      const { generateReportCardPDF } = await import('../../utils/pdfGenerator')
      generateReportCardPDF(student, selectedClassName, termLabel, academicYear, students.length)
      showToast?.('PDF downloaded successfully!', 'success')
    } catch (error: any) { showToast?.('Failed to generate PDF', 'error') }
  }

  const selectedClassName = classes.find((c: any) => String(c.id) === String(selectedClass))?.class_name || ''
  const selectedTerm = terms.find((t: any) => String(t.id) === String(selectedTermId))
  const termLabel = getTermLabel(selectedTerm)
  const academicYear = getTermAcademicYear(selectedTerm)

  return (
    <div style={{ padding: 30 }}>
      <div className="no-print">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, color: '#f8fafc' }}>Report Cards</h2>
            <p style={{ margin: '5px 0 0', color: '#94a3b8' }}>Generate and print student report cards</p>
          </div>
          <button onClick={generateReport} disabled={loading}
            style={{ padding: '10px 20px', background: loading ? '#334155' : '#38bdf8', color: loading ? '#94a3b8' : '#0f172a', border: 'none', borderRadius: 10, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Generating...' : '📄 Generate Reports'}
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>CLASS</label>
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
              style={{ width: '100%', padding: 12, background: '#1e293b', border: '1px solid #334155', borderRadius: 10, color: '#e2e8f0', outline: 'none' }}>
              <option value="">Select class</option>
              {classes.map((c: any) => (<option key={c.id} value={c.id}>{c.class_name}</option>))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>TERM</label>
            <select value={selectedTermId} onChange={(e) => setSelectedTermId(e.target.value)}
              style={{ width: '100%', padding: 12, background: '#1e293b', border: '1px solid #334155', borderRadius: 10, color: '#e2e8f0', outline: 'none' }}>
              <option value="">Select term</option>
              {terms.map((t: any) => (<option key={t.id} value={String(t.id)}>{t.__label || `Term ${t.id}`} ({t.__academicYear})</option>))}
            </select>
          </div>
        </div>
      </div>

      {students.length > 0 && (
        <div className="no-print" style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #334155', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid #334155', color: '#94a3b8', fontSize: '0.85rem' }}>{students.length} student(s) in {selectedClassName} — {termLabel} {academicYear}</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: '1px solid #334155' }}>
                {['STUDENT', 'TOTAL', 'AVERAGE', 'GRADE', 'POSITION', 'ACTION'].map((h) => (
                  <th scope="col" key={h} style={{ padding: 14, textAlign: h === 'STUDENT' ? 'left' : 'center', color: '#94a3b8', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {students.map((s: any) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <td style={{ padding: 14, color: '#e2e8f0', fontWeight: 600 }}>{s.first_name} {s.middle_name ? `${s.middle_name} ` : ''}{s.last_name}</td>
                    <td style={{ padding: 14, textAlign: 'center', color: '#e2e8f0', fontWeight: 700 }}>{s.totalScore}</td>
                    <td style={{ padding: 14, textAlign: 'center', color: '#94a3b8' }}>{s.average}</td>
                    <td style={{ padding: 14, textAlign: 'center', color: getGradeInfo(s.average).color, fontWeight: 700 }}>{s.overallGrade}</td>
                    <td style={{ padding: 14, textAlign: 'center', color: '#38bdf8', fontWeight: 700 }}>{s.position}{s.position === 1 ? 'st' : s.position === 2 ? 'nd' : s.position === 3 ? 'rd' : 'th'}</td>
                    <td style={{ padding: 14, textAlign: 'center' }}>
                      <button onClick={() => handleDownloadPDF(s)} style={{ padding: '6px 14px', background: '#a855f7', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>📥 PDF</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedStudent && (
        <div ref={printRef} className="print-only" style={{ display: 'none' }}>
          <div style={{ padding: 40, fontFamily: 'Arial, sans-serif' }}>
            <div style={{ textAlign: 'center', marginBottom: 30 }}>
              <h1 style={{ margin: 0, fontSize: '24px', color: '#1e293b' }}>DIVINE LIFTING SCHOOL</h1>
              <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '14px' }}>Academic Report Card</p>
              <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '14px' }}>{termLabel} {academicYear}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontSize: '14px' }}>
              <div>
                <p style={{ margin: '4px 0' }}><strong>Student Name:</strong> {selectedStudent.first_name} {selectedStudent.middle_name} {selectedStudent.last_name}</p>
                <p style={{ margin: '4px 0' }}><strong>Admission No:</strong> {selectedStudent.admission_number || 'N/A'}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '4px 0' }}><strong>Class:</strong> {selectedClassName}</p>
                <p style={{ margin: '4px 0' }}><strong>Position:</strong> {selectedStudent.position} out of {students.length}</p>
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, fontSize: '14px' }}>
              <thead><tr style={{ background: '#f1f5f9' }}>
                <th style={{ padding: '8px 12px', border: '1px solid #cbd5e1', textAlign: 'left' }}>Subject</th>
                <th style={{ padding: '8px 12px', border: '1px solid #cbd5e1', textAlign: 'center', width: 80 }}>CA1 (20)</th>
                <th style={{ padding: '8px 12px', border: '1px solid #cbd5e1', textAlign: 'center', width: 80 }}>CA2 (20)</th>
                <th style={{ padding: '8px 12px', border: '1px solid #cbd5e1', textAlign: 'center', width: 80 }}>Exam (60)</th>
                <th style={{ padding: '8px 12px', border: '1px solid #cbd5e1', textAlign: 'center', width: 80 }}>Total</th>
                <th style={{ padding: '8px 12px', border: '1px solid #cbd5e1', textAlign: 'center', width: 60 }}>Grade</th>
                <th style={{ padding: '8px 12px', border: '1px solid #cbd5e1', textAlign: 'center' }}>Remark</th>
              </tr></thead>
              <tbody>
                {selectedStudent.subjects.map((sub: any, i: number) => (
                  <tr key={i}>
                    <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1' }}>{sub.name}</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{sub.ca1}</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{sub.ca2}</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{sub.exam}</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold' }}>{sub.total}</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold' }}>{sub.grade}</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{sub.remark}</td>
                  </tr>
                ))}
                <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                  <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1' }} colSpan={4}>Total / Average</td>
                  <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{selectedStudent.totalScore}</td>
                  <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{selectedStudent.overallGrade}</td>
                  <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{selectedStudent.overallRemark}</td>
                </tr>
              </tbody>
            </table>
            <div style={{ marginTop: 40, display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <div><p style={{ margin: '20px 0 5px', borderTop: '1px solid #000', width: 200 }}>Class Teacher's Signature</p></div>
              <div><p style={{ margin: '20px 0 5px', borderTop: '1px solid #000', width: 200 }}>Principal's Signature</p></div>
              <div><p style={{ margin: '20px 0 5px', borderTop: '1px solid #000', width: 200 }}>Parent's Signature</p></div>
            </div>
            <div style={{ marginTop: 30, textAlign: 'center', fontSize: '12px', color: '#64748b' }}><p>Generated on {new Date().toLocaleDateString()}</p></div>
          </div>
        </div>
      )}
      <style>{`@media print { body * { visibility: hidden; } .print-only, .print-only * { visibility: visible; } .print-only { position: absolute; left: 0; top: 0; width: 100%; display: block !important; } .no-print { display: none !important; } }`}</style>
    </div>
  )
}

export default memo(ReportCards)
