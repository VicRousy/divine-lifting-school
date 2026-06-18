import { useState, useEffect, useCallback, memo } from 'react'
import { useUnsavedChanges } from '../../utils/useUnsavedChanges'
import { supabase } from '../../supabaseClient'
import { safeQuery } from '../../utils/safeQuery'
import { getGradeInfo } from '../../utils/gradeUtils'
import { getPreferredTerm, getTermAcademicYear, getTermLabel, normalizeTermRows } from '../../utils/academicSession'

function clampScore(value: string, max: number) {
  if (value === '' || value === null || value === undefined) return ''
  const num = Number(value)
  if (Number.isNaN(num)) return ''
  return Math.max(0, Math.min(max, num))
}

const ScoreRow = memo(function ScoreRow({ student, scores, onUpdate }: {
  student: any; scores: any; onUpdate: (id: number, field: string, value: string) => void
}) {
  const row = scores || { ca1: '', ca2: '', exam: '' }
  const total = Number(row.ca1 || 0) + Number(row.ca2 || 0) + Number(row.exam || 0)
  const gradeInfo = getGradeInfo(total)

  return (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <td style={{ padding: 14, color: '#e2e8f0', fontWeight: 600, whiteSpace: 'nowrap' }}>
        {student.first_name} {student.middle_name ? `${student.middle_name} ` : ''}{student.last_name}
      </td>
      {['ca1', 'ca2', 'exam'].map((field) => (
        <td key={field} style={{ padding: 14, textAlign: 'center' }}>
          <input type="number" min={0} max={field === 'exam' ? 60 : 20} value={row[field]}
            onChange={(e) => onUpdate(student.id, field, e.target.value)}
            style={{ width: 80, padding: '8px 10px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', outline: 'none', textAlign: 'center' }} />
        </td>
      ))}
      <td style={{ padding: 14, textAlign: 'center', color: total >= 50 ? '#22c55e' : '#f59e0b', fontWeight: 800, fontSize: '1rem' }}>{total}</td>
      <td style={{ padding: 14, textAlign: 'center', color: gradeInfo.color, fontWeight: 800 }}>
        {gradeInfo.grade}
        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>{gradeInfo.remark}</div>
      </td>
      <td style={{ padding: 14, textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>{gradeInfo.remark}</td>
    </tr>
  )
})

interface ScoreEntryProps {
  showToast: (msg: string, type: string) => void
  requireReAuth?: (desc: string, action: () => void) => void
}

export default function ScoreEntry({ showToast, requireReAuth }: ScoreEntryProps) {
  const [classes, setClasses] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [terms, setTerms] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedTermId, setSelectedTermId] = useState('')
  const [scores, setScores] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [dirty, setDirty] = useState(false)
  useUnsavedChanges(dirty)

  const selectedTerm = terms.find((t: any) => String(t.id) === String(selectedTermId))
  const selectedTermLabel = getTermLabel(selectedTerm)
  const selectedAcademicYear = getTermAcademicYear(selectedTerm)

  useEffect(() => {
    const setup = async () => {
      const [{ data: cls }, { data: sub }, { data: termData }] = await Promise.all([
        safeQuery(() => supabase.from('classes').select('id, class_name').order('class_name')),
        safeQuery(() => supabase.from('subjects').select('id, subject_name').order('subject_name')),
        safeQuery(() => supabase.from('terms').select('id, term_name, academic_year, is_active').order('id', { ascending: true })),
      ])
      setClasses(cls || [])
      setSubjects(sub || [])
      const normalizedTerms = normalizeTermRows(termData || [])
      setTerms(normalizedTerms)
      if (normalizedTerms.length > 0 && !selectedTermId) { const preferred = getPreferredTerm(normalizedTerms); if (preferred) setSelectedTermId(String(preferred.id)) }
    }
    setup()
  }, [])

  useEffect(() => {
    if (!selectedClass) return
    const fetchStudents = async () => {
      const { data } = await safeQuery(() => supabase.from('students').select('id, first_name, middle_name, last_name').eq('class_id', selectedClass).eq('is_active', true).order('last_name'))
      const list = data || []
      setStudents(list)
      const initial: any = {}
      for (const s of list) initial[s.id] = { ca1: '', ca2: '', exam: '' }
      setScores(initial)
    }
    fetchStudents()
  }, [selectedClass])

  const updateScore = useCallback((studentId: number, field: string, rawValue: string) => {
    const max = field === 'exam' ? 60 : 20
    const next = rawValue === '' ? '' : clampScore(rawValue, max)
    setScores((prev: any) => ({ ...prev, [studentId]: { ...(prev[studentId] || { ca1: '', ca2: '', exam: '' }), [field]: next } }))
    setDirty(true)
  }, [])

  const doSaveAllScores = async () => {
    setLoading(true)
    try {
      const payload = students.map((s: any) => ({
        student_id: s.id, subject_id: selectedSubject, class_id: selectedClass,
        ca1_score: Number(scores[s.id]?.ca1 || 0), ca2_score: Number(scores[s.id]?.ca2 || 0), exam_score: Number(scores[s.id]?.exam || 0),
        term: selectedTermLabel, academic_year: selectedAcademicYear,
      }))
      const { error } = await supabase.from('exam_scores').upsert(payload, { onConflict: 'student_id,subject_id,term,academic_year' })
      if (error) showToast?.('Save failed: ' + error.message, 'error')
      else { showToast?.(`Saved results for ${students.length} students.`, 'success'); setDirty(false) }
    } finally { setLoading(false) }
  }

  const saveAllScores = () => {
    if (!selectedSubject || !selectedClass || !selectedTermLabel || !selectedAcademicYear) { showToast?.('Select class, subject, and term first.', 'error'); return }
    if (students.length === 0) { showToast?.('No students in this class.', 'error'); return }
    if (requireReAuth) requireReAuth('Enter your password to save scores', doSaveAllScores)
    else doSaveAllScores()
  }

  const ready = selectedClass && selectedSubject && selectedTermId

  return (
    <div style={{ padding: 'clamp(0px, 3vw, 30px)' }}>
      <div className="responsive-header-row" style={{ marginBottom: 18 }}>
        <div>
          <h2 style={{ margin: 0, color: '#f8fafc' }}>Academic Gradebook</h2>
          <div style={{ marginTop: 6, color: '#94a3b8', fontSize: '0.9rem' }}>CA1 (20) + CA2 (20) + Exam (60) = Total (100)</div>
        </div>
        <button onClick={saveAllScores} disabled={loading || !ready || students.length === 0}
          style={{ background: loading || !ready ? '#334155' : '#38bdf8', color: loading || !ready ? '#94a3b8' : '#0f172a', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 700, cursor: loading || !ready ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Saving...' : '💾 Save All'}
        </button>
      </div>

      <div className="responsive-grid-3" style={{ gap: 14, marginBottom: 18 }}>
        {[ 
          { label: 'CLASS', value: selectedClass, set: setSelectedClass, options: classes, optLabel: (c: any) => c.class_name },
          { label: 'SUBJECT', value: selectedSubject, set: setSelectedSubject, options: subjects, optLabel: (s: any) => s.subject_name },
          { label: 'TERM', value: selectedTermId, set: setSelectedTermId, options: terms, optLabel: (t: any) => `${t.__label || `Term ${t.id}`} (${t.__academicYear})` },
        ].map((field: any) => (
          <div key={field.label}>
            <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: 6 }}>{field.label}</div>
            <select value={field.value} onChange={(e) => field.set(e.target.value)}
              style={{ width: '100%', padding: 12, background: '#1e293b', border: '1px solid #334155', borderRadius: 10, color: '#e2e8f0', outline: 'none' }}>
              <option value="">Select {field.label.toLowerCase()}</option>
              {field.options.map((o: any) => (<option key={o.id} value={o.id}>{field.optLabel(o)}</option>))}
            </select>
          </div>
        ))}
      </div>

      {ready ? students.length > 0 ? (
        <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #334155', borderRadius: 14, overflow: 'hidden' }}>
          <div className="responsive-table-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: '1px solid #334155' }}>
                {['STUDENT', 'CA1 (20)', 'CA2 (20)', 'EXAM (60)', 'TOTAL', 'GRADE', 'REMARK'].map((h) => (
                  <th scope="col" key={h} style={{ padding: 14, textAlign: h === 'STUDENT' ? 'left' : 'center', color: '#94a3b8', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{students.map((s: any) => (<ScoreRow key={s.id} student={s} scores={scores[s.id]} onUpdate={updateScore} />))}</tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', border: '1px dashed #334155', borderRadius: 14 }}>No active students found in this class.</div>
      ) : (
        <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', border: '1px dashed #334155', borderRadius: 14 }}>Select a class, subject, and term to start entering grades.</div>
      )}
    </div>
  )
}
