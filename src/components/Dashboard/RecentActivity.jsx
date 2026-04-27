import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

function RecentActivity({ refreshTrigger }) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchGlobalActivity = async () => {
    setLoading(true)
    try {
      // Fetch latest students
      const { data: students } = await supabase
        .from('students')
        .select('first_name, last_name, created_at')
        .order('created_at', { ascending: false })
        .limit(3)

      // Fetch latest teachers
      const { data: teachers } = await supabase
        .from('teachers')
        .select('first_name, last_name, created_at')
        .order('created_at', { ascending: false })
        .limit(2)

      // Merge and sort them by date
      const combined = [
        ...(students || []).map(s => ({ ...s, type: 'STUDENT' })),
        ...(teachers || []).map(t => ({ ...t, type: 'TEACHER' }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      setActivities(combined.slice(0, 5)) // Keep top 5 latest overall
    } catch (err) {
      console.error("Activity fetch failed", err)
    } finally {
      setLoading(false)
    }
  }

  // Added refreshTrigger here so it updates when you add someone!
  useEffect(() => {
    fetchGlobalActivity()
  }, [refreshTrigger])

  // Simple "Time Ago" formatter
  const formatTime = (dateString) => {
    const now = new Date()
    const past = new Date(dateString)
    const diffInMs = now - past
    const diffInMins = Math.floor(diffInMs / 60000)
    
    if (diffInMins < 1) return 'Just now'
    if (diffInMins < 60) return `${diffInMins}m ago`
    const diffInHours = Math.floor(diffInMins / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    return past.toLocaleDateString()
  }

  return (
    <div style={{ marginTop: '30px' }}>
      <h4 className="text-dim" style={{ marginBottom: '15px', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
        Live Updates
      </h4>
      
      {loading ? (
        <p className="text-dim">Fetching updates...</p>
      ) : (
        activities.map((act, index) => (
          <div key={index} className="counter" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '12px 15px', 
            marginBottom: '10px',
            background: 'rgba(255,255,255,0.02)',
            borderLeft: `4px solid ${act.type === 'STUDENT' ? '#38bdf8' : '#a855f7'}`,
            fontSize: '0.85rem',
            color: '#f8fafc'
          }}>
            <div>
              <span className="text-dim" style={{ marginRight: '8px' }}>
                {act.type === 'STUDENT' ? '🎓' : '💼'}
              </span>
              <strong>{act.first_name} {act.last_name}</strong>
              <span className="text-dim"> was registered as {act.type.toLowerCase()}.</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {formatTime(act.created_at)}
            </span>
          </div>
        ))
      )}

      {activities.length === 0 && !loading && (
        <p className="text-dim">No recent activity found.</p>
      )}
    </div>
  )
}

export default RecentActivity