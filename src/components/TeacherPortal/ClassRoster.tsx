import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { safeQuery } from '../../utils/safeQuery'

interface ClassRosterProps {
  teacherId: string
  showToast: (msg: string, type: string) => void
}

export default function ClassRoster({ teacherId, showToast }: ClassRosterProps) {
  const [classes, setClasses] = useState<any[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!teacherId) return
    const fetchClasses = async () => {
      let teacherBigIntId: number | null = null
      if (/^\d+$/.test(String(teacherId))) teacherBigIntId = Number(teacherId)
      else {
        const { data: t } = await safeQuery(() => supabase.from('teachers').select('id').or(`login_id.eq.${teacherId},email.eq.${teacherId}`).maybeSingle())
        teacherBigIntId = t?.id
      }
      if (!teacherBigIntId) return
      const { data } = await safeQuery(() => supabase.from('teacher_assignments').select('class_id, classes(id, class_name)').eq('teacher_id', teacherBigIntId))
      const seen = new Set()
      setClasses((data || []).filter((row: any) => row.classes?.id && !seen.has(row.classes.id) && seen.add(row.classes.id)).map((row: any) => row.classes))
    }
    fetchClasses()
  }, [teacherId])

  useEffect(() => {
    if (!selectedClass) return
    const fetchStudents = async () => {
      setLoading(true)
      const { data } = await safeQuery(() => supabase.from('students').select('id, first_name, middle_name, last_name, student_id, email').eq('class_id', selectedClass).eq('is_active', true).order('last_name'))
      setStudents(data || [])
      setLoading(false)
    }
    fetchStudents()
  }, [selectedClass])

  return (
    <div style={{ padding: 30 }}>
      <h2 style={{ margin: '0 0 20px', color: '#f8fafc' }}>Class Roster</h2>

      <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
        style={{ width: '100%', padding: 12, background: '#1e293b', border: '1px solid #334155', borderRadius: 10, color: '#e2e8f0', outline: 'none', marginBottom: 20 }}>
        <option value="">Select Class</option>
        {classes.map((c: any) => (<option key={c.id} value={c.id}>{c.class_name}</option>))}
      </select>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading...</div>
      ) : selectedClass && students.length > 0 ? (
        <div className="responsive-table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: '1px solid #334155' }}>
              <th style={{ padding: 14, textAlign: 'left', color: '#94a3b8' }}>NAME</th>
              <th style={{ padding: 14, textAlign: 'left', color: '#94a3b8' }}>STUDENT ID</th>
              <th style={{ padding: 14, textAlign: 'left', color: '#94a3b8' }}>EMAIL</th>
            </tr></thead>
            <tbody>
              {students.map((s: any) => (
                <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <td style={{ padding: 14, color: '#e2e8f0', fontWeight: 600 }}>{s.first_name} {s.middle_name ? `${s.middle_name} ` : ''}{s.last_name}</td>
                  <td style={{ padding: 14, color: '#94a3b8' }}>{s.student_id}</td>
                  <td style={{ padding: 14, color: '#94a3b8' }}>{s.email || '—'}</td>
                </tr>
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
