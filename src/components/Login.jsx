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

    const input = loginId.trim().toUpperCase()

    try {
      // 1. Check Admins (Profiles)
      const { data: admin } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, school_id, role, login_id, password')
        .eq('login_id', input)
        .maybeSingle()

      if (admin && admin.password === password) {
        onLogin('admin', { id: admin.id, name: `${admin.first_name} ${admin.last_name}`, schoolId: admin.school_id })
        setLoading(false)
        return
      }

      // 2. Check Teachers
      const { data: teacher } = await supabase
        .from('teachers')
        .select('id, first_name, last_name, staff_id, login_id, password')
        .eq('login_id', input)
        .maybeSingle()

      if (teacher && teacher.password === password) {
        onLogin('teacher', { id: teacher.id, name: `${teacher.first_name} ${teacher.last_name}`, staffId: teacher.staff_id })
        setLoading(false)
        return
      }

      // 3. Check Students
      const { data: student } = await supabase
        .from('students')
        .select('id, first_name, last_name, student_id, login_id, password')
        .eq('login_id', input)
        .maybeSingle()

      if (student && student.password === password) {
        onLogin('student', { id: student.id, name: `${student.first_name} ${student.last_name}`, studentId: student.student_id })
        setLoading(false)
        return
      }

      // 4. Check Parents
      const { data: parent } = await supabase
        .from('parents')
        .select('id, first_name, last_name, parent_id, login_id, password')
        .eq('login_id', input)
        .maybeSingle()

      if (parent && parent.password === password) {
        onLogin('parent', { id: parent.id, name: `${parent.first_name} ${parent.last_name}`, parentId: parent.parent_id })
        setLoading(false)
        return
      }

      setError('Invalid Login ID or Password.')
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
            placeholder="Login ID (e.g. TCH-001, STU-001)"
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
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
