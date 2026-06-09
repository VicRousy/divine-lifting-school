import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

const DEFAULT_SCALE = [
  { min: 80, max: 100, grade: 'A+', remark: 'Excellent', color: '#10b981' },
  { min: 70, max: 79, grade: 'A', remark: 'Very Good', color: '#34d399' },
  { min: 60, max: 69, grade: 'B', remark: 'Good', color: '#38bdf8' },
  { min: 50, max: 59, grade: 'C', remark: 'Satisfactory', color: '#f59e0b' },
  { min: 40, max: 49, grade: 'D', remark: 'Pass', color: '#fbbf24' },
  { min: 0, max: 39, grade: 'F', remark: 'Fail', color: '#ef4444' },
]

export default function GradeScale({ showToast }) {
  const [scale, setScale] = useState(DEFAULT_SCALE)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadScale = async () => {
      try {
        const { data, error } = await supabase
          .from('grade_scale')
          .select('scale')
          .eq('id', 1)
          .single()

        if (error && error.code !== 'PGRST116') throw error

        if (data?.scale) {
          setScale(data.scale)
          return
        }
      } catch {}
      const local = localStorage.getItem('dls_grade_scale')
      if (local) {
        try { setScale(JSON.parse(local)); return } catch {} 
      }
      setScale(DEFAULT_SCALE)
    }
    loadScale()
  }, [])

  const updateRow = (index, field, value) => {
    setScale((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: field === 'min' || field === 'max' ? Number(value) : value }
      return next
    })
  }

  const handleSave = async () => {
    for (const row of scale) {
      if (row.min > row.max) {
        showToast?.(`Invalid range: ${row.grade} min (${row.min}) exceeds max (${row.max})`, 'error')
        return
      }
    }
    setSaving(true)
    try {
      const { error } = await supabase
        .from('grade_scale')
        .upsert({ id: 1, scale, updated_at: new Date().toISOString() }, { onConflict: 'id' })

      if (error) throw error

      localStorage.setItem('dls_grade_scale', JSON.stringify(scale))
      showToast?.('Grade scale saved to database.', 'success')
      setEditing(null)
    } catch (err) {
      console.error('Grade scale save failed:', err)
      localStorage.setItem('dls_grade_scale', JSON.stringify(scale))
      showToast?.('Saved locally only. Database sync failed.', 'warning')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    setScale(DEFAULT_SCALE)
    localStorage.removeItem('dls_grade_scale')
    try {
      await supabase.from('grade_scale').upsert({ id: 1, scale: DEFAULT_SCALE, updated_at: new Date().toISOString() }, { onConflict: 'id' })
    } catch {}
    showToast?.('Grade scale reset to defaults.', 'success')
  }

  return (
    <div style={{ padding: 30 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <h2 style={{ margin: 0, color: '#f8fafc' }}>Grade Scale Configuration</h2>
          <div style={{ marginTop: 6, color: '#94a3b8', fontSize: '0.9rem' }}>
            Define grading boundaries and remarks
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleReset}
            style={{
              padding: '10px 16px',
              background: '#334155',
              border: '1px solid #475569',
              borderRadius: 8,
              color: '#e2e8f0',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Reset to Default
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 16px',
              background: '#10b981',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            {saving ? 'Saving...' : '💾 Save Scale'}
          </button>
        </div>
      </div>

      <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #334155', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                {['GRADE', 'MIN SCORE', 'MAX SCORE', 'REMARK', 'COLOR', 'PREVIEW'].map((h) => (
                  <th scope="col"
                    key={h}
                    style={{
                      padding: 14,
                      textAlign: 'center',
                      color: '#94a3b8',
                      fontSize: '0.8rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scale.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <td style={{ padding: 14, textAlign: 'center' }}>
                    <input
                      value={row.grade}
                      onChange={(e) => updateRow(i, 'grade', e.target.value)}
                      style={{
                        width: 60,
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: '1px solid #334155',
                        background: '#0f172a',
                        color: row.color,
                        outline: 'none',
                        textAlign: 'center',
                        fontWeight: 800,
                        fontSize: '1rem',
                      }}
                    />
                  </td>
                  <td style={{ padding: 14, textAlign: 'center' }}>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={row.min}
                      onChange={(e) => updateRow(i, 'min', e.target.value)}
                      style={{
                        width: 70,
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: '1px solid #334155',
                        background: '#0f172a',
                        color: '#e2e8f0',
                        outline: 'none',
                        textAlign: 'center',
                      }}
                    />
                  </td>
                  <td style={{ padding: 14, textAlign: 'center' }}>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={row.max}
                      onChange={(e) => updateRow(i, 'max', e.target.value)}
                      style={{
                        width: 70,
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: '1px solid #334155',
                        background: '#0f172a',
                        color: '#e2e8f0',
                        outline: 'none',
                        textAlign: 'center',
                      }}
                    />
                  </td>
                  <td style={{ padding: 14, textAlign: 'center' }}>
                    <input
                      value={row.remark}
                      onChange={(e) => updateRow(i, 'remark', e.target.value)}
                      style={{
                        width: '100%',
                        minWidth: 120,
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: '1px solid #334155',
                        background: '#0f172a',
                        color: '#e2e8f0',
                        outline: 'none',
                        textAlign: 'center',
                      }}
                    />
                  </td>
                  <td style={{ padding: 14, textAlign: 'center' }}>
                    <input
                      type="color"
                      value={row.color}
                      onChange={(e) => updateRow(i, 'color', e.target.value)}
                      style={{ width: 40, height: 36, border: 'none', cursor: 'pointer', background: 'transparent' }}
                    />
                  </td>
                  <td style={{ padding: 14, textAlign: 'center' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 14px',
                        borderRadius: 6,
                        background: row.color + '22',
                        color: row.color,
                        fontWeight: 700,
                        fontSize: '0.9rem',
                      }}
                    >
                      {row.grade} — {row.remark}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 20, padding: 16, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, color: '#34d399', fontSize: '0.85rem' }}>
        Grade scale is saved to the database and synced across all devices.
      </div>
    </div>
  )
}
