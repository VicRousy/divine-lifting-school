import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

function DashboardStats({ refreshTrigger }) {
  const [stats, setStats] = useState({ students: 0, teachers: 0, classes: 0 })
  const [loading, setLoading] = useState(true)

  const fetchCounts = async () => {
    setLoading(true)
    try {
      // Fetch counts for all three tables in one go
      const { count: studentCount } = await supabase.from('students').select('*', { count: 'exact', head: true })
      const { count: teacherCount } = await supabase.from('teachers').select('*', { count: 'exact', head: true })
      const { count: classCount } = await supabase.from('classes').select('*', { count: 'exact', head: true })

      setStats({
        students: studentCount || 0,
        teachers: teacherCount || 0,
        classes: classCount || 0
      })
    } catch (err) {
      console.error("Stats Error:", err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCounts() }, [refreshTrigger])

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  }

  const cardStyle = {
    background: 'rgba(255, 255, 255, 0.02)',
    padding: '25px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    textAlign: 'left'
  }

  return (
    <div style={gridStyle}>
      <div style={cardStyle}>
        <p className="text-dim" style={{ fontSize: '0.75rem', textTransform: 'uppercase', margin: '0 0 10px 0' }}>Total Students</p>
        <h2 style={{ color: '#38bdf8', fontSize: '2.5rem', margin: 0 }}>{loading ? '...' : stats.students}</h2>
      </div>

      <div style={cardStyle}>
        <p className="text-dim" style={{ fontSize: '0.75rem', textTransform: 'uppercase', margin: '0 0 10px 0' }}>Total Staff</p>
        <h2 style={{ color: '#a855f7', fontSize: '2.5rem', margin: 0 }}>{loading ? '...' : stats.teachers}</h2>
      </div>

      <div style={cardStyle}>
        <p className="text-dim" style={{ fontSize: '0.75rem', textTransform: 'uppercase', margin: '0 0 10px 0' }}>Classrooms</p>
        <h2 style={{ color: '#f59e0b', fontSize: '2.5rem', margin: 0 }}>{loading ? '...' : stats.classes}</h2>
      </div>
    </div>
  )
}

export default DashboardStats