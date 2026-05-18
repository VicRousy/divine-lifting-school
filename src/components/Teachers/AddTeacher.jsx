import { useState } from 'react'
import { supabase } from '../../supabaseClient'
import { sendWelcomeEmail } from '../../services/emailService'

const TEACHER_ACCESS_KEY = 'DLS-TEACHER-2026'

function AddTeacher(props) {
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [accessKey, setAccessKey] = useState('')
  const [saving, setSaving] = useState(false)

  const generateStaffId = () => 'TCH-' + Math.floor(1000 + Math.random() * 9000)

  const generatePassword = () => {
    const chars = 'abcdefghijkmnpqrstuvwxyz23456789'
    let pass = ''
    for (let i = 0; i < 8; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length))
    return pass
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)

    if (accessKey !== TEACHER_ACCESS_KEY) {
      props.showToast('Invalid Teacher Access Key', 'error')
      setSaving(false)
      return
    }

    const staffId = generateStaffId()
    const password = generatePassword()

    try {
      // Create Supabase Auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            staff_id: staffId,
            role: 'teacher'
          }
        }
      })

      if (authError) throw authError

      // Insert into teachers table
      const { error: teacherError } = await supabase
        .from('teachers')
        .insert([{
          first_name: firstName,
          middle_name: middleName || '-',
          last_name: lastName,
          staff_id: staffId,
          email: email.trim().toLowerCase()
        }])

      if (teacherError) {
        console.error('Teacher insert error:', teacherError)
      }

      // Send credentials email
      await sendWelcomeEmail(email.trim().toLowerCase(), staffId, password, 'teacher')

      props.showToast(`${firstName} ${lastName} registered! Credentials sent to ${email}`, 'success')

      setFirstName('')
      setMiddleName('')
      setLastName('')
      setEmail('')
      setAccessKey('')

      if (props.onAdd) props.onAdd()
    } catch (err) {
      console.error('Registration error:', err)
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
              onChange={(e) => setFirstName(e.target.value)}
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
              onChange={(e) => setMiddleName(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label className="text-dim" style={{ fontSize: '0.8rem' }}>Last Name</label>
            <input
              className="counter"
              style={{ background: '#1e293b', padding: '12px', color: 'white', width: '100%' }}
              placeholder="e.g. Adebayo"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label className="text-dim" style={{ fontSize: '0.8rem' }}>Teacher Gmail Address</label>
            <input
              className="counter"
              type="email"
              style={{ background: '#1e293b', padding: '12px', color: 'white', width: '100%' }}
              placeholder="e.g. teacher@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              onChange={(e) => setAccessKey(e.target.value)}
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
