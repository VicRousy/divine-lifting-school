import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

function RecentActivity() {
  const [recentStudents, setRecentStudents] = useState([])

  useEffect(() => {
    async function fetchRecent() {
      const { data } = await supabase
        .from('students')
        .select('first_name, last_name, created_at')
        .order('created_at', { ascending: false })
        .limit(5)
      setRecentStudents(data || [])
    }
    fetchRecent()
    
    // Refresh every time a student is added (optional)
  }, [])

  return (
    <div style={{ marginTop: '30px' }}>
      <h4 style={{ color: '#94a3b8', marginBottom: '15px' }}>Recent Registrations</h4>
      {recentStudents.map((s, index) => (
        <div key={index} style={{ 
          background: 'rgba(255,255,255,0.03)', 
          padding: '10px 15px', 
          borderRadius: '8px', 
          marginBottom: '8px',
          fontSize: '0.9rem',
          borderLeft: '4px solid #38bdf8'
        }}>
          New Student: <strong>{s.first_name} {s.last_name}</strong> was just added.
        </div>
      ))}
    </div>
  )
}

export default RecentActivity