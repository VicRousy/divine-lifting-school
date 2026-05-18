import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

function AttendanceMarking({ showToast, teacherId }) {
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState({})
  const [loading, setLoading] = useState(false)
  const [scopeMessage, setScopeMessage] = useState('')

  useEffect(() => {
    fetchClasses()
  }, [teacherId])

  const fetchClasses = async () => {
    if (teacherId) {
      const { data, error } = await supabase
        .from('teacher_assignments')
        .select('class_id, classes(id, class_name)')
        .eq('teacher_id', teacherId)

      if (error) {
        showToast?.('Could not load assigned classes: ' + error.message, 'error')
        setClasses([])
        return
      }

      const seen = new Set()
      const assignedClasses = (data || [])
        .filter((row) => row.classes?.id && !seen.has(row.classes.id) && seen.add(row.classes.id))
        .map((row) => row.classes)
        .sort((a, b) => a.class_name.localeCompare(b.class_name))

      setScopeMessage('Showing only your assigned classes.')
      setClasses(assignedClasses)
      if (!assignedClasses.some((cls) => String(cls.id) === String(selectedClass))) {
        setSelectedClass(assignedClasses[0]?.id || '')
      }
      return
    }

    const { data } = await supabase
      .from('classes')
      .select('*')
      .eq('is_active', true)
      .order('class_name')
    setScopeMessage('')
    setClasses(data || [])
  }

  useEffect(() => {
    if (selectedClass && selectedDate) {
      fetchStudentsAndAttendance()
    }
  }, [selectedClass, selectedDate])

  const fetchStudentsAndAttendance = async () => {
    setLoading(true)
    
    // Fetch students
    const { data: studentData } = await supabase
      .from('students')
      .select('id, first_name, middle_name, last_name')
      .eq('class_id', selectedClass)
      .eq('is_active', true)
      .order('last_name')
    
    setStudents(studentData || [])

    // Fetch existing attendance for this date
    const { data: attendanceData } = await supabase
      .from('attendance')
      .select('*')
      .eq('date', selectedDate)
      .in('student_id', (studentData || []).map(s => s.id))

    // Build attendance state
    const initialAttendance = {}
    studentData?.forEach(s => {
      const existing = attendanceData?.find(a => a.student_id === s.id)
      initialAttendance[s.id] = existing?.status || 'present'
    })
    setAttendance(initialAttendance)
    
    setLoading(false)
  }

  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }))
  }

  const handleMarkAll = (status) => {
    const updated = {}
    students.forEach(s => {
      updated[s.id] = status
    })
    setAttendance(updated)
  }

  const handleSave = async () => {
    setLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const records = students.map(s => ({
        student_id: s.id,
        date: selectedDate,
        status: attendance[s.id],
        marked_by: user.id
      }))

      const { error } = await supabase
        .from('attendance')
        .upsert(records, { 
          onConflict: 'student_id,date'
        })

      if (error) throw error
      
      showToast(`Attendance saved for ${students.length} students!`, 'success')
      fetchStudentsAndAttendance()
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const getFullName = (s) => `${s.first_name} ${s.middle_name ? s.middle_name + ' ' : ''}${s.last_name}`

  const getStatusColor = (status) => {
    switch(status) {
      case 'present': return '#10b981'
      case 'absent': return '#ef4444'
      case 'late': return '#f59e0b'
      case 'excused': return '#38bdf8'
      default: return '#94a3b8'
    }
  }

  const getStatusCount = (status) => {
    return Object.values(attendance).filter(s => s === status).length
  }

  return (
    <div className="admin-table-container">
      <h2 style={{ color: '#f8fafc', marginBottom: '20px' }}>📋 Daily Attendance</h2>

      {/* Date & Class Selection */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div className="form-group">
          <label className="text-dim" style={{ fontSize: '0.85rem' }}>Date</label>
          <input 
            type="date"
            className="counter"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ width: '100%', background: '#1e293b', color: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}
          />
        </div>

        <div className="form-group">
          <label className="text-dim" style={{ fontSize: '0.85rem' }}>Class</label>
          <select 
            className="counter"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            style={{ width: '100%', background: '#1e293b', color: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}
          >
            <option value="">Select Class</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.class_name}</option>
            ))}
          </select>
        </div>
      </div>

      {scopeMessage && (
        <div style={{ marginBottom: '18px', color: '#38bdf8', fontSize: '0.85rem' }}>
          {scopeMessage}
        </div>
      )}

      {/* Quick Actions */}
      {selectedClass && students.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', padding: '15px', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
            <button onClick={() => handleMarkAll('present')} style={{ flex: 1, background: '#10b981', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              Mark All Present
            </button>
            <button onClick={() => handleMarkAll('absent')} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              Mark All Absent
            </button>
          </div>

          {/* Stats Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '30px' }}>
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

          {/* Attendance Table */}
          <table className="admin-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th style={{ textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: '500' }}>{getFullName(s)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <select
                      value={attendance[s.id] || 'present'}
                      onChange={(e) => handleStatusChange(s.id, e.target.value)}
                      style={{ 
                        padding: '8px 12px', 
                        borderRadius: '6px', 
                        border: 'none',
                        background: `${getStatusColor(attendance[s.id])}20`,
                        color: getStatusColor(attendance[s.id]),
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        outline: `2px solid ${getStatusColor(attendance[s.id])}`
                      }}
                    >
                      <option value="present">✓ Present</option>
                      <option value="absent">✗ Absent</option>
                      <option value="late">⏰ Late</option>
                      <option value="excused">📝 Excused</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button 
            onClick={handleSave}
            disabled={loading}
            className="btn-delete"
            style={{ background: '#38bdf8', marginTop: '30px', width: '200px', height: '45px' }}
          >
            {loading ? 'Saving...' : '💾 Save Attendance'}
          </button>
        </>
      )}

      {selectedClass && students.length === 0 && !loading && (
        <p className="text-dim" style={{ padding: '40px', textAlign: 'center' }}>
          No active students found in this class.
        </p>
      )}

      {!selectedClass && (
        <p className="text-dim" style={{ padding: '40px', textAlign: 'center', border: '1px dashed #334155', borderRadius: '8px' }}>
          Select a date and class to begin marking attendance.
        </p>
      )}
    </div>
  )
}

export default AttendanceMarking
