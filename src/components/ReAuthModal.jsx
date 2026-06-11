import { useState } from 'react'
import { supabase } from '../supabaseClient'
import bcrypt from 'bcryptjs'

export default function ReAuthModal({ userRole, userInfo, targetRole, onVerified, onClose }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // Strategy 1: Lookup by login_id (stable across portal switches)
      if (userInfo?.loginId) {
        const tables = ['profiles', 'teachers', 'students', 'parents']
        for (const table of tables) {
          const { data, error: dbErr } = await supabase
            .from(table)
            .select('password')
            .eq('login_id', userInfo.loginId)
            .maybeSingle()
          if (!dbErr && data) {
            const valid = data.password === password || await bcrypt.compare(password, data.password)
            if (valid) {
              onVerified()
              setLoading(false)
              return
            }
          }
        }
      }

      // Strategy 2: Lookup by auth_id from current session
      const { data: { session: authSession } } = await supabase.auth.getSession()
      const authId = authSession?.user?.id
      if (authId) {
        const tables = ['profiles', 'teachers', 'students', 'parents']
        for (const table of tables) {
          const { data, error: dbErr } = await supabase
            .from(table)
            .select('password')
            .eq('auth_id', authId)
            .maybeSingle()
          if (!dbErr && data) {
            const valid = data.password === password || await bcrypt.compare(password, data.password)
            if (valid) {
              onVerified()
              setLoading(false)
              return
            }
          }
        }
      }

      // Strategy 3: Legacy fallback by id
      const TABLE_MAP = { admin: 'profiles', teacher: 'teachers', student: 'students', parent: 'parents' }
      const table = TABLE_MAP[userRole]
      if (table && userInfo?.id) {
        const { data, error: dbError } = await supabase
          .from(table)
          .select('password')
          .eq('id', userInfo.id)
          .maybeSingle()
        if (!dbError && data) {
          const valid = data.password === password || await bcrypt.compare(password, data.password)
          if (valid) {
            onVerified()
            setLoading(false)
            return
          }
        }
      }

      setError('Could not verify password')
    } catch (err) {
      setError(err.message || 'Could not verify password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div onKeyDown={(e) => { if (e.key === 'Escape') onClose() }} tabIndex={-1} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: '#1e293b', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '380px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <h2 style={{ color: '#f8fafc', margin: '0 0 8px', fontSize: '1.15rem' }}>Re-authentication Required</h2>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 20px' }}>Enter your password to switch to <strong style={{ color: '#38bdf8' }}>{targetRole}</strong> portal</p>
        <form onSubmit={handleVerify}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.875rem', marginBottom: '6px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoFocus style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#f8fafc', fontSize: '0.9rem', boxSizing: 'border-box' }} />
              <span onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: 10, cursor: 'pointer', color: '#64748b', fontSize: '0.85rem', userSelect: 'none' }}>{showPw ? 'Hide' : 'Show'}</span>
            </div>
          </div>
          {error && <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: '0 0 12px' }}>{error}</p>}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', background: '#475569', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: '10px', background: loading ? '#64748b' : '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>{loading ? 'Verifying...' : 'Verify'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
