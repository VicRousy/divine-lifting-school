import { useState } from 'react'
import { supabase } from '../supabaseClient'

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    })

    if (authError) {
      setError(authError.message === 'Invalid login credentials'
        ? 'Incorrect email or password.'
        : authError.message)
      setLoading(false)
      return
    }

    const userId = authData.user.id

    // Check profiles table for admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, first_name, middle_name, last_name, school_id, role')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle()

    if (profile && profile.role === 'admin') {
      onLogin('admin', {
        id: profile.id,
        name: `${profile.first_name} ${profile.last_name}`,
        schoolId: profile.school_id
      })
      setLoading(false)
      return
    }

    // Check teachers table
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id, first_name, middle_name, last_name, staff_id')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle()

    if (teacher) {
      onLogin('teacher', {
        id: teacher.id,
        name: `${teacher.first_name} ${teacher.last_name}`,
        staffId: teacher.staff_id
      })
      setLoading(false)
      return
    }

    // Fallback: check user_roles
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle()

    if (roleData) {
      onLogin(roleData.role, { id: userId, name: email })
      setLoading(false)
      return
    }

    setError('Access Denied: No school role assigned to this account.')
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
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
