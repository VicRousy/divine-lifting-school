import { useState, useEffect, useCallback, memo } from 'react'
import { supabase } from '../../supabaseClient'
import { safeQuery } from '../../utils/safeQuery'

const AttendanceRow = memo(function AttendanceRow({ student, status, onStatusChange }: {
  student: any; status: string; onStatusChange: (id: number, status: string) => void
}) {
  const getStatusColor = (s: string) => {
    switch(s) { case 'present': return '#10b981'; case 'absent': return '#ef4444'; case 'late': return '#f59e0b'; case 'excused': return '#38bdf8'; default: return '#94a3b8' }
  }
  return (
    <tr>
      <td style={{ fontWeight: '500' }}>{student.first_name} {student.middle_name ? `${student.middle_name} ` : ''}{student.last_name}</td>
      <td style={{ textAlign: 'center' }}>
        <select value={status} onChange={(e) => onStatusChange(student.id, e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: 'none', background: `${getStatusColor(status)}20`, color: getStatusColor(status), fontWeight: 'bold', cursor: 'pointer', outline: `2px solid ${getStatusColor(status)}` }}>
          <option value="present">✓ Present</option>
          <option value="absent">✗ Absent</option>
          <option value="late">⏰ Late</option>
          <option value="excused">📝 Excused</option>
        </select>
      </td>
    </tr>
  )
})

interface AttendanceMarkingProps {
  showToast: (msg: string, type: string) => void
  teacherId?: string
}

function AttendanceMarking({ showToast, teacherId }: AttendanceMarkingProps) {
  const [classes, setClasses] = useState<any[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [students, setStudents] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [scopeMessage, setScopeMessage] = useState('')

  useEffect(() => { fetchClasses() }, [teacherId])

  const fetchClasses = async () => {
    if (teacherId) {
      let teacherBigIntId: number | null = null
      if (/^\d+$/.test(String(teacherId))) teacherBigIntId = Number(teacherId)
      else {
        const { data: teacherData } = await safeQuery(() => supabase.from('teachers').select('id').or(`login_id.eq.${teacherId},email.eq.${teacherId}`).maybeSingle())
        teacherBigIntId = teacherData?.id
      }
      if (teacherBigIntId) {
        const { data } = await safeQuery(() => supabase.from('teacher_assignments').select('class_id, classes(id, class_name)').eq('teacher_id', teacherBigIntId))
        const seen = new Set()
        setScopeMessage('Showing only your assigned classes.')
        const assignedClasses = (data || []).filter((row: any) => row.classes?.id && !seen.has(row.classes.id) && seen.add(row.classes.id)).map((row: any) => row.classes).sort((a: any, b: any) => a.class_name.localeCompare(b.class_name))
        setClasses(assignedClasses)
        return
      }
    }
    const { data } = await safeQuery(() => supabase.from('classes').select('id, class_name').eq('is_active', true).order('class_name'))
    setScopeMessage('')
    setClasses(data || [])
  }

  useEffect(() => { if (selectedClass && selectedDate) fetchStudentsAndAttendance() }, [selectedClass, selectedDate])

  const fetchStudentsAndAttendance = async () => {
    setLoading(true)
    const { data: studentData } = await safeQuery(() => supabase.from('students').select('id, first_name, middle_name, last_name').eq('class_id', selectedClass).eq('is_active', true).order('last_name'))
    setStudents(studentData || [])
    const { data: attendanceData } = await safeQuery(() => supabase.from('attendance').select('id, student_id, date, status').eq('date', selectedDate).in('student_id', (studentData || []).map((s: any) => s.id)))
    const initial: any = {}
    studentData?.forEach((s: any) => { const existing = attendanceData?.find((a: any) => a.student_id === s.id); initial[s.id] = existing?.status || 'present' })
    setAttendance(initial)
    setLoading(false)
  }

  const handleStatusChange = useCallback((studentId: number, status: string) => { setAttendance((prev: any) => ({ ...prev, [studentId]: status })) }, [])
  const handleMarkAll = (status: string) => { const updated: any = {}; students.forEach((s: any) => { updated[s.id] = status }); setAttendance(updated) }

  const handleSave = async () => {
    setLoading(true)
    try {
      const { data: { user } }: any = await supabase.auth.getUser()
      const records = students.map((s: any) => ({ student_id: s.id, date: selectedDate, status: attendance[s.id], marked_by: user?.id || null }))
      const { error } = await supabase.from('attendance').upsert(records, { onConflict: 'student_id,date' })
      if (error) throw error
      showToast(`Attendance saved for ${students.length} students!`, 'success')
      fetchStudentsAndAttendance()
    } catch (err: any) { showToast('Error: ' + err.message, 'error') } finally { setLoading(false) }
  }

  const getStatusColor = (status: string) => { switch(status) { case 'present': return '#10b981'; case 'absent': return '#ef4444'; case 'late': return '#f59e0b'; case 'excused': return '#38bdf8'; default: return '#94a3b8' } }
  const getStatusCount = (status: string) => Object.values(attendance).filter((s) => s === status).length

  return (
    <div className="admin-table-container">
      <h2 style={{ color: '#f8fafc', marginBottom: '20px' }}>📋 Daily Attendance</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div className="form-group">
          <label className="text-dim" style={{ fontSize: '0.85rem' }}>Date</label>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
            style={{ width: '100%', background: '#1e293b', color: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }} />
        </div>
        <div className="form-group">
          <label className="text-dim" style={{ fontSize: '0.85rem' }}>Class</label>
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
            style={{ width: '100%', background: '#1e293b', color: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
            <option value="">Select Class</option>
            {classes.map((c: any) => (<option key={c.id} value={c.id}>{c.class_name}</option>))}
          </select>
        </div>
      </div>
      {scopeMessage && <div style={{ marginBottom: '18px', color: '#38bdf8', fontSize: '0.85rem' }}>{scopeMessage}</div>}
      {selectedClass && students.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', padding: '15px', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
            <button onClick={() => handleMarkAll('present')} style={{ flex: 1, background: '#10b981', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Mark All Present</button>
            <button onClick={() => handleMarkAll('absent')} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Mark All Absent</button>
          </div>
          <div className="mobile-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '30px' }}>
            <div style={{ padding: '15px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{getStatusCount('present')}</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Present</div>
            </div>
            <div style={{ padding: '15px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>{getStatusCount('absent')}</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Absent</div>
            </div>
            <div style={{ padding: '15px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.3)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>{getStatusCount('late')}</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Late</div>
            </div>
            <div style={{ padding: '15px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.3)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#38bdf8' }}>{getStatusCount('excused')}</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Excused</div>
            </div>
          </div>
          <div className="responsive-table-wrap">
            <table className="admin-table">
              <thead><tr><th scope="col">Student Name</th><th scope="col" style={{ textAlign: 'center' }}>Status</th></tr></thead>
              <tbody>{students.map((s: any) => (<AttendanceRow key={s.id} student={s} status={attendance[s.id] || 'present'} onStatusChange={handleStatusChange} />))}</tbody>
            </table>
          </div>
          <button onClick={handleSave} disabled={loading} style={{ background: '#38bdf8', marginTop: '30px', width: '100%', maxWidth: '200px', height: '45px', border: 'none', borderRadius: 8, color: '#0f172a', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Saving...' : '💾 Save Attendance'}
          </button>
        </>
      )}
      {selectedClass && students.length === 0 && !loading && <p style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No active students found in this class.</p>}
      {!selectedClass && <p style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', border: '1px dashed #334155', borderRadius: '8px' }}>Select a date and class to begin marking attendance.</p>}
    </div>
  )
}

export default AttendanceMarking
