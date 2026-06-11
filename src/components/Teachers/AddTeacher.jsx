import { useState } from 'react'
import { useUnsavedChanges } from '../../utils/useUnsavedChanges'
import { supabase } from '../../supabaseClient'
import { sendWelcomeEmail } from '../../services/emailService'
import { createAuthUser } from '../../services/authApi'

const TEACHER_ACCESS_KEY = import.meta.env.VITE_TEACHER_ACCESS_KEY || 'DLS-TEACHER-2026'

function AddTeacher(props) {
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [accessKey, setAccessKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  useUnsavedChanges(dirty)

  const generateStaffId = () => 'TCH-' + Math.floor(1000 + Math.random() * 9000)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)

    if (accessKey !== TEACHER_ACCESS_KEY) {
      props.showToast('Invalid Teacher Access Key', 'error')
      setSaving(false)
      return
    }

    const staffId = generateStaffId()

    try {
      // Create Supabase Auth user first
      const authResult = await createAuthUser(email.trim().toLowerCase(), password, {
        full_name: `${firstName} ${lastName}`,
        login_id: staffId,
        role: 'teacher',
      })

      let authId = null
      if (authResult.success && authResult.auth_id) {
        authId = authResult.auth_id
      }

      const { error: insertError } = await supabase
        .from('teachers')
        .insert([{
          first_name: firstName,
          middle_name: middleName || '-',
          last_name: lastName,
          staff_id: staffId,
          login_id: staffId,
          auth_id: authId,
          email: email.trim().toLowerCase(),
          password: password,
          is_first_login: true
        }])

      if (insertError) {
        // Rollback auth user creation if DB insert fails
        if (authId) {
          try {
            const { deleteAuthUser } = await import('../../services/authApi')
            await deleteAuthUser(authId)
          } catch (rollbackErr) {
            console.error('Auth rollback error:', rollbackErr)
          }
        }
        throw insertError
      }

      await sendWelcomeEmail(email.trim().toLowerCase(), staffId, password, 'teacher')

      props.showToast(`${firstName} ${lastName} registered! Credentials sent to ${email}`, 'success')

      setDirty(false)
      setFirstName('')
      setMiddleName('')
      setLastName('')
      setEmail('')
      setPassword('')
      setAccessKey('')

      if (props.onAdd) props.onAdd()
    } catch (err) {
      props.showToast('Error: ' + err.message, 'error')
    }

    setSaving(false)
  }

  return (
    <div className="admin-table-container" style={{ maxWidth: '600px' }}>
      <div className="modal-content" style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none' }}>
        <h3 style={{ color: '#f8fafc', marginBottom: '20px' }}>Register New Teacher</h3>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label className="text-dim" style={{ fontSize: '0.8rem' }}>First Name</label>
            <input
              className="counter"
              style={{ background: '#1e293b', padding: '12px', color: 'white', width: '100%' }}
              placeholder="e.g. Favour"
              value={firstName}
              onChange={(e) => { setFirstName(e.target.value); setDirty(true) }}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label className="text-dim" style={{ fontSize: '0.8rem' }}>Middle Name (Optional)</label>
            <input
              className="counter"
              style={{ background: '#1e293b', padding: '12px', color: 'white', width: '100%' }}
              placeholder="e.g. Peace"
              value={middleName}
              onChange={(e) => { setMiddleName(e.target.value); setDirty(true) }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label className="text-dim" style={{ fontSize: '0.8rem' }}>Last Name</label>
            <input
              className="counter"
              style={{ background: '#1e293b', padding: '12px', color: 'white', width: '100%' }}
              placeholder="e.g. Adebayo"
              value={lastName}
              onChange={(e) => { setLastName(e.target.value); setDirty(true) }}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label className="text-dim" style={{ fontSize: '0.8rem' }}>Teacher Gmail</label>
            <input
              className="counter"
              type="email"
              style={{ background: '#1e293b', padding: '12px', color: 'white', width: '100%' }}
              placeholder="e.g. teacher@gmail.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setDirty(true) }}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label className="text-dim" style={{ fontSize: '0.8rem' }}>Temporary Password</label>
            <input
              className="counter"
              type="password"
              style={{ background: '#1e293b', padding: '12px', color: 'white', width: '100%' }}
              placeholder="Set initial password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setDirty(true) }}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label className="text-dim" style={{ fontSize: '0.8rem' }}>Teacher Access Key</label>
            <input
              className="counter"
              type="password"
              style={{ background: '#1e293b', padding: '12px', color: 'white', width: '100%' }}
              placeholder="Enter authorized access key"
              value={accessKey}
              onChange={(e) => { setAccessKey(e.target.value); setDirty(true) }}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-delete"
            style={{ background: saving ? '#64748b' : '#38bdf8', marginTop: '10px', height: '45px' }}
            disabled={saving}
          >
            {saving ? 'Registering...' : 'Confirm Registration'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AddTeacher
