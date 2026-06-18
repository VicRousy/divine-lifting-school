import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import bcrypt from 'bcryptjs'

const MASTER_ACCESS_KEY = import.meta.env.VITE_MASTER_ACCESS_KEY

interface LoginProps {
  onLogin: () => void
}

export default function Login({ onLogin }: LoginProps) {
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mfaRequired, setMfaRequired] = useState(false)
  const [mfaCode, setMfaCode] = useState('')
  const [mfaFactorId, setMfaFactorId] = useState('')
  const [mfaFactorsAll, setMfaFactorsAll] = useState<any>(null)
  const [authId, setAuthId] = useState('')
  const [showSetPassword, setShowSetPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showMasterLogin, setShowMasterLogin] = useState(false)
  const [masterAccessKey, setMasterAccessKey] = useState('')
  const [setPasswordFor, setSetPasswordFor] = useState<any>(null)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const fetchIp = async (): Promise<string> => {
    try {
      const res = await fetch('/api/get-ip')
      if (res.ok) {
        const data = await res.json()
        return data.ip || ''
      }
    } catch {}
    return ''
  }

  const handleMfaVerify = async () => {
    setLoading(true)
    setError('')
    try {
      const factors = mfaFactorsAll || (await supabase.auth.mfa.listFactors()).data?.all || []
      const totpFactor = factors.find((f: any) => f.factor_type === 'totp' && f.status === 'verified')
      if (!totpFactor) {
        setError('MFA factor not found')
        setLoading(false)
        return
      }
      const { data: challengeData }: any = await supabase.auth.mfa.challenge({ factorId: totpFactor.id })
      const { data: verifyData, error: verifyErr }: any = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challengeData.id,
        code: mfaCode,
      })
      if (verifyErr) {
        setError('Invalid MFA code. Please try again.')
        setLoading(false)
        return
      }
      if (verifyData) {
        if (setPasswordFor) {
          setShowSetPassword(true)
        } else {
          onLogin()
        }
      }
    } catch {
      setError('MFA verification failed. Please try again.')
    }
    setLoading(false)
  }

  const doCreateAuthUser = async (userRecord: any, login_id: string) => {
    const { data: existing }: any = await supabase.auth.admin.listUsers()
    const found = existing?.users?.find((u: any) => u.email?.toLowerCase() === `${login_id}@dls.edu`)
    if (found) return found

    const { data: newUser, error: createErr }: any = await supabase.auth.admin.createUser({
      email: `${login_id}@dls.edu`,
      password: password,
      email_confirm: true,
    })
    if (createErr) throw createErr
    const uid = newUser?.user?.id
    if (uid && userRecord) {
      await supabase.from(userRecord.table).update({ auth_id: uid }).eq('id', userRecord.id)
    }
    return newUser?.user
  }

  const handleSetNewPassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      const hashed = await bcrypt.hash(newPassword, 10)
      const { error: updateErr } = await supabase
        .from(setPasswordFor.table)
        .update({ password: hashed, is_first_login: false })
        .eq('id', setPasswordFor.id)
      if (updateErr) throw updateErr
      setShowSetPassword(false)
      setSetPasswordFor(null)
      onLogin()
    } catch {
      setError('Failed to set password. Please try again.')
    }
    setLoading(false)
  }

  const handleMasterLogin = async () => {
    if (!MASTER_ACCESS_KEY) {
      setError('Master access not configured')
      return
    }
    if (masterAccessKey !== MASTER_ACCESS_KEY) {
      setError('Invalid master access key')
      return
    }
    setLoading(true)
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, login_id, role')
        .eq('login_id', 'ADM-258448')
        .single()
      if (profile) {
        const { data: session }: any = await supabase.auth.signInWithPassword({
          email: 'admin@dls.edu',
          password: password,
        })
        if (session?.session) onLogin()
      }
    } catch (err: any) {
      setError('Master login failed')
    }
    setLoading(false)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginId || !password) {
      setError('Please enter your Login ID and Password')
      return
    }
    setLoading(true)
    setError('')

    try {
      const ip = await fetchIp()
      const { data, error: rpcError }: any = await supabase.rpc('verify_login_password', {
        p_login_id: loginId.trim(),
        p_password: password,
        p_ip_address: ip,
      })

      if (rpcError) {
        setError('Login failed. Please check your credentials and try again.')
        setLoading(false)
        return
      }

      if (!data?.valid && data?.rate_limited) {
        setError('Too many login attempts. Please try again later.')
        setLoading(false)
        return
      }

      if (!data?.valid) {
        setError(data?.message || 'Invalid login ID or password')
        setLoading(false)
        return
      }

      const { data: factorsData }: any = await supabase.auth.mfa.listFactors()
      const factorsAll = factorsData?.all || []
      setMfaFactorsAll(factorsAll)
      const hasMfa = factorsAll.some((f: any) => f.status === 'verified')
      const needsMfa = hasMfa && !showSetPassword

      if (needsMfa) {
        const totpFactor = factorsAll.find((f: any) => f.factor_type === 'totp' && f.status === 'verified')
        if (totpFactor) {
          setMfaFactorId(totpFactor.id)
          setMfaRequired(true)
          if (data.is_first_login) {
            setSetPasswordFor({ id: data.user_id, table: data.role === 'admin' ? 'profiles' : data.role + 's' })
          }
          setLoading(false)
          return
        }
      }

      if (data.is_first_login && data.role !== 'student' && data.role !== 'parent') {
        setShowSetPassword(true)
        setSetPasswordFor({ id: data.user_id, table: data.role === 'admin' ? 'profiles' : data.role + 's' })
        setLoading(false)
        return
      }

      const authUser = await doCreateAuthUser({ id: data.user_id, table: data.role === 'admin' ? 'profiles' : data.role + 's' }, loginId.trim())
      if (authUser) {
        onLogin()
      } else {
        setError('Failed to create auth session')
      }
    } catch {
      setError('Login failed. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', padding: '20px' }}>
      <div style={{ maxWidth: '440px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🏫</div>
          <h1 style={{ color: '#f8fafc', fontSize: '28px', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.5px' }}>Divine Lifting School</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Administrative Portal</p>
        </div>

        <div style={{ background: '#1e293b', borderRadius: '20px', padding: '32px', border: '1px solid #334155', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
          {showSetPassword ? (
            <div>
              <h2 style={{ color: '#f8fafc', margin: '0 0 20px', fontSize: '20px' }}>Set Your Password</h2>
              <p style={{ color: '#94a3b8', marginBottom: '20px', fontSize: '14px', lineHeight: 1.5 }}>
                Welcome! Please set a new password for your account.
              </p>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '6px', fontWeight: 600 }}>New Password</label>
                <input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: '#f8fafc', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '6px', fontWeight: 600 }}>Confirm Password</label>
                <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: '#f8fafc', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <button onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '13px', marginBottom: '16px' }}>
                {showPassword ? 'Hide' : 'Show'} passwords
              </button>
              {error && <div role="alert" style={{ color: '#ef4444', fontSize: '13px', marginBottom: '12px' }}>{error}</div>}
              <button onClick={handleSetNewPassword} disabled={loading}
                style={{ width: '100%', padding: '12px', background: loading ? '#334155' : '#10b981', color: loading ? '#94a3b8' : '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontSize: '15px' }}>
                {loading ? 'Saving...' : 'Set Password & Continue'}
              </button>
            </div>
          ) : mfaRequired ? (
            <div>
              <h2 style={{ color: '#f8fafc', margin: '0 0 8px', fontSize: '20px' }}>Two-Factor Authentication</h2>
              <p style={{ color: '#94a3b8', marginBottom: '20px', fontSize: '14px' }}>Enter the 6-digit code from your authenticator app.</p>
              <input value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} maxLength={6} placeholder="000000"
                style={{ width: '100%', padding: '12px 16px', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: '#f8fafc', fontSize: '24px', textAlign: 'center', letterSpacing: '8px', outline: 'none', boxSizing: 'border-box' }} />
              {error && <div role="alert" style={{ color: '#ef4444', fontSize: '13px', margin: '12px 0' }}>{error}</div>}
              <button onClick={handleMfaVerify} disabled={loading || mfaCode.length !== 6}
                style={{ width: '100%', padding: '12px', marginTop: '16px', background: loading || mfaCode.length !== 6 ? '#334155' : '#38bdf8', color: loading || mfaCode.length !== 6 ? '#94a3b8' : '#0f172a', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: loading || mfaCode.length !== 6 ? 'not-allowed' : 'pointer', fontSize: '15px' }}>
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '6px', fontWeight: 600 }}>Login ID</label>
                <input aria-label="Login ID" value={loginId} onChange={(e) => setLoginId(e.target.value)} required placeholder="Enter your Login ID"
                  style={{ width: '100%', padding: '12px 16px', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: '#f8fafc', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '6px', fontWeight: 600 }}>Password</label>
                <input aria-label="Password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Enter your password"
                  style={{ width: '100%', padding: '12px 16px', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: '#f8fafc', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '13px', marginBottom: '16px' }}>
                {showPassword ? 'Hide' : 'Show'} password
              </button>
              {error && <div role="alert" style={{ color: '#ef4444', fontSize: '13px', marginBottom: '12px' }}>{error}</div>}
              <button type="submit" disabled={loading}
                style={{ width: '100%', padding: '12px', background: loading ? '#334155' : '#38bdf8', color: loading ? '#94a3b8' : '#0f172a', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontSize: '15px' }}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}
        </div>

        {!showSetPassword && !mfaRequired && (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button role="button" tabIndex={0} onClick={() => setShowMasterLogin(!showMasterLogin)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowMasterLogin(!showMasterLogin) }}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '13px' }}>
              {showMasterLogin ? 'Cancel' : 'Master Access'}
            </button>
          </div>
        )}

        {showMasterLogin && !showSetPassword && !mfaRequired && (
          <div style={{ marginTop: '12px', padding: '20px', background: '#1e293b', borderRadius: '14px', border: '1px solid #334155' }}>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '12px' }}>Master access key required.</p>
            <input type="password" value={masterAccessKey} onChange={(e) => setMasterAccessKey(e.target.value)} placeholder="Enter master key"
              style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            <button onClick={handleMasterLogin} disabled={loading || !masterAccessKey}
              style={{ width: '100%', padding: '10px', marginTop: '12px', background: loading ? '#334155' : '#f59e0b', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Authenticating...' : 'Authenticate'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
