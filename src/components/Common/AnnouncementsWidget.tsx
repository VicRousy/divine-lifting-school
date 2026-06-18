import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

interface AnnouncementsWidgetProps {
  role: string
}

export default function AnnouncementsWidget({ role }: AnnouncementsWidgetProps) {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('id, title, body, created_at')
          .or(`audience.eq.all,audience.eq.${role}`)
          .order('created_at', { ascending: false })
          .limit(5)

        if (error) throw error
        setAnnouncements(data || [])
      } catch (err) {
        console.error('Failed to load announcements:', err)
      }
      setLoading(false)
    }

    fetchAnnouncements()
  }, [role])

  if (loading) return <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>Loading announcements...</div>
  if (announcements.length === 0) return <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>No new announcements.</div>

  return (
    <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #334155', borderRadius: 14, padding: 24, marginTop: 30 }}>
      <h3 style={{ margin: '0 0 16px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
        📢 Announcements
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {announcements.map((a) => (
          <div key={a.id} style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid #334155', borderRadius: 10, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h4 style={{ margin: 0, color: '#e2e8f0', fontSize: '1rem' }}>{a.title}</h4>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{new Date(a.created_at).toLocaleDateString()}</span>
            </div>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{a.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
