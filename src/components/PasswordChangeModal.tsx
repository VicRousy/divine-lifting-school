import { useState, useRef, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import bcrypt from 'bcryptjs'

interface PasswordChangeModalProps {
  userInfo: any
  userRole: string
  onClose: () => void
  showToast: (msg: string, type: string) => void
}

export default function PasswordChangeModal({ userInfo, userRole, onClose, showToast }: PasswordChangeModalProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const tableMap: Record<string, string> = {
    admin: 'profiles',
    teacher: 'teachers',
    student: 'students',
    parent: 'parents',
  }

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters')
      return
    }
    setLoading(true)
    setError('')
    try {
      const loginId = userInfo.login_id || userInfo.student_id || userInfo.staff_id || userInfo.parent_id
      if (!loginId) {
        setError('Unable to identify your account')
        setLoading(false)
        return
      }
      const { data: verifyData, error: verifyErr }: any = await supabase.rpc('verify_login_password', {
        p_login_id: loginId,
        p_password: currentPassword,
        p_ip_address: '',
      })
      if (verifyErr) throw verifyErr
      if (!verifyData?.success) {
        setError(verifyData?.message || 'Current password is incorrect')
        setLoading(false)
        return
      }
      const hashed = await bcrypt.hash(newPassword, 10)
      const table = tableMap[userRole] || 'profiles'
      const { error: updateErr } = await supabase
        .from(table)
        .update({ password: hashed, is_first_login: false })
        .eq('id', userInfo.id)
      if (updateErr) throw updateErr
      showToast('Password changed successfully!', 'success')
      onClose()
    } catch (err: any) {
      setError('Failed to change password: ' + err.message)
    }
    setLoading(false)
  }

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
      }}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Change password"
        style={{ background: '#1e293b', borderRadius: 14, padding: 24, width: '90vw', maxWidth: 400 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 20px', color: '#f8fafc' }}>Change Password</h3>
        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: 4 }}>Current Password</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input ref={inputRef} type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required
                style={{ flex: 1, padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', outline: 'none' }} />
              <button type="button" role="button" tabIndex={0} onClick={() => setShowCurrent(!showCurrent)} onKeyDown={(e) => { if (e.key === 'Enter') setShowCurrent(!showCurrent) }}
                aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
                style={{ padding: '8px 12px', background: '#334155', border: 'none', borderRadius: 8, color: '#94a3b8', cursor: 'pointer' }}>{showCurrent ? 'Hide' : 'Show'}</button>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: 4 }}>New Password</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required
                style={{ flex: 1, padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', outline: 'none' }} />
              <button type="button" role="button" tabIndex={0} onClick={() => setShowNew(!showNew)} onKeyDown={(e) => { if (e.key === 'Enter') setShowNew(!showNew) }}
                aria-label={showNew ? 'Hide new password' : 'Show new password'}
                style={{ padding: '8px 12px', background: '#334155', border: 'none', borderRadius: 8, color: '#94a3b8', cursor: 'pointer' }}>{showNew ? 'Hide' : 'Show'}</button>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: 4 }}>Confirm New Password</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                style={{ flex: 1, padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', outline: 'none' }} />
              <button type="button" role="button" tabIndex={0} onClick={() => setShowConfirm(!showConfirm)} onKeyDown={(e) => { if (e.key === 'Enter') setShowConfirm(!showConfirm) }}
                aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                style={{ padding: '8px 12px', background: '#334155', border: 'none', borderRadius: 8, color: '#94a3b8', cursor: 'pointer' }}>{showConfirm ? 'Hide' : 'Show'}</button>
            </div>
          </div>
          {error && <div role="alert" style={{ color: '#ef4444', fontSize: '0.85rem' }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={loading}
              style={{ flex: 1, padding: '10px', background: loading ? '#334155' : '#10b981', color: loading ? '#94a3b8' : '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Changing...' : 'Change Password'}
            </button>
            <button type="button" onClick={onClose}
              style={{ padding: '10px 20px', background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
