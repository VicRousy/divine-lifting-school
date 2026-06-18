import { useState, useEffect, useCallback, memo } from 'react'
import { supabase } from '../../supabaseClient'
import { safeQuery } from '../../utils/safeQuery'

const QuickAttendanceRow = memo(function QuickAttendanceRow({ student, status, onStatusChange }: {
  student: any; status: string; onStatusChange: (id: number, status: string) => void
}) {
  return (
    <tr>
      <td style={{ padding: 12, fontWeight: 600, color: '#e2e8f0' }}>{student.first_name} {student.last_name}</td>
      <td style={{ padding: 12, textAlign: 'center' }}>
        <select value={status} onChange={(e) => onStatusChange(student.id, e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: status === 'present' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: status === 'present' ? '#10b981' : '#ef4444', fontWeight: 'bold', cursor: 'pointer' }}>
          <option value="present">✓ Present</option>
          <option value="absent">✗ Absent</option>
          <option value="late">⏰ Late</option>
          <option value="excused">📝 Excused</option>
        </select>
      </td>
    </tr>
  )
})

interface QuickAttendanceProps {
  teacherId: string
  showToast: (msg: string, type: string) => void
}

export default function QuickAttendance({ teacherId, showToast }: QuickAttendanceProps) {
  const [classes, setClasses] = useState<any[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [students, setStudents] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any>({})
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
      const today = new Date().toISOString().split('T')[0]
      const { data: studentData } = await safeQuery(() => supabase.from('students').select('id, first_name, last_name').eq('class_id', selectedClass).eq('is_active', true).order('last_name'))
      setStudents(studentData || [])
      const { data: attendanceData } = await safeQuery(() => supabase.from('attendance').select('id, student_id, date, status').eq('date', today).in('student_id', (studentData || []).map((s: any) => s.id)))
      const initial: any = {}
      studentData?.forEach((s: any) => { initial[s.id] = attendanceData?.find((a: any) => a.student_id === s.id)?.status || 'present' })
      setAttendance(initial)
      setLoading(false)
    }
    fetchStudents()
  }, [selectedClass])

  const handleStatusChange = useCallback((studentId: number, status: string) => {
    setAttendance((prev: any) => ({ ...prev, [studentId]: status }))
  }, [])

  const handleSave = async () => {
    setLoading(true)
    const { data: { user } }: any = await supabase.auth.getUser()
    const today = new Date().toISOString().split('T')[0]
    const records = students.map((s: any) => ({ student_id: s.id, date: today, status: attendance[s.id], marked_by: user?.id || null }))
    const { error } = await supabase.from('attendance').upsert(records, { onConflict: 'student_id,date' })
    if (error) showToast?.('Error: ' + error.message, 'error')
    else showToast(`Attendance saved for ${students.length} students!`, 'success')
    setLoading(false)
  }

  return (
    <div style={{ padding: 30 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: '#f8fafc' }}>Quick Attendance</h2>
        <button onClick={handleSave} disabled={loading || !selectedClass}
          style={{ padding: '10px 20px', background: loading ? '#334155' : '#38bdf8', color: loading ? '#94a3b8' : '#0f172a', border: 'none', borderRadius: 8, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Saving...' : '💾 Save'}
        </button>
      </div>

      <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
        style={{ width: '100%', padding: 12, background: '#1e293b', border: '1px solid #334155', borderRadius: 10, color: '#e2e8f0', outline: 'none', marginBottom: 20 }}>
        <option value="">Select Class</option>
        {classes.map((c: any) => (<option key={c.id} value={c.id}>{c.class_name}</option>))}
      </select>

      {selectedClass && students.length > 0 ? (
        <div className="responsive-table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: '1px solid #334155' }}>
              <th style={{ padding: 14, textAlign: 'left', color: '#94a3b8' }}>STUDENT</th>
              <th style={{ padding: 14, textAlign: 'center', color: '#94a3b8' }}>STATUS</th>
            </tr></thead>
            <tbody>
              {students.map((s: any) => (
                <QuickAttendanceRow key={s.id} student={s} status={attendance[s.id] || 'present'} onStatusChange={handleStatusChange} />
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
