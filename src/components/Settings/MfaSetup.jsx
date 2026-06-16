import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

export default function MfaSetup({ userInfo, showToast }) {
  const [factors, setFactors] = useState([])
  const [loading, setLoading] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [factorId, setFactorId] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [challengeId, setChallengeId] = useState('')

  useEffect(() => {
    loadFactors()
  }, [])

  const loadFactors = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (error) return
    setFactors(data?.all || [])
  }

  const handleEnroll = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        issuer: 'Divine Lifting School',
        friendlyName: 'Authenticator App',
      })
      if (error) throw error
      setQrCode(data.totp.qr_code)
      setFactorId(data.id)
      setEnrolling(true)
    } catch (err) {
      showToast?.('Failed to start enrollment: ' + err.message, 'error')
    }
    setLoading(false)
  }

  const handleVerify = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      showToast?.('Enter a 6-digit code from your authenticator app', 'error')
      return
    }
    setLoading(true)
    try {
      const challengeRes = await supabase.auth.mfa.challenge({ factorId })
      if (challengeRes.error) throw challengeRes.error

      const verifyRes = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeRes.data.id,
        code: verifyCode,
      })
      if (verifyRes.error) throw verifyRes.error

      showToast?.('MFA enabled successfully!', 'success')
      setEnrolling(false)
      setQrCode('')
      setVerifyCode('')
      loadFactors()
    } catch (err) {
      showToast?.('Verification failed: ' + err.message, 'error')
    }
    setLoading(false)
  }

  const handleUnenroll = async (factorId) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId })
      if (error) throw error
      showToast?.('MFA factor removed', 'success')
      loadFactors()
    } catch (err) {
      showToast?.('Failed to remove: ' + err.message, 'error')
    }
    setLoading(false)
  }

  const verifiedFactors = factors.filter(f => f.status === 'verified')

  return (
    <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #334155', borderRadius: 14, padding: 24 }}>
      <h3 style={{ margin: '0 0 20px', color: '#f8fafc' }}>Multi-Factor Authentication (MFA)</h3>

      {verifiedFactors.length > 0 ? (
        <div>
          <p style={{ color: '#10b981', margin: '0 0 16px' }}>
            ✅ MFA is enabled ({verifiedFactors.length} factor{verifiedFactors.length > 1 ? 's' : ''})
          </p>
          {verifiedFactors.map(f => (
            <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#0f172a', borderRadius: 8, marginBottom: 8 }}>
              <span style={{ color: '#e2e8f0' }}>{f.friendly_name || 'Authenticator App'}</span>
              <button onClick={() => handleUnenroll(f.id)} disabled={loading} style={{ padding: '6px 12px', background: '#ef4444', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <p style={{ color: '#94a3b8', margin: '0 0 16px' }}>
            MFA adds an extra layer of security. Once enabled, you'll need a code from your authenticator app to log in.
          </p>
          {!enrolling ? (
            <button onClick={handleEnroll} disabled={loading} style={{ padding: '10px 20px', background: loading ? '#64748b' : '#38bdf8', color: '#0f172a', border: 'none', borderRadius: 8, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Setting up...' : '🔐 Enable MFA'}
            </button>
          ) : (
            <div>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: 12 }}>
                Scan this QR code with your authenticator app (e.g. Google Authenticator), then enter the 6-digit code below.
              </p>
              {qrCode && (
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <img src={qrCode} alt="MFA QR Code" style={{ width: 180, height: 180, borderRadius: 8, background: '#fff', padding: 8 }} />
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input type="text" value={verifyCode} onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit code" maxLength={6} style={{ flex: 1, padding: 10, background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', textAlign: 'center', fontSize: '1.1rem', letterSpacing: 4 }} />
                <button onClick={handleVerify} disabled={loading || verifyCode.length !== 6} style={{ padding: '10px 20px', background: loading || verifyCode.length !== 6 ? '#64748b' : '#10b981', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: loading || verifyCode.length !== 6 ? 'not-allowed' : 'pointer' }}>
                  {loading ? 'Verifying...' : 'Verify'}
                </button>
                <button onClick={() => { setEnrolling(false); setQrCode(''); setVerifyCode('') }} style={{ padding: '10px 16px', background: '#475569', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
