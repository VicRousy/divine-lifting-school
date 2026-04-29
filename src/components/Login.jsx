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

    // 1. Authenticate with Supabase Auth
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      setError(authError.message === 'Invalid login credentials' 
        ? "Incorrect email or password." 
        : authError.message)
      setLoading(false)
      return
    }

    // 2. Fetch user role from your 'user_roles' table
    // We use .maybeSingle() to handle cases where the role record might be missing
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role, reference_id')
      .eq('user_id', data.user.id)
      .maybeSingle()

    if (roleError) {
      console.error("Role fetch error:", roleError)
      setError("Database connection error. Please try again.")
    } else if (roleData) {
      // Success: Pass role and user object back to App.jsx
      onLogin(roleData.role, data.user)
    } else {
      // Security check: Auth worked, but no role assigned in our table
      setError('Access Denied: No school role assigned to this account.')
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
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login