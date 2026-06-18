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
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <div style={{
        background: 'rgba(30, 41, 59, 0.95)',
        borderRadius: '16px',
        padding: '30px',
        border: '1px solid #334155',
      }}>
        <h2 style={{ margin: '0 0 8px', color: '#f8fafc', fontSize: '1.5rem' }}>School Settings</h2>
        <p style={{ margin: '0 0 24px', color: '#94a3b8', fontSize: '0.9rem' }}>Configure your school's basic information</p>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.5)',
            borderRadius: 12,
            padding: 24,
            border: '1px solid #1e293b',
          }}>
            <h3 style={{ margin: '0 0 16px', color: '#38bdf8', fontSize: '1rem' }}>General Information</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: 6, fontWeight: 600 }}>School Name</label>
                <input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} required
                  style={{ width: '100%', padding: '12px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', outline: 'none', boxSizing: 'border-box', fontSize: '0.95rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: 6, fontWeight: 600 }}>School Motto</label>
                <input value={motto} onChange={(e) => setMotto(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', outline: 'none', boxSizing: 'border-box', fontSize: '0.95rem' }} />
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(15, 23, 42, 0.5)',
            borderRadius: 12,
            padding: 24,
            border: '1px solid #1e293b',
          }}>
            <h3 style={{ margin: '0 0 16px', color: '#38bdf8', fontSize: '1rem' }}>Contact Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: 6, fontWeight: 600 }}>Phone Number</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', outline: 'none', boxSizing: 'border-box', fontSize: '0.95rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: 6, fontWeight: 600 }}>Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', outline: 'none', boxSizing: 'border-box', fontSize: '0.95rem' }} />
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(15, 23, 42, 0.5)',
            borderRadius: 12,
            padding: 24,
            border: '1px solid #1e293b',
          }}>
            <h3 style={{ margin: '0 0 16px', color: '#38bdf8', fontSize: '1rem' }}>Location</h3>
            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: 6, fontWeight: 600 }}>School Address</label>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3}
                style={{ width: '100%', padding: '12px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontSize: '0.95rem' }} />
            </div>
          </div>

          <button type="submit" disabled={saving}
            style={{ padding: '14px 24px', background: saving ? '#334155' : '#10b981', color: saving ? '#94a3b8' : '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '1rem', alignSelf: 'flex-start' }}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  )
}
