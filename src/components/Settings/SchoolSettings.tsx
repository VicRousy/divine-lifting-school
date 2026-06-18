import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { safeQuery } from '../../utils/safeQuery'

interface SchoolSettingsProps {
  showToast: (msg: string, type: string) => void
}

export default function SchoolSettings({ showToast }: SchoolSettingsProps) {
  const [schoolName, setSchoolName] = useState('Divine Lifting School')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [motto, setMotto] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true)
      const { data } = await safeQuery(() => supabase.from('school_settings').select('id, school_name, address, phone, email, motto, updated_at').limit(1).maybeSingle())
      if (data) {
        setSchoolName(data.school_name || 'Divine Lifting School')
        setAddress(data.address || '')
        setPhone(data.phone || '')
        setEmail(data.email || '')
        setMotto(data.motto || '')
      }
      setLoading(false)
    }
    loadSettings()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase.from('school_settings').upsert({
        id: 1,
        school_name: schoolName,
        address,
        phone,
        email,
        motto,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      if (error) throw error
      showToast('School settings saved!', 'success')
    } catch (err: any) {
      showToast('Failed to save: ' + err.message, 'error')
    }
    setSaving(false)
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading settings...</div>

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 30 }}>
      <h2 style={{ color: '#f8fafc', margin: '0 0 24px' }}>School Settings</h2>
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: 4 }}>School Name</label>
          <input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} required
            style={{ width: '100%', padding: 12, background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: 4 }}>Address</label>
          <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3}
            style={{ width: '100%', padding: 12, background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: 4 }}>Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)}
              style={{ width: '100%', padding: 12, background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: 4 }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: 12, background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: 4 }}>School Motto</label>
          <input value={motto} onChange={(e) => setMotto(e.target.value)}
            style={{ width: '100%', padding: 12, background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <button type="submit" disabled={saving}
          style={{ padding: '12px 24px', background: saving ? '#334155' : '#10b981', color: saving ? '#94a3b8' : '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '1rem' }}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  )
}
