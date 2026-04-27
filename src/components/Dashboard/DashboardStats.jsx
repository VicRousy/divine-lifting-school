import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

function DashboardStats({ refreshTrigger }) {
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
    assignments: 0
  })

  const getStats = async () => {
    const [resS, resT, resC, resA] = await Promise.all([
      supabase.from('students').select('*', { count: 'exact', head: true }),
      supabase.from('teachers').select('*', { count: 'exact', head: true }),
      supabase.from('classes').select('*', { count: 'exact', head: true }),
      supabase.from('teacher_assignments').select('*', { count: 'exact', head: true })
    ])

    setStats({
      students: resS.count || 0,
      teachers: resT.count || 0,
      classes: resC.count || 0,
      assignments: resA.count || 0
    })
  }

  useEffect(() => {
    getStats()
  }, [refreshTrigger])

  // Custom styles for the metric containers
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '40px'
  }

  const cardStyle = {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    padding: '20px',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  }

  return (
    <div style={gridStyle}>
      {/* Total Students - Sky Blue */}
      <div style={cardStyle}>
        <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '500' }}>Total Students</span>
        <h2 style={{ fontSize: '2rem', color: '#38bdf8', textShadow: '0 0 15px rgba(56, 189, 248, 0.3)', margin: 0 }}>
          {stats.students}
        </h2>
      </div>

      {/* Staff Directory - Purple */}
      <div style={cardStyle}>
        <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '500' }}>Staff Members</span>
        <h2 style={{ fontSize: '2rem', color: '#a855f7', textShadow: '0 0 15px rgba(168, 85, 247, 0.3)', margin: 0 }}>
          {stats.teachers}
        </h2>
      </div>

      {/* Classrooms - Amber/Yellow */}
      <div style={cardStyle}>
        <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '500' }}>Classrooms</span>
        <h2 style={{ fontSize: '2rem', color: '#fbbf24', textShadow: '0 0 15px rgba(251, 191, 36, 0.3)', margin: 0 }}>
          {stats.classes}
        </h2>
      </div>

      {/* Active Assignments - Emerald Green */}
      <div style={cardStyle}>
        <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '500' }}>Active Assignments</span>
        <h2 style={{ fontSize: '2rem', color: '#10b981', textShadow: '0 0 15px rgba(16, 185, 129, 0.3)', margin: 0 }}>
          {stats.assignments}
        </h2>
      </div>
    </div>
  )
}

export default DashboardStats