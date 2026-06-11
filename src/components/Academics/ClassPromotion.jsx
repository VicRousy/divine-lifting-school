import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { safeQuery } from '../../utils/safeQuery'

export default function ClassPromotion({ showToast }) {
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [targetClass, setTargetClass] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState({})

  useEffect(() => {
    const fetchClasses = async () => {
      const { data } = await safeQuery(() => supabase.from('classes').select('id, class_name').order('class_name'))
      setClasses(data || [])
    }
    fetchClasses()
  }, [])

  useEffect(() => {
    if (!selectedClass) {
      setStudents([])
      return
    }
    const fetchStudents = async () => {
      const { data } = await safeQuery(() => supabase
        .from('students')
        .select('id, first_name, middle_name, last_name, class_id')
        .eq('class_id', selectedClass)
        .eq('is_active', true)
        .order('last_name'))
      setStudents(data || [])
      const initial = {}
      for (const s of data || []) {
        initial[s.id] = true
      }
      setSelectedStudents(initial)
    }
    fetchStudents()
  }, [selectedClass])

  const toggleStudent = (id) => {
    setSelectedStudents((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const selectAll = () => {
    const next = {}
    for (const s of students) {
      next[s.id] = true
    }
    setSelectedStudents(next)
  }

  const deselectAll = () => {
    const next = {}
    for (const s of students) {
      next[s.id] = false
    }
    setSelectedStudents(next)
  }

  const handlePromote = async () => {
    if (!targetClass) {
      showToast?.('Select a target class first.', 'error')
      return
    }
    if (selectedClass === targetClass) {
      showToast?.('Source and target class cannot be the same.', 'error')
      return
    }

    const toPromote = students.filter((s) => selectedStudents[s.id])
    if (toPromote.length === 0) {
      showToast?.('No students selected for promotion.', 'error')
      return
    }

    setLoading(true)
    try {
      const ids = toPromote.map((s) => s.id)
      const { error } = await supabase
        .from('students')
        .update({ class_id: Number(targetClass), last_promotion_date: new Date().toISOString() })
        .in('id', ids)

      if (error) throw error

      showToast?.(`${toPromote.length} student(s) promoted successfully.`, 'success')
      setSelectedClass('')
      setTargetClass('')
      setStudents([])
    } catch (err) {
      showToast?.('Promotion failed: ' + err.message, 'error')
    }
    setLoading(false)
  }

  const selectedCount = students.filter((s) => selectedStudents[s.id]).length
  const targetClassName = classes.find((c) => String(c.id) === String(targetClass))?.class_name || ''

  return (
    <div style={{ padding: 30 }}>
      <h2 style={{ margin: '0 0 20px', color: '#f8fafc' }}>Class Promotion</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
        <div>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: 6 }}>CURRENT CLASS</div>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            style={{ width: '100%', padding: 12, background: '#1e293b', border: '1px solid #334155', borderRadius: 10, color: '#e2e8f0', outline: 'none' }}
          >
            <option value="">Select source class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.class_name}</option>
            ))}
          </select>
        </div>
        <div>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: 6 }}>PROMOTE TO</div>
          <select
            value={targetClass}
            onChange={(e) => setTargetClass(e.target.value)}
            style={{ width: '100%', padding: 12, background: '#1e293b', border: '1px solid #334155', borderRadius: 10, color: '#e2e8f0', outline: 'none' }}
          >
            <option value="">Select target class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.class_name}</option>
            ))}
          </select>
        </div>
      </div>

      {targetClass && selectedClass && (
        <div style={{ marginBottom: 14, padding: 12, background: 'rgba(56,189,248,0.1)', border: '1px solid #38bdf8', borderRadius: 10, color: '#38bdf8', fontWeight: 600 }}>
          Promoting {selectedCount} student(s) to {targetClassName}
        </div>
      )}

      {selectedClass && students.length > 0 ? (
        <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #334155', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '10px 20px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{students.length} student(s) in class</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={selectAll} style={{ padding: '6px 12px', background: '#334155', border: 'none', borderRadius: 6, color: '#e2e8f0', cursor: 'pointer', fontSize: '0.8rem' }}>Select All</button>
              <button onClick={deselectAll} style={{ padding: '6px 12px', background: '#334155', border: 'none', borderRadius: 6, color: '#e2e8f0', cursor: 'pointer', fontSize: '0.8rem' }}>Deselect All</button>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155' }}>
                  <th scope="col" style={{ padding: 14, textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', width: 60 }}>SELECT</th>
                  <th scope="col" style={{ padding: 14, textAlign: 'left', color: '#94a3b8', fontSize: '0.8rem' }}>STUDENT NAME</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <td style={{ padding: 14, textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={!!selectedStudents[s.id]}
                        onChange={() => toggleStudent(s.id)}
                        style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#38bdf8' }}
                      />
                    </td>
                    <td style={{ padding: 14, color: '#e2e8f0', fontWeight: 600 }}>
                      {s.first_name} {s.middle_name ? `${s.middle_name} ` : ''}{s.last_name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : selectedClass ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', border: '1px dashed #334155', borderRadius: 14 }}>
          No active students found in this class.
        </div>
      ) : (
        <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', border: '1px dashed #334155', borderRadius: 14 }}>
          Select a source class to view students.
        </div>
      )}

      <button
        onClick={handlePromote}
        disabled={loading || !targetClass || selectedCount === 0}
        style={{
          marginTop: 20,
          padding: '12px 24px',
          background: loading || !targetClass || selectedCount === 0 ? '#334155' : '#10b981',
          color: loading || !targetClass || selectedCount === 0 ? '#94a3b8' : '#fff',
          border: 'none',
          borderRadius: 10,
          fontWeight: 700,
          cursor: loading || !targetClass || selectedCount === 0 ? 'not-allowed' : 'pointer',
          fontSize: '1rem',
        }}
      >
        {loading ? 'Promoting...' : `🎓 Promote ${selectedCount} Student(s)`}
      </button>
    </div>
  )
}
