import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

export default function MfaSetup() {
  const [factorId, setFactorId] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [enrolled, setEnrolled] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: string } | null>(null)

  useEffect(() => {
    checkMfaStatus()
  }, [])

  const checkMfaStatus = async () => {
    try {
      const { data, error }: any = await supabase.auth.mfa.listFactors()
      if (error) throw error
      const verified = data?.all?.find((f: any) => f.status === 'verified')
      if (verified) {
        setEnrolled(true)
      }
    } catch (err: any) {
      console.error('MFA check failed:', err)
      setMessage({ text: 'Failed to check MFA status', type: 'error' })
    }
  }

  const handleEnroll = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const { data, error }: any = await supabase.auth.mfa.enroll({ factorType: 'totp' })
      if (error) throw error
      setFactorId(data.id)
      setQrCode(data.totp.qr_code)
    } catch (err: any) {
      setMessage({ text: 'Enrollment failed: ' + err.message, type: 'error' })
    }
    setLoading(false)
  }

  const handleVerify = async () => {
    if (!verifyCode || verifyCode.length !== 6 || !factorId) return
    setLoading(true)
    setMessage(null)
    try {
      const { data: challengeData }: any = await supabase.auth.mfa.challenge({ factorId })
      const { error }: any = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verifyCode,
      })
      if (error) throw error
      setEnrolled(true)
      setMessage({ text: 'MFA enrolled successfully!', type: 'success' })
    } catch (err: any) {
      setMessage({ text: 'Verification failed: ' + err.message, type: 'error' })
    }
    setLoading(false)
  }

  const handleUnenroll = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const { data: factors }: any = await supabase.auth.mfa.listFactors()
      const verified = factors?.all?.find((f: any) => f.status === 'verified')
      if (verified) {
        const { error }: any = await supabase.auth.mfa.unenroll({ factorId: verified.id })
        if (error) throw error
      }
      setEnrolled(false)
      setFactorId('')
      setQrCode('')
      setVerifyCode('')
      setMessage({ text: 'MFA disabled.', type: 'success' })
    } catch (err: any) {
      setMessage({ text: 'Failed to disable MFA: ' + err.message, type: 'error' })
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: 30 }}>
      <h2 style={{ color: '#f8fafc', margin: '0 0 8px' }}>Multi-Factor Authentication</h2>
      <p style={{ color: '#94a3b8', marginBottom: 24 }}>Add an extra layer of security to your account.</p>

      {enrolled ? (
        <div style={{ background: '#1e293b', border: '1px solid #10b981', borderRadius: 14, padding: 24 }}>
          <div style={{ color: '#10b981', fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>MFA is Active</div>
          <p style={{ color: '#94a3b8', marginBottom: 16 }}>Your account is protected by two-factor authentication.</p>
          <button onClick={handleUnenroll} disabled={loading}
            style={{ padding: '10px 20px', background: loading ? '#334155' : '#ef4444', color: '#fff', border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700 }}>
            {loading ? 'Disabling...' : 'Disable MFA'}
          </button>
        </div>
      ) : qrCode ? (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 14, padding: 24 }}>
          <h3 style={{ color: '#f8fafc', margin: '0 0 16px' }}>Scan QR Code</h3>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <img src={qrCode} alt="MFA QR Code - Scan with your authenticator app" style={{ maxWidth: 200, borderRadius: 8 }} />
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: 12 }}>Scan with Google Authenticator or Authy, then enter the 6-digit code below.</p>
          <input aria-label="Verification code" value={verifyCode} onChange={(e) => setVerifyCode(e.target.value)} maxLength={6} placeholder="000000"
            style={{ width: '100%', padding: 12, background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', fontSize: '1.2rem', textAlign: 'center', letterSpacing: 6, outline: 'none', boxSizing: 'border-box' }} />
          <button onClick={handleVerify} disabled={loading || verifyCode.length !== 6}
            style={{ width: '100%', padding: 12, marginTop: 12, background: loading || verifyCode.length !== 6 ? '#334155' : '#10b981', color: loading || verifyCode.length !== 6 ? '#94a3b8' : '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: loading || verifyCode.length !== 6 ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Verifying...' : 'Verify & Enable'}
          </button>
        </div>
      ) : (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 14, padding: 24 }}>
          <p style={{ color: '#94a3b8', marginBottom: 16 }}>MFA is not enabled on your account yet.</p>
          <button onClick={handleEnroll} disabled={loading}
            style={{ padding: '12px 24px', background: loading ? '#334155' : '#38bdf8', color: loading ? '#94a3b8' : '#0f172a', border: 'none', borderRadius: 8, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Setting up...' : 'Setup MFA'}
          </button>
        </div>
      )}

      {message && (
        <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: message.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: message.type === 'error' ? '#ef4444' : '#10b981', fontWeight: 600 }}>
          {message.text}
        </div>
      )}
    </div>
  )
}
