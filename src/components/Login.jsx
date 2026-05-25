import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { sendVerificationEmail } from '../services/emailService'

const MASTER_ACCESS_KEY = 'DLS-MASTER-2026'

function Login({ onLogin }) {
  const [isSignup, setIsSignup] = useState(false)
  const [step, setStep] = useState('form') // 'form' | 'verify' | 'success'
  
  // Login State
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  
  // Signup State
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [masterKey, setMasterKey] = useState('')
  
  // Verification State
  const [verificationCode, setVerificationCode] = useState('')
  const [pendingLoginId, setPendingLoginId] = useState('')
  
  // First Login State
  const [firstLoginUser, setFirstLoginUser] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const input = loginId.trim().toUpperCase()

    try {
      // Check profiles (Admin)
      const { data: admin } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, school_id, role, login_id, password, is_verified')
        .eq('login_id', input)
        .maybeSingle()

      if (admin && admin.password === password) {
        onLogin('admin', { id: admin.id, name: `${admin.first_name} ${admin.last_name}`, schoolId: admin.school_id })
        setLoading(false)
        return
      }

      // Check teachers
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

      // Check students
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

      // Check parents
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
      setLoading(false)
    } catch (err) {
      console.error('Login error:', err)
      setError('Connection error. Please try again.')
      setLoading(false)
    }
  }
          }
        }
      }

      if (!userRecord || !userRecord.email) {
        setError('Invalid Login ID. Please ensure your account is fully set up.')
        setLoading(false)
        return
      }

      // Use Supabase Auth to sign in
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: userRecord.email,
        password: password,
      })

      if (authError) throw authError

      // Success! Call onLogin with original format
      if (userRole === 'admin') {
        onLogin('admin', { id: userRecord.id, name: `${userRecord.first_name} ${userRecord.last_name}`, schoolId: userRecord.school_id })
      } else if (userRole === 'teacher') {
        onLogin('teacher', { id: userRecord.id, name: `${userRecord.first_name} ${userRecord.last_name}`, staffId: userRecord.staff_id })
      } else if (userRole === 'student') {
        onLogin('student', { id: userRecord.id, name: `${userRecord.first_name} ${userRecord.last_name}`, studentId: userRecord.student_id })
      } else if (userRole === 'parent') {
        onLogin('parent', { id: userRecord.id, name: `${userRecord.first_name} ${userRecord.last_name}`, parentId: userRecord.parent_id })
      }
      
      setLoading(false)
    } catch (err) {
      console.error('Login error:', err)
      setError('Invalid Login ID or Password. (Note: You may need to re-register to enable secure login)')
      setLoading(false)
    }
  }

  const handleSignupSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (masterKey !== MASTER_ACCESS_KEY) {
      setError('Invalid Master Access Key. Contact system administrator.')
      setLoading(false)
      return
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const newLoginId = 'ADM-' + Math.floor(1000 + Math.random() * 9000)

    try {
      // 1. Sign up in Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: signupPassword,
      })

      if (signUpError) throw signUpError
      
      const userId = authData.user?.id

      // 2. Create the profile in our profiles table
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          first_name: firstName,
          middle_name: middleName || '-',
          last_name: lastName,
          email: email.trim().toLowerCase(),
          login_id: newLoginId,
          role: 'admin',
          verification_code: code,
          is_verified: false,
          created_at: new Date().toISOString()
        }])

      if (insertError) throw insertError

      await sendVerificationEmail(email.trim().toLowerCase(), code, newLoginId)

      setPendingLoginId(newLoginId)
      setStep('verify')
    } catch (err) {
      console.error('Signup error:', err)
      setError('Failed to create account: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error: verifyError } = await supabase
        .from('profiles')
        .select('id, verification_code')
        .eq('login_id', pendingLoginId)
        .maybeSingle()

      if (verifyError || !data) throw new Error('Account not found')
      if (data.verification_code !== verificationCode) {
        setError('Invalid verification code. Please try again.')
        setLoading(false)
        return
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_verified: true, verified_at: new Date().toISOString(), verification_code: null })
        .eq('login_id', pendingLoginId)

      if (updateError) throw updateError

      setStep('success')
    } catch (err) {
      console.error('Verification error:', err)
      setError('Verification failed: ' + err.message)
    }

    setLoading(false)
  }

  const handleSetNewPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      setLoading(false)
      return
    }

    try {
      const table = firstLoginUser.role === 'teacher' ? 'teachers' : 'profiles'
      const { error: updateError } = await supabase
        .from(table)
        .update({ password: newPassword, is_first_login: false })
        .eq('id', firstLoginUser.id)

      if (updateError) throw updateError

      onLogin(firstLoginUser.role, {
        id: firstLoginUser.id,
        name: `${firstLoginUser.first_name} ${firstLoginUser.last_name}`,
        staffId: firstLoginUser.staff_id
      })
    } catch (err) {
      console.error('Password update error:', err)
      setError('Failed to update password: ' + err.message)
    }

    setLoading(false)
  }

  const resetToLogin = () => {
    setIsSignup(false)
    setStep('form')
    setFirstName('')
    setMiddleName('')
    setLastName('')
    setEmail('')
    setSignupPassword('')
    setMasterKey('')
    setVerificationCode('')
    setPendingLoginId('')
    setError('')
  }

  const inputStyle = {
    width: '100%',
    padding: '12px',
    marginBottom: '15px',
    borderRadius: '8px',
    border: '1px solid #334155',
    background: '#0f172a',
    color: 'white',
    boxSizing: 'border-box'
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
        width: '420px',
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
          {step === 'success' ? 'Account Verified!' : isSignup ? 'Register New Administrator' : 'Management System Portal'}
        </p>

        {/* LOGIN FORM */}
        {!isSignup && step === 'form' && (
          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Login ID (e.g. ADM-001, TCH-001)"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              required
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
            />
            {error && (
              <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '15px', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '5px' }}>{error}</p>
            )}
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', background: loading ? '#64748b' : 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)', color: loading ? '#cbd5e1' : '#020617', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1rem' }}>
              {loading ? 'Authenticating...' : 'Login'}
            </button>
            <div onClick={() => { setIsSignup(true); setError('') }} style={{ marginTop: '20px', textAlign: 'center', color: '#38bdf8', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 600 }}>
              Sign Up for Admin Access →
            </div>
          </form>
        )}

        {/* SIGNUP FORM */}
        {isSignup && step === 'form' && (
          <form onSubmit={handleSignupSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '15px' }}>
              <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required style={inputStyle} />
              <input type="text" placeholder="Middle Name" value={middleName} onChange={(e) => setMiddleName(e.target.value)} style={inputStyle} />
              <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} required style={inputStyle} />
            </div>
            <input type="email" placeholder="Gmail Address" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
            <input type="password" placeholder="Create Password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required style={inputStyle} />
            <input type="password" placeholder="Master Access Key" value={masterKey} onChange={(e) => setMasterKey(e.target.value)} required style={inputStyle} />
            {error && (
              <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '15px', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '5px' }}>{error}</p>
            )}
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', background: loading ? '#64748b' : 'linear-gradient(135deg, #10b981 0%, #38bdf8 100%)', color: loading ? '#cbd5e1' : '#020617', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1rem' }}>
              {loading ? 'Sending Code...' : 'Create Admin Account'}
            </button>
            <div onClick={() => { setIsSignup(false); setError('') }} style={{ marginTop: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 600 }}>
              ← Back to Login
            </div>
          </form>
        )}

        {/* VERIFICATION FORM */}
        {isSignup && step === 'verify' && (
          <form onSubmit={handleVerifyCode}>
            <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '20px', fontSize: '0.9rem' }}>
              We sent a 6-digit code to <strong style={{ color: '#38bdf8' }}>{email}</strong>
            </p>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              maxLength={6}
              style={{ width: '100%', padding: '14px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: 'white', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '8px', boxSizing: 'border-box' }}
            />
            {error && (
              <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '15px', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '5px' }}>{error}</p>
            )}
            <button type="submit" disabled={loading || verificationCode.length !== 6} style={{ width: '100%', padding: '14px', background: loading || verificationCode.length !== 6 ? '#64748b' : 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)', color: loading || verificationCode.length !== 6 ? '#cbd5e1' : '#020617', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: loading || verificationCode.length !== 6 ? 'not-allowed' : 'pointer', fontSize: '1rem' }}>
              {loading ? 'Verifying...' : 'Verify & Activate'}
            </button>
            <div onClick={() => { setStep('form'); setError('') }} style={{ marginTop: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 600 }}>
              ← Back to Form
            </div>
          </form>
        )}

        {/* SET NEW PASSWORD SCREEN */}
        {firstLoginUser && (
          <form onSubmit={handleSetNewPassword}>
            <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '20px', fontSize: '0.9rem' }}>
              Welcome <strong style={{ color: '#38bdf8' }}>{firstLoginUser.first_name}</strong>! Please set your new password.
            </p>
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={inputStyle}
            />
            {error && (
              <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '15px', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '5px' }}>{error}</p>
            )}
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', background: loading ? '#64748b' : 'linear-gradient(135deg, #10b981 0%, #38bdf8 100%)', color: loading ? '#cbd5e1' : '#020617', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1rem' }}>
              {loading ? 'Updating...' : 'Set Password & Login'}
            </button>
          </form>
        )}

        {/* SUCCESS SCREEN */}
        {step === 'success' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>✅</div>
            <h3 style={{ color: '#10b981', margin: '0 0 10px' }}>Account Created!</h3>
            <p style={{ color: '#94a3b8', marginBottom: '20px' }}>
              Please check your email to verify your account. Your Admin ID is: <strong style={{ color: '#38bdf8' }}>{pendingLoginId}</strong>
            </p>
            <button onClick={resetToLogin} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)', color: '#020617', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Login