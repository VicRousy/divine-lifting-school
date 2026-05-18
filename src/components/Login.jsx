import { useState } from 'react'
import { supabase } from '../supabaseClient'

function Login({ onLogin }) {
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Check teachers table first
      const { data: teacher, error: tError } = await supabase
        .from('teachers')
        .select('id, first_name, middle_name, last_name, staff_id, password')
        .eq('staff_id', loginId.trim())
        .maybeSingle()

      if (!tError && teacher && teacher.password === password) {
        // Fetch role from user_roles
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('reference_id', teacher.id)
          .eq('role', 'teacher')
          .maybeSingle()

        onLogin('teacher', { id: teacher.id, name: `${teacher.first_name} ${teacher.last_name}`, staffId: teacher.staff_id })
        setLoading(false)
        return
      }

      // Check admins table
      const { data: admin, error: aError } = await supabase
        .from('admins')
        .select('id, first_name, last_name, admin_id, password')
        .eq('admin_id', loginId.trim())
        .maybeSingle()

      if (!aError && admin && admin.password === password) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('reference_id', admin.id)
          .eq('role', 'admin')
          .maybeSingle()

        onLogin('admin', { id: admin.id, name: `${admin.first_name} ${admin.last_name}`, adminId: admin.admin_id })
        setLoading(false)
        return
      }

      // Check profiles table as fallback
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, login_id, password, role')
        .eq('login_id', loginId.trim())
        .maybeSingle()

      if (profile && profile.password === password) {
        onLogin(profile.role || 'teacher', { id: profile.id, name: `${profile.first_name} ${profile.last_name}`, loginId: profile.login_id })
        setLoading(false)
        return
      }

      setError('Invalid Login ID or password.')
    } catch (err) {
      console.error('Login error:', err)
      setError('Connection error. Please try again.')
    }

    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'
    }}>
      <div style={{
        background: 'rgba(30, 41, 59, 0.8)',
        padding: '40px',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.1)',
        width: '400px',
        backdropFilter: 'blur(10px)'
      }}>
        <h2 style={{
          textAlign: 'center',
          marginTop: 0,
          background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          DIVINE LIFTING SCHOOL
        </h2>
        <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '30px' }}>
          Management System Portal
        </p>

        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Login ID (e.g. ADMIN-001 or TCH-001)"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '15px',
              borderRadius: '8px',
              border: '1px solid #334155',
              background: '#0f172a',
              color: 'white',
              boxSizing: 'border-box'
            }}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '20px',
              borderRadius: '8px',
              border: '1px solid #334155',
              background: '#0f172a',
              color: 'white',
              boxSizing: 'border-box'
            }}
          />

          {error && (
            <p style={{
              color: '#ef4444',
              fontSize: '0.85rem',
              marginBottom: '15px',
              textAlign: 'center',
              background: 'rgba(239, 68, 68, 0.1)',
              padding: '8px',
              borderRadius: '5px'
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#64748b' : 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
              color: loading ? '#cbd5e1' : '#020617',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              transition: 'transform 0.2s ease'
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
