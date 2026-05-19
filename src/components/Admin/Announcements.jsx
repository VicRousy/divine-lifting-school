import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

export default function AdminAnnouncements({ showToast }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [audience, setAudience] = useState('all')
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      showToast?.('Failed to load announcements', 'error')
    } else {
      setAnnouncements(data || [])
    }
    setLoading(false)
  }

  const handlePost = async (e) => {
    e.preventDefault()
    if (!title || !body) {
      showToast?.('Please fill in title and message', 'error')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.from('announcements').insert({
        title,
        body,
        audience,
        created_at: new Date().toISOString(),
      })

      if (error) throw error

      showToast?.('Announcement sent successfully!', 'success')
      setTitle('')
      setBody('')
      setAudience('all')
      fetchAnnouncements()
    } catch (err) {
      showToast?.('Failed to send announcement: ' + err.message, 'error')
    }
    setSaving(false)
  }

  const deleteAnnouncement = async (id) => {
    const { error } = await supabase.from('announcements').delete().eq('id', id)
    if (error) {
      showToast?.('Failed to delete announcement', 'error')
    } else {
      showToast?.('Announcement deleted', 'success')
      fetchAnnouncements()
    }
  }

  const getAudienceLabel = (aud) => {
    switch (aud) {
      case 'all': return '🌍 All Users'
      case 'teachers': return '👩‍ Teachers'
      case 'students': return '🎓 Students'
      case 'parents': return '👨‍👩‍ Parents'
      case 'admins': return '⚙️ Admins'
      default: return aud
    }
  }

  return (
    <div style={{ padding: 30 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, color: '#f8fafc' }}>Announcements</h2>
          <p style={{ margin: '5px 0 0', color: '#94a3b8' }}>Send messages to staff, students, or parents</p>
        </div>
      </div>

      <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #334155', borderRadius: 14, padding: 24, marginBottom: 30 }}>
        <h3 style={{ margin: '0 0 20px', color: '#38bdf8' }}>New Announcement</h3>
        <form onSubmit={handlePost} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g., School Closure Notice" style={{ width: '100%', padding: 12, background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#e2e8f0', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>Audience</label>
              <select value={audience} onChange={(e) => setAudience(e.target.value)} style={{ width: '100%', padding: 12, background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#e2e8f0', outline: 'none' }}>
                <option value="all">🌍 All Users</option>
                <option value="teachers">👩‍ Teachers Only</option>
                <option value="students">🎓 Students Only</option>
                <option value="parents">👨‍👩‍👧 Parents Only</option>
                <option value="admins">⚙️ Admins Only</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>Message</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} required rows={4} placeholder="Enter announcement details..." style={{ width: '100%', padding: 12, background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#e2e8f0', outline: 'none', resize: 'vertical' }} />
          </div>
          <button type="submit" disabled={saving} style={{ padding: '12px 24px', background: saving ? '#334155' : '#a855f7', color: saving ? '#94a3b8' : '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '1rem' }}>
            {saving ? 'Sending...' : '📢 Send Announcement'}
          </button>
        </form>
      </div>

      <h3 style={{ margin: '0 0 16px', color: '#f8fafc' }}>Sent Announcements</h3>
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading...</div>
      ) : announcements.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', border: '1px dashed #334155', borderRadius: 14 }}>No announcements sent yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {announcements.map((a) => (
            <div key={a.id} style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #334155', borderRadius: 12, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <h4 style={{ margin: 0, color: '#e2e8f0' }}>{a.title}</h4>
                  <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', background: 'rgba(56,189,248,0.15)', color: '#38bdf8' }}>
                    {getAudienceLabel(a.audience)}
                  </span>
                </div>
                <p style={{ margin: '0 0 8px', color: '#94a3b8', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{a.body}</p>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  📅 {new Date(a.created_at).toLocaleString()}
                </div>
              </div>
              <button onClick={() => deleteAnnouncement(a.id)} style={{ padding: '6px 12px', background: '#ef4444', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: '0.8rem', marginLeft: 16 }}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
