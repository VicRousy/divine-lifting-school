import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { resetAuthPassword } from '../services/authApi'
import bcrypt from 'bcryptjs'

const TABLE_MAP = {
  admin: 'profiles',
  teacher: 'teachers',
  student: 'students',
  parent: 'parents',
}

const ID_FIELD_MAP = {
  admin: 'id',
  teacher: 'id',
  student: 'id',
  parent: 'id',
}

export default function PasswordChangeModal({ userInfo, userRole, onClose, showToast }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const dialogRef = useRef(null)

  useEffect(() => {
    const el = dialogRef.current
    if (el) el.focus()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Please fill in all fields', 'error')
      return
    }

    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters', 'error')
      return
    }

    if (!/[A-Z]/.test(newPassword)) {
      showToast('Password must contain an uppercase letter', 'error')
      return
    }

    if (!/[a-z]/.test(newPassword)) {
      showToast('Password must contain a lowercase letter', 'error')
      return
    }

    if (!/[0-9]/.test(newPassword)) {
      showToast('Password must contain a number', 'error')
      return
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      showToast('Password must contain a special character', 'error')
      return
    }

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error')
      return
    }

    setSubmitting(true)

    try {
      const table = TABLE_MAP[userRole]
      if (!table) {
        showToast('Invalid user role', 'error')
        return
      }

      const { data, error } = await supabase
        .from(table)
        .select('password')
        .eq(ID_FIELD_MAP[userRole], userInfo.id)
        .single()

      if (error || !data) {
        showToast('Could not verify current password', 'error')
        return
      }

      const isValid = data.password === currentPassword || await bcrypt.compare(currentPassword, data.password)
      if (!isValid) {
        showToast('Current password is incorrect', 'error')
        return
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10)
      const { error: updateError } = await supabase
        .from(table)
        .update({ password: hashedPassword })
        .eq(ID_FIELD_MAP[userRole], userInfo.id)

      if (updateError) {
        showToast('Failed to update password', 'error')
        return
      }

      // Sync with Supabase Auth (non-blocking)
      supabase.auth.updateUser({ password: newPassword }).catch(() => {
        // Fallback: try API endpoint
        resetAuthPassword(userInfo.email, newPassword).catch(() => {})
      })

      showToast('Password changed successfully', 'success')
      onClose()
    } catch (err) {
      showToast('An error occurred', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div ref={dialogRef} tabIndex={-1} onKeyDown={(e) => { if (e.key === 'Escape') onClose() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: '#1e293b', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <h2 style={{ color: '#f8fafc', margin: '0 0 24px', fontSize: '1.25rem' }}>Change Password</h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.875rem', marginBottom: '6px' }}>Current Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#f8fafc', fontSize: '0.9rem', boxSizing: 'border-box' }} />
              <span onClick={() => setShowCurrent(!showCurrent)} style={{ position: 'absolute', right: 12, top: 10, cursor: 'pointer', color: '#64748b', fontSize: '0.85rem', userSelect: 'none' }}>{showCurrent ? 'Hide' : 'Show'}</span>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.875rem', marginBottom: '6px' }}>New Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#f8fafc', fontSize: '0.9rem', boxSizing: 'border-box' }} />
              <span onClick={() => setShowNew(!showNew)} style={{ position: 'absolute', right: 12, top: 10, cursor: 'pointer', color: '#64748b', fontSize: '0.85rem', userSelect: 'none' }}>{showNew ? 'Hide' : 'Show'}</span>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.875rem', marginBottom: '6px' }}>Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#f8fafc', fontSize: '0.9rem', boxSizing: 'border-box' }} />
              <span onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: 12, top: 10, cursor: 'pointer', color: '#64748b', fontSize: '0.85rem', userSelect: 'none' }}>{showConfirm ? 'Hide' : 'Show'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', background: '#475569', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
            <button type="submit" disabled={submitting} style={{ flex: 1, padding: '10px', background: submitting ? '#64748b' : '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '6px', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>{submitting ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
