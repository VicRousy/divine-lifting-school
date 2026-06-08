import { useState } from 'react'
import { supabase } from '../../supabaseClient'
import bcrypt from 'bcryptjs'

const ROLES = [
  { key: 'student', label: 'Student', table: 'students', idField: 'id', searchFields: ['first_name', 'last_name', 'student_id', 'login_id'], nameField: ['first_name', 'last_name'] },
  { key: 'teacher', label: 'Teacher', table: 'teachers', idField: 'id', searchFields: ['first_name', 'last_name', 'staff_id', 'login_id'], nameField: ['first_name', 'last_name'] },
  { key: 'parent', label: 'Parent', table: 'parents', idField: 'id', searchFields: ['first_name', 'last_name', 'parent_id', 'login_id'], nameField: ['first_name', 'last_name'] },
  { key: 'admin', label: 'Admin', table: 'profiles', idField: 'id', searchFields: ['first_name', 'last_name', 'login_id'], nameField: ['first_name', 'last_name'] },
]

function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
  let pw = ''
  for (let i = 0; i < 12; i++) pw += chars.charAt(Math.floor(Math.random() * chars.length))
  return pw
}

export default function ResetPassword({ showToast }) {
  const [role, setRole] = useState(ROLES[0])
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [resetResult, setResetResult] = useState(null)

  const handleSearch = async () => {
    if (!search.trim()) return
    setLoading(true)
    setResetResult(null)

    try {
      const conditions = role.searchFields.map(f => `${f}.ilike.%${search.trim()}%`).join(',')
      const { data, error } = await supabase
        .from(role.table)
        .select('*')
        .or(conditions)

      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      showToast('Search failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (user) => {
    const tempPassword = generateTempPassword()
    setLoading(true)

    try {
      const hashed = await bcrypt.hash(tempPassword, 10)
      const updateData = { password: hashed }
      if (role.table === 'profiles' || role.table === 'teachers') {
        updateData.is_first_login = true
      }
      const { error } = await supabase
        .from(role.table)
        .update(updateData)
        .eq(role.idField, user.id)

      if (error) throw error

      const name = role.nameField.map(f => user[f]).filter(Boolean).join(' ')
      setResetResult({ name, loginId: user.login_id || user.school_id || user.student_id || user.staff_id || user.parent_id || user.id, tempPassword })
      setUsers([])
      setSearch('')
    } catch (err) {
      showToast('Failed to reset password', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 style={{ color: '#f8fafc', margin: '0 0 8px', fontSize: '1.5rem' }}>Reset Password</h2>
      <p style={{ color: '#94a3b8', marginBottom: '24px' }}>Search for a user and generate a temporary password.</p>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'end' }}>
        <div>
          <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px' }}>Role</label>
          <select value={role.key} onChange={(e) => { setRole(ROLES.find(r => r.key === e.target.value)); setUsers([]); setResetResult(null) }}
            style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#f8fafc', fontSize: '0.9rem' }}>
            {ROLES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px' }}>Search Name or ID</label>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="e.g. John or STU-001" style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#f8fafc', fontSize: '0.9rem', boxSizing: 'border-box' }} />
        </div>
        <button onClick={handleSearch} disabled={loading || !search.trim()}
          style={{ padding: '10px 20px', background: loading ? '#64748b' : '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {users.length > 0 && (
        <div style={{ background: '#1e293b', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#334155' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#94a3b8', fontSize: '0.85rem' }}>Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#94a3b8', fontSize: '0.85rem' }}>Login ID</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#94a3b8', fontSize: '0.85rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const name = role.nameField.map(f => user[f]).filter(Boolean).join(' ')
                const loginId = user.login_id || user.school_id || user.student_id || user.staff_id || user.parent_id || user.id
                return (
                  <tr key={user.id} style={{ borderTop: '1px solid #334155' }}>
                    <td style={{ padding: '12px 16px', color: '#f8fafc' }}>{name}</td>
                    <td style={{ padding: '12px 16px', color: '#94a3b8', fontFamily: 'monospace' }}>{loginId}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => handleReset(user)} disabled={loading}
                        style={{ padding: '6px 14px', background: '#f59e0b', color: '#0f172a', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
                        Reset Password
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {resetResult && (
        <div style={{ marginTop: '24px', padding: '20px', background: '#1e293b', borderRadius: '8px', border: '1px solid #f59e0b' }}>
          <h3 style={{ color: '#fbbf24', margin: '0 0 12px', fontSize: '1rem' }}>Password Reset Successful</h3>
          <div style={{ color: '#f8fafc', marginBottom: '8px' }}><strong>{resetResult.name}</strong></div>
          <div style={{ color: '#94a3b8', marginBottom: '12px' }}>Login ID: <span style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{resetResult.loginId}</span></div>
          <div style={{ padding: '12px', background: '#0f172a', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px' }}>Temporary Password</div>
            <div style={{ fontSize: '1.3rem', fontFamily: 'monospace', fontWeight: 'bold', color: '#fbbf24', letterSpacing: '2px' }}>{resetResult.tempPassword}</div>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '12px' }}>Share this password with the user. {role.table === 'profiles' || role.table === 'teachers' ? 'They\'ll be forced to set a new password on next login.' : 'They can change it anytime from their portal.'}</p>
        </div>
      )}

      {!loading && users.length === 0 && search && !resetResult && (
        <p style={{ color: '#64748b' }}>No {role.label.toLowerCase()} found matching "{search}"</p>
      )}
    </div>
  )
}
