import { useState, useEffect, useCallback, memo } from 'react'
import { supabase } from '../../supabaseClient'
import { safeQuery } from '../../utils/safeQuery'

const GradebookRow = memo(function GradebookRow({ student, scores, onUpdate }: {
  student: any; scores: any; onUpdate: (id: number, field: string, value: string) => void
}) {
  const row = scores || { ca1: '', ca2: '', exam: '' }
  return (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <td style={{ padding: 14, color: '#e2e8f0', fontWeight: 600 }}>{student.first_name} {student.last_name}</td>
      {['ca1', 'ca2', 'exam'].map((field) => (
        <td key={field} style={{ padding: 14, textAlign: 'center' }}>
          <input type="number" min={0} max={field === 'exam' ? 60 : 20} value={(row as any)[field]}
            onChange={(e) => onUpdate(student.id, field, e.target.value)}
            style={{ width: 70, padding: '8px 10px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', outline: 'none', textAlign: 'center' }} />
        </td>
      ))}
      <td style={{ padding: 14, textAlign: 'center', color: '#e2e8f0', fontWeight: 700 }}>
        {Number(row.ca1 || 0) + Number(row.ca2 || 0) + Number(row.exam || 0)}
      </td>
    </tr>
  )
})

interface TeacherGradebookProps {
  teacherId: string
  showToast: (msg: string, type: string) => void
}

export default function TeacherGradebook({ teacherId, showToast }: TeacherGradebookProps) {
  const [classes, setClasses] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [scores, setScores] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchClasses() }, [teacherId])

  const fetchClasses = async () => {
    if (!teacherId) return
    let teacherBigIntId: number | null = null
    if (/^\d+$/.test(String(teacherId))) {
      teacherBigIntId = Number(teacherId)
    } else {
      const { data: t } = await safeQuery(() => supabase.from('teachers').select('id').or(`login_id.eq.${teacherId},email.eq.${teacherId}`).maybeSingle())
      teacherBigIntId = t?.id
    }
    if (!teacherBigIntId) return
    const { data } = await safeQuery(() => supabase.from('teacher_assignments').select('class_id, classes(id, class_name), subjects(id, subject_name)').eq('teacher_id', teacherBigIntId))
    const seen = new Set()
    setClasses((data || []).filter((row: any) => row.classes?.id && !seen.has(row.classes.id) && seen.add(row.classes.id)).map((row: any) => row.classes))
    setSubjects((data || []).filter((row: any) => row.subjects?.id).map((row: any) => row.subjects))
  }

  useEffect(() => {
    if (!selectedClass) return
    const fetchStudents = async () => {
      const { data } = await safeQuery(() => supabase.from('students').select('id, first_name, last_name').eq('class_id', selectedClass).eq('is_active', true).order('last_name'))
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
    const val = rawValue === '' ? '' : Math.max(0, Math.min(max, Number(rawValue)))
    setScores((prev: any) => ({ ...prev, [studentId]: { ...(prev[studentId] || { ca1: '', ca2: '', exam: '' }), [field]: val } }))
  }, [])

  const handleSave = async () => {
    if (!selectedClass || !selectedSubject) return
    setSaving(true)
    const payload = students.map((s: any) => ({
      student_id: s.id, subject_id: Number(selectedSubject), class_id: Number(selectedClass),
      ca1_score: Number(scores[s.id]?.ca1 || 0), ca2_score: Number(scores[s.id]?.ca2 || 0), exam_score: Number(scores[s.id]?.exam || 0),
    }))
    const { error } = await supabase.from('exam_scores').upsert(payload, { onConflict: 'student_id,subject_id,term,academic_year' })
    if (error) showToast?.('Save failed: ' + error.message, 'error')
    else showToast?.(`Saved ${students.length} scores.`, 'success')
    setSaving(false)
  }

  return (
    <div style={{ padding: 30 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: '#f8fafc' }}>Teacher Gradebook</h2>
        <button onClick={handleSave} disabled={saving || !selectedClass}
          style={{ padding: '10px 20px', background: saving ? '#334155' : '#38bdf8', color: saving ? '#94a3b8' : '#0f172a', border: 'none', borderRadius: 8, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
          {saving ? 'Saving...' : '💾 Save'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
          style={{ padding: 12, background: '#1e293b', border: '1px solid #334155', borderRadius: 10, color: '#e2e8f0', outline: 'none' }}>
          <option value="">Select Class</option>
          {classes.map((c: any) => (<option key={c.id} value={c.id}>{c.class_name}</option>))}
        </select>
        <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}
          style={{ padding: 12, background: '#1e293b', border: '1px solid #334155', borderRadius: 10, color: '#e2e8f0', outline: 'none' }}>
          <option value="">Select Subject</option>
          {subjects.map((s: any) => (<option key={s.id} value={s.id}>{s.subject_name}</option>))}
        </select>
      </div>

      {selectedClass && students.length > 0 ? (
        <div className="responsive-table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: '1px solid #334155' }}>
              <th style={{ padding: 14, textAlign: 'left', color: '#94a3b8' }}>STUDENT</th>
              <th style={{ padding: 14, textAlign: 'center', color: '#94a3b8' }}>CA1 (20)</th>
              <th style={{ padding: 14, textAlign: 'center', color: '#94a3b8' }}>CA2 (20)</th>
              <th style={{ padding: 14, textAlign: 'center', color: '#94a3b8' }}>EXAM (60)</th>
              <th style={{ padding: 14, textAlign: 'center', color: '#94a3b8' }}>TOTAL</th>
            </tr></thead>
            <tbody>
              {students.map((s: any) => (
                <GradebookRow key={s.id} student={s} scores={scores[s.id]} onUpdate={updateScore} />
              ))}
            </tbody>
          </table>
        </div>
      ) : selectedClass ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No active students found.</div>
      ) : null}
    </div>
  )
}
