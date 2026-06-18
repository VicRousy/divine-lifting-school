import { useState, useRef, useEffect } from 'react'
import { supabase } from '../supabaseClient'

interface ReAuthModalProps {
  description: string
  onSuccess: () => void
  onCancel: () => void
}

export default function ReAuthModal({ description, onSuccess, onCancel }: ReAuthModalProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) {
      setError('Please enter your password')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { data: { user } }: any = await supabase.auth.getUser()
      if (!user?.email) {
        setError('Unable to verify identity')
        setLoading(false)
        return
      }
      const loginId = user.email.replace('@dls.edu', '')
      const { data, error: rpcError }: any = await supabase.rpc('verify_login_password', {
        p_login_id: loginId,
        p_password: password,
        p_ip_address: '',
      })
      if (rpcError) throw rpcError
      if (!data?.success) {
        setError(data?.message || 'Incorrect password')
        setLoading(false)
        return
      }
      onSuccess()
    } catch (err: any) {
      setError('Verification failed: ' + err.message)
    }
    setLoading(false)
  }

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000,
      }}
      onClick={onCancel}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Re-authenticate"
        style={{ background: '#1e293b', borderRadius: 14, padding: 24, width: '90vw', maxWidth: 400 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 8px', color: '#f8fafc' }}>Confirm Your Identity</h3>
        <p style={{ margin: '0 0 20px', color: '#94a3b8', fontSize: '0.9rem' }}>{description}</p>
        <form onSubmit={handleVerify}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: 4 }}>Password</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ flex: 1, padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', outline: 'none' }}
              />
              <button type="button" role="button" tabIndex={0} onClick={() => setShowPassword(!showPassword)} onKeyDown={(e) => { if (e.key === 'Enter') setShowPassword(!showPassword) }}
                style={{ padding: '8px 12px', background: '#334155', border: 'none', borderRadius: 8, color: '#94a3b8', cursor: 'pointer' }}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          {error && <div role="alert" style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: 12 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={loading}
              style={{ flex: 1, padding: '10px', background: loading ? '#334155' : '#38bdf8', color: loading ? '#94a3b8' : '#0f172a', border: 'none', borderRadius: 8, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Verifying...' : 'Confirm'}
            </button>
            <button type="button" onClick={onCancel}
              style={{ padding: '10px 20px', background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
