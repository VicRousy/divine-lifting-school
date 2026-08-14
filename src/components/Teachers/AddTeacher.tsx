import { useState } from 'react'
import { useUnsavedChanges } from '../../utils/useUnsavedChanges'
import { supabase } from '../../supabaseClient'
import { sendWelcomeEmail } from '../../services/emailService'
import { createAuthUser } from '../../services/authApi'
import bcrypt from 'bcryptjs'

interface AddTeacherProps {
  showToast: (msg: string, type?: string) => void
  onAdd?: () => void
}

function AddTeacher({ showToast, onAdd }: AddTeacherProps) {
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  useUnsavedChanges(dirty)

  const generateStaffId = () => 'TCH-' + Math.floor(1000 + Math.random() * 9000)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const staffId = generateStaffId()
    const hashedPassword = await bcrypt.hash(password, 10)

    try {
      const { data: teacher, error: insertError } = await supabase
        .from('teachers')
        .insert([{
          first_name: firstName,
          middle_name: middleName || '-',
          last_name: lastName,
          staff_id: staffId,
          login_id: staffId,
          email: email.trim().toLowerCase(),
          password: hashedPassword,
          is_first_login: true
        }])
        .select('id')
        .single()

      if (insertError) throw insertError

      const authResult = await createAuthUser(`${staffId}@dls.edu`, password)
      if (!authResult.auth_id) throw new Error('Failed to provision secure portal access')
      const { error: authLinkError } = await supabase
        .from('teachers')
        .update({ auth_id: authResult.auth_id })
        .eq('id', teacher.id)
      if (authLinkError) throw authLinkError

      await sendWelcomeEmail(email.trim().toLowerCase(), staffId, password, 'teacher')

      showToast(`${firstName} ${lastName} registered! Credentials sent to ${email}`, 'success')

      setDirty(false)
      setFirstName('')
      setMiddleName('')
      setLastName('')
      setEmail('')
      setPassword('')

      if (onAdd) onAdd()
    } catch (err) {
      showToast('Error: ' + (err instanceof Error ? err.message : String(err)), 'error')
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
