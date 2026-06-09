import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

export default function SchoolSettings({ showToast }) {
  const [activeTab, setActiveTab] = useState('general')
  const [schoolName, setSchoolName] = useState('Divine Lifting School')
  const [schoolEmail, setSchoolEmail] = useState('')
  const [schoolPhone, setSchoolPhone] = useState('')
  const [schoolAddress, setSchoolAddress] = useState('')
  const [currentYear, setCurrentYear] = useState('2026/2027')
  const [terms, setTerms] = useState([])
  const [newTermName, setNewTermName] = useState('')
  const [newTermYear, setNewTermYear] = useState('2026/2027')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const { data: termData } = await supabase.from('terms').select('*').order('id', { ascending: true })
      setTerms(termData || [])
    } catch (err) {
      console.error('Failed to fetch settings:', err)
    }
  }

  const saveGeneralSettings = async () => {
    setSaving(true)
    try {
      localStorage.setItem('dls_school_name', schoolName)
      localStorage.setItem('dls_school_email', schoolEmail)
      localStorage.setItem('dls_school_phone', schoolPhone)
      localStorage.setItem('dls_school_address', schoolAddress)
      localStorage.setItem('dls_current_year', currentYear)
      showToast?.('General settings saved!', 'success')
    } catch (err) {
      showToast?.('Failed to save settings', 'error')
    }
    setSaving(false)
  }

  const addTerm = async () => {
    if (!newTermName || !newTermYear) {
      showToast?.('Please fill in term name and academic year', 'error')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.from('terms').insert({
        name: newTermName,
        academic_year: newTermYear,
        is_active: false,
      })

      if (error) throw error

      showToast?.('Term added successfully!', 'success')
      setNewTermName('')
      fetchSettings()
    } catch (err) {
      showToast?.('Failed to add term: ' + err.message, 'error')
    }
    setSaving(false)
  }

  const toggleTermActive = async (termId, isActive) => {
    try {
      const { error } = await supabase.from('terms').update({ is_active: !isActive }).eq('id', termId)
      if (error) throw error
      showToast?.('Term status updated!', 'success')
      fetchSettings()
    } catch (err) {
      showToast?.('Failed to update term', 'error')
    }
  }

  const deleteTerm = async (termId) => {
    try {
      const { error } = await supabase.from('terms').delete().eq('id', termId)
      if (error) throw error
      showToast?.('Term deleted', 'success')
      fetchSettings()
    } catch (err) {
      showToast?.('Failed to delete term', 'error')
    }
  }

  return (
    <div style={{ padding: 30 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, color: '#f8fafc' }}>School Settings</h2>
          <p style={{ margin: '5px 0 0', color: '#94a3b8' }}>Configure school information and academic terms</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {[
          { key: 'general', label: 'General Info' },
          { key: 'terms', label: 'Academic Terms' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 16px',
              background: activeTab === tab.key ? '#38bdf8' : '#1e293b',
              color: activeTab === tab.key ? '#0f172a' : '#94a3b8',
              border: '1px solid #334155',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #334155', borderRadius: 14, padding: 24 }}>
          <h3 style={{ margin: '0 0 20px', color: '#f8fafc' }}>General Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>School Name</label>
              <input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} style={{ width: '100%', padding: 12, background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#e2e8f0', outline: 'none' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>School Email</label>
                <input type="email" value={schoolEmail} onChange={(e) => setSchoolEmail(e.target.value)} style={{ width: '100%', padding: 12, background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#e2e8f0', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>School Phone</label>
                <input value={schoolPhone} onChange={(e) => setSchoolPhone(e.target.value)} style={{ width: '100%', padding: 12, background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#e2e8f0', outline: 'none' }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>School Address</label>
              <textarea value={schoolAddress} onChange={(e) => setSchoolAddress(e.target.value)} rows={3} style={{ width: '100%', padding: 12, background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#e2e8f0', outline: 'none', resize: 'vertical' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>Current Academic Year</label>
              <input value={currentYear} onChange={(e) => setCurrentYear(e.target.value)} style={{ width: '100%', padding: 12, background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#e2e8f0', outline: 'none' }} />
            </div>
            <button onClick={saveGeneralSettings} disabled={saving} style={{ padding: '12px 24px', background: saving ? '#334155' : '#10b981', color: saving ? '#94a3b8' : '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '1rem' }}>
              {saving ? 'Saving...' : '💾 Save Settings'}
            </button>
          </div>
        </div>
      )}

      {/* Terms Management */}
      {activeTab === 'terms' && (
        <div>
          <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #334155', borderRadius: 14, padding: 24, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 20px', color: '#f8fafc' }}>Add New Term</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 16, alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>Term Name</label>
                <input value={newTermName} onChange={(e) => setNewTermName(e.target.value)} placeholder="e.g., First Term" style={{ width: '100%', padding: 12, background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#e2e8f0', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>Academic Year</label>
                <input value={newTermYear} onChange={(e) => setNewTermYear(e.target.value)} placeholder="e.g., 2026/2027" style={{ width: '100%', padding: 12, background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#e2e8f0', outline: 'none' }} />
              </div>
              <button onClick={addTerm} disabled={saving} style={{ padding: '12px 20px', background: saving ? '#334155' : '#38bdf8', color: saving ? '#94a3b8' : '#0f172a', border: 'none', borderRadius: 10, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Adding...' : '➕ Add Term'}
              </button>
            </div>
          </div>

          <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #334155', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #334155', color: '#94a3b8', fontSize: '0.85rem' }}>
              {terms.length} term(s) configured
            </div>
            {terms.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No terms configured yet.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #334155' }}>
                    {['TERM NAME', 'ACADEMIC YEAR', 'STATUS', 'ACTIONS'].map((h) => (
                      <th scope="col" key={h} style={{ padding: 14, textAlign: h === 'TERM NAME' ? 'left' : 'center', color: '#94a3b8', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {terms.map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <td style={{ padding: 14, color: '#e2e8f0', fontWeight: 600 }}>{t.name || `Term ${t.id}`}</td>
                      <td style={{ padding: 14, textAlign: 'center', color: '#94a3b8' }}>{t.academic_year}</td>
                      <td style={{ padding: 14, textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600,
                          background: t.is_active ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.15)',
                          color: t.is_active ? '#10b981' : '#64748b',
                        }}>
                          {t.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: 14, textAlign: 'center', display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <button onClick={() => toggleTermActive(t.id, t.is_active)} style={{ padding: '6px 12px', background: t.is_active ? '#f59e0b' : '#10b981', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>
                          {t.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => deleteTerm(t.id)} style={{ padding: '6px 12px', background: '#ef4444', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
