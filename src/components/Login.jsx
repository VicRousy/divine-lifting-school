import { useState } from 'react'
import { supabase } from '../supabaseClient'

function Login({ portal, onLogin, onBack }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const portalConfig = {
    admin: {
      title: 'ADMINISTRATOR PORTAL',
      subtitle: 'School Management System',
      emailPlaceholder: 'Admin Email Address',
      color: '#38bdf8'
    },
    teacher: {
      title: 'TEACHER PORTAL',
      subtitle: 'Staff Access Portal',
      emailPlaceholder: 'Teacher Email Address',
      color: '#a855f7'
    },
    student: {
      title: 'STUDENT PORTAL',
      subtitle: 'Student Access Portal',
      emailPlaceholder: 'Student Email Address',
      color: '#10b981'
    },
    parent: {
      title: 'PARENT PORTAL',
      subtitle: 'Parent Access Portal',
      emailPlaceholder: 'Parent Email Address',
      color: '#f59e0b'
    }
  }

  const config = portalConfig[portal] || portalConfig.admin

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

    if (portal === 'admin') {
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
    }

    if (portal === 'teacher') {
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
    }

    if (portal === 'student') {
      const { data: student } = await supabase
        .from('students')
        .select('id, first_name, middle_name, last_name, student_id')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle()

      if (student) {
        onLogin('student', {
          id: student.id,
          name: `${student.first_name} ${student.last_name}`,
          studentId: student.student_id
        })
        setLoading(false)
        return
      }
    }

    if (portal === 'parent') {
      const { data: parent } = await supabase
        .from('parents')
        .select('id, first_name, last_name, parent_id')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle()

      if (parent) {
        onLogin('parent', {
          id: parent.id,
          name: `${parent.first_name} ${parent.last_name}`,
          parentId: parent.parent_id
        })
        setLoading(false)
        return
      }
    }

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

    setError('Access Denied: No account found for this portal.')
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
        <button
          onClick={onBack}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '0.9rem',
            marginBottom: '10px',
            padding: '5px 0'
          }}
        >
          Back to Portals
        </button>

        <h2 style={{
          textAlign: 'center',
          marginTop: 0,
          background: `linear-gradient(135deg, ${config.color} 0%, ${config.color}88 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {config.title}
        </h2>
        <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '30px' }}>
          {config.subtitle}
        </p>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder={config.emailPlaceholder}
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
              background: loading ? '#64748b' : `linear-gradient(135deg, ${config.color} 0%, ${config.color}88 100%)`,
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
