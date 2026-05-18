import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

function AttendanceReports({ showToast }) {
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedStudent, setSelectedStudent] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [reportData, setReportData] = useState([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState('class') // 'class' or 'student'

  useEffect(() => {
    fetchClasses()
    // Set start date to 30 days ago
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0])
  }, [])

  const fetchClasses = async () => {
    const { data } = await supabase
      .from('classes')
      .select('*')
      .eq('is_active', true)
      .order('class_name')
    setClasses(data || [])
  }

  useEffect(() => {
    if (selectedClass) {
      fetchStudents()
    }
  }, [selectedClass])

  const fetchStudents = async () => {
    const { data } = await supabase
      .from('students')
      .select('id, first_name, middle_name, last_name')
      .eq('class_id', selectedClass)
      .eq('is_active', true)
      .order('last_name')
    setStudents(data || [])
  }

  const generateClassReport = async () => {
    if (!selectedClass || !startDate || !endDate) {
      showToast('Please select class and date range', 'error')
      return
    }

    setLoading(true)
    try {
      // Fetch all students in class
      const { data: studentData } = await supabase
        .from('students')
        .select('id, first_name, middle_name, last_name')
        .eq('class_id', selectedClass)
        .eq('is_active', true)

      if (!studentData || studentData.length === 0) {
        showToast('No students found in this class', 'error')
        setLoading(false)
        return
      }

      const studentIds = studentData.map(s => s.id)

      // Fetch attendance records for date range
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .in('student_id', studentIds)
        .gte('date', startDate)
        .lte('date', endDate)

      // Calculate stats for each student
      const report = studentData.map(student => {
        const records = attendanceData?.filter(a => a.student_id === student.id) || []
        const present = records.filter(r => r.status === 'present').length
        const absent = records.filter(r => r.status === 'absent').length
        const late = records.filter(r => r.status === 'late').length
        const excused = records.filter(r => r.status === 'excused').length
        const total = records.length
        const percentage = total > 0 ? ((present + late) / total * 100).toFixed(1) : 0

        return {
          student,
          present,
          absent,
          late,
          excused,
          total,
          percentage
        }
      })

      setReportData(report)
    } catch (err) {
      showToast('Error generating report: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const generateStudentReport = async () => {
    if (!selectedStudent || !startDate || !endDate) {
      showToast('Please select student and date range', 'error')
      return
    }

    setLoading(true)
    try {
      // Fetch student info
      const { data: studentData } = await supabase
        .from('students')
        .select('id, first_name, middle_name, last_name, classes(class_name)')
        .eq('id', selectedStudent)
        .single()

      // Fetch attendance records
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', selectedStudent)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })

      setReportData({
        student: studentData,
        records: attendanceData || []
      })
    } catch (err) {
      showToast('Error generating report: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const getFullName = (s) => `${s.first_name} ${s.middle_name ? s.middle_name + ' ' : ''}${s.last_name}`

  const getStatusBadge = (status) => {
    const styles = {
      present: { bg: '#10b981', text: 'Present' },
      absent: { bg: '#ef4444', text: 'Absent' },
      late: { bg: '#f59e0b', text: 'Late' },
      excused: { bg: '#38bdf8', text: 'Excused' }
    }
    const style = styles[status] || styles.present
    return (
      <span style={{
        padding: '4px 10px',
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: 'bold',
        background: `${style.bg}20`,
        color: style.bg,
        border: `1px solid ${style.bg}50`
      }}>
        {style.text}
      </span>
    )
  }

  return (
    <div className="admin-table-container">
      <h2 style={{ color: '#f8fafc', marginBottom: '20px' }}>📊 Attendance Reports</h2>

      {/* View Mode Toggle */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        <button
          onClick={() => setViewMode('class')}
          style={{
            flex: 1,
            padding: '12px',
            background: viewMode === 'class' ? '#38bdf8' : 'transparent',
            color: viewMode === 'class' ? '#020617' : '#94a3b8',
            border: `1px solid ${viewMode === 'class' ? '#38bdf8' : '#334155'}`,
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          📋 Class Summary
        </button>
        <button
          onClick={() => setViewMode('student')}
          style={{
            flex: 1,
            padding: '12px',
            background: viewMode === 'student' ? '#38bdf8' : 'transparent',
            color: viewMode === 'student' ? '#020617' : '#94a3b8',
            border: `1px solid ${viewMode === 'student' ? '#38bdf8' : '#334155'}`,
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          👤 Individual Student
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'class' ? '1fr 1fr 1fr' : '1fr 1fr 1fr 1fr', gap: '15px', marginBottom: '30px' }}>
        <div className="form-group">
          <label className="text-dim" style={{ fontSize: '0.85rem' }}>Start Date</label>
          <input
            type="date"
            className="counter"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ width: '100%', background: '#1e293b', color: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}
          />
        </div>

        <div className="form-group">
          <label className="text-dim" style={{ fontSize: '0.85rem' }}>End Date</label>
          <input
            type="date"
            className="counter"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
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

        {viewMode === 'student' && (
          <div className="form-group">
            <label className="text-dim" style={{ fontSize: '0.85rem' }}>Student</label>
            <select
              className="counter"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              style={{ width: '100%', background: '#1e293b', color: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}
              disabled={!selectedClass}
            >
              <option value="">Select Student</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{getFullName(s)}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <button
        onClick={viewMode === 'class' ? generateClassReport : generateStudentReport}
        disabled={loading}
        className="btn-delete"
        style={{ background: '#38bdf8', marginBottom: '30px', width: '200px', height: '45px' }}
      >
        {loading ? 'Generating...' : '📊 Generate Report'}
      </button>

      {/* CLASS SUMMARY VIEW */}
      {viewMode === 'class' && reportData.length > 0 && (
        <div>
          <h3 style={{ color: '#f8fafc', marginBottom: '20px' }}>
            Class Attendance Summary ({reportData.length} students)
          </h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th style={{ textAlign: 'center' }}>Present</th>
                <th style={{ textAlign: 'center' }}>Absent</th>
                <th style={{ textAlign: 'center' }}>Late</th>
                <th style={{ textAlign: 'center' }}>Excused</th>
                <th style={{ textAlign: 'center' }}>Total Days</th>
                <th style={{ textAlign: 'center' }}>Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((row, index) => (
                <tr key={index}>
                  <td style={{ fontWeight: '500' }}>{getFullName(row.student)}</td>
                  <td style={{ textAlign: 'center', color: '#10b981', fontWeight: 'bold' }}>{row.present}</td>
                  <td style={{ textAlign: 'center', color: '#ef4444', fontWeight: 'bold' }}>{row.absent}</td>
                  <td style={{ textAlign: 'center', color: '#f59e0b', fontWeight: 'bold' }}>{row.late}</td>
                  <td style={{ textAlign: 'center', color: '#38bdf8', fontWeight: 'bold' }}>{row.excused}</td>
                  <td style={{ textAlign: 'center' }}>{row.total}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      background: row.percentage >= 80 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: row.percentage >= 80 ? '#10b981' : '#ef4444',
                      fontWeight: 'bold'
                    }}>
                      {row.percentage}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* STUDENT INDIVIDUAL VIEW */}
      {viewMode === 'student' && reportData.student && (
        <div>
          <div style={{ background: 'rgba(56, 189, 248, 0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.2)', marginBottom: '30px' }}>
            <h3 style={{ color: '#f8fafc', margin: '0 0 10px 0' }}>
              {getFullName(reportData.student)}
            </h3>
            <p style={{ color: '#94a3b8', margin: 0 }}>
              Class: {reportData.student.classes?.class_name} | Total Records: {reportData.records.length}
            </p>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th style={{ textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {reportData.records.map((record, index) => (
                <tr key={index}>
                  <td>{new Date(record.date).toLocaleDateString('en-GB')}</td>
                  <td style={{ textAlign: 'center' }}>
                    {getStatusBadge(record.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {reportData.records.length === 0 && (
            <p className="text-dim" style={{ textAlign: 'center', padding: '40px' }}>
              No attendance records found for this date range.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default AttendanceReports