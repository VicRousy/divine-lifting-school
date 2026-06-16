import { useState } from 'react'
import { supabase, lookupUserByLoginId, buildUserInfo } from '../supabaseClient'
import { sendVerificationEmail } from '../services/emailService'
import { createAuthUser, resetAuthPassword } from '../services/authApi'
import bcrypt from 'bcryptjs'

const MASTER_ACCESS_KEY = import.meta.env.VITE_MASTER_ACCESS_KEY

const verifyPassword = async (inputPassword, loginId) => {
  const { data, error } = await supabase.rpc('verify_login_password', {
    p_login_id: loginId,
    p_password: inputPassword,
  })
  if (error) throw error
  if (data?.rate_limited) throw new Error('Too many login attempts. Please wait 15 minutes.')
  return data?.valid === true
}

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
  const [showPw, setShowPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showSignupPw, setShowSignupPw] = useState(false)
  
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await lookupUserByLoginId(loginId)
      if (!result) {
        setError('Invalid Login ID or Password.')
        setLoading(false)
        return
      }

      const { user, role } = result
      const tableName = role === 'admin' ? 'profiles' : role === 'teacher' ? 'teachers' : role === 'student' ? 'students' : 'parents'

      if (!(await verifyPassword(password, loginId))) {
        setError('Invalid Login ID or Password.')
        setLoading(false)
        return
      }

      if (user.is_first_login) {
        setFirstLoginUser({ ...user, role, tableName })
        setLoading(false)
        return
      }

      // Sync or create Supabase Auth account
      const email = user.email?.trim().toLowerCase()
      if (email) {
        try {
          if (user.auth_id) {
            await resetAuthPassword(email, password, user.auth_id)
          } else {
            const authResult = await createAuthUser(email, password, {
              full_name: `${user.first_name} ${user.last_name}`,
              login_id: user.login_id,
              role,
            })
            if (authResult.success && authResult.auth_id) {
              await supabase.from(tableName).update({ auth_id: authResult.auth_id }).eq('id', user.id)
            }
          }
        } catch (e) {
          console.error('Supabase Auth sync error:', e)
        }

        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
        if (signInErr) console.error('signInWithPassword non-blocking:', signInErr)
      }

      onLogin(role, buildUserInfo(role, user))
      setLoading(false)
    } catch (err) {
      setError(err.message || 'Connection error. Please try again.')
      setLoading(false)
    }
  }

  const handleSignupSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!MASTER_ACCESS_KEY) {
      setError('Admin signup is not configured. Contact system administrator.')
      setLoading(false)
      return
    }
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

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      setLoading(false)
      return
    }

    if (!/[A-Z]/.test(newPassword)) {
      setError('Password must contain an uppercase letter.')
      setLoading(false)
      return
    }

    if (!/[a-z]/.test(newPassword)) {
      setError('Password must contain a lowercase letter.')
      setLoading(false)
      return
    }

    if (!/[0-9]/.test(newPassword)) {
      setError('Password must contain a number.')
      setLoading(false)
      return
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      setError('Password must contain a special character.')
      setLoading(false)
      return
    }

    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10)
      const table = firstLoginUser.tableName || (firstLoginUser.role === 'teacher' ? 'teachers' : 'profiles')
      const { error: updateError, data: updateData } = await supabase
        .from(table)
        .update({ password: hashedPassword, is_first_login: false })
        .eq('id', firstLoginUser.id)
        .select('id')

      if (updateError || !updateData || updateData.length === 0) throw new Error('Password update failed')

      // Sync with Supabase Auth
      if (firstLoginUser.email) {
        try {
          const authResult = await createAuthUser(firstLoginUser.email, newPassword, {
            full_name: `${firstLoginUser.first_name} ${firstLoginUser.last_name}`,
            login_id: firstLoginUser.login_id,
            role: firstLoginUser.role,
          })
          if (authResult.success && authResult.auth_id) {
            await supabase.from(table).update({ auth_id: authResult.auth_id }).eq('id', firstLoginUser.id)
          }
        } catch (e) {
          console.error('Auth creation error:', e)
        }
        supabase.auth.signInWithPassword({ email: firstLoginUser.email, password: newPassword }).catch(() => {})
      }

      onLogin(firstLoginUser.role, buildUserInfo(firstLoginUser.role, firstLoginUser))
    } catch (err) {
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
        padding: 'clamp(24px, 5vw, 40px)',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.1)',
        width: 'min(420px, calc(100vw - 32px))',
        maxWidth: '100%',
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
          <form onSubmit={handleLogin} aria-describedby={error ? "login-error" : undefined}>
            <input
              type="text"
              aria-label="Login ID"
              placeholder="Login ID (e.g. ADM-001, TCH-001)"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              required
              style={inputStyle}
            />
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                aria-label="Password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={inputStyle}
              />
              <span onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: 12, cursor: 'pointer', color: '#64748b', fontSize: '0.85rem', userSelect: 'none' }}>{showPw ? 'Hide' : 'Show'}</span>
            </div>
            {error && (
              <p id="login-error" style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '15px', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '5px' }}>{error}</p>
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
          <form onSubmit={handleSignupSubmit} aria-describedby={error ? "login-error" : undefined}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', marginBottom: '15px' }}>
              <input type="text" aria-label="First Name" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required style={inputStyle} />
              <input type="text" aria-label="Middle Name" placeholder="Middle Name" value={middleName} onChange={(e) => setMiddleName(e.target.value)} style={inputStyle} />
              <input type="text" aria-label="Last Name" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} required style={inputStyle} />
            </div>
            <input type="email" aria-label="Gmail Address" placeholder="Gmail Address" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
            <div style={{ position: 'relative' }}>
              <input type={showSignupPw ? 'text' : 'password'} aria-label="Create Password" placeholder="Create Password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required style={inputStyle} />
              <span onClick={() => setShowSignupPw(!showSignupPw)} style={{ position: 'absolute', right: 12, top: 12, cursor: 'pointer', color: '#64748b', fontSize: '0.85rem', userSelect: 'none' }}>{showSignupPw ? 'Hide' : 'Show'}</span>
            </div>
            <input type="password" aria-label="Master Access Key" placeholder="Master Access Key" value={masterKey} onChange={(e) => setMasterKey(e.target.value)} required style={inputStyle} />
            {error && (
              <p id="login-error" style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '15px', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '5px' }}>{error}</p>
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
          <form onSubmit={handleVerifyCode} aria-describedby={error ? "login-error" : undefined}>
            <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '20px', fontSize: '0.9rem' }}>
              We sent a 6-digit code to <strong style={{ color: '#38bdf8' }}>{email}</strong>
            </p>
            <input
              type="text"
              aria-label="Verification code"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              maxLength={6}
              style={{ width: '100%', padding: '14px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: 'white', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '8px', boxSizing: 'border-box' }}
            />
            {error && (
              <p id="login-error" style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '15px', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '5px' }}>{error}</p>
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
          <form onSubmit={handleSetNewPassword} aria-describedby={error ? "login-error" : undefined}>
            <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '20px', fontSize: '0.9rem' }}>
              Welcome <strong style={{ color: '#38bdf8' }}>{firstLoginUser.first_name}</strong>! Please set your new password.
            </p>
            <div style={{ position: 'relative' }}>
              <input
                type={showNewPw ? 'text' : 'password'}
                aria-label="New Password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={inputStyle}
              />
              <span onClick={() => setShowNewPw(!showNewPw)} style={{ position: 'absolute', right: 12, top: 12, cursor: 'pointer', color: '#64748b', fontSize: '0.85rem', userSelect: 'none' }}>{showNewPw ? 'Hide' : 'Show'}</span>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showNewPw ? 'text' : 'password'}
                aria-label="Confirm New Password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            {error && (
              <p id="login-error" style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '15px', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '5px' }}>{error}</p>
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
