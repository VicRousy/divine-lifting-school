import { useState, useEffect } from 'react'
import { useUnsavedChanges } from '../../utils/useUnsavedChanges'
import { supabase } from '../../supabaseClient'
import { safeQuery } from '../../utils/safeQuery'
import { sendWelcomeEmail } from '../../services/emailService'
import bcrypt from 'bcryptjs'

const STUDENT_ACCESS_KEY = import.meta.env.VITE_STUDENT_ACCESS_KEY

export default function AddStudent(props) {
  const [classes, setClasses] = useState([])

  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [lastName, setLastName] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [studentPassword, setStudentPassword] = useState('')

  const [parentFirstName, setParentFirstName] = useState('')
  const [parentMiddleName, setParentMiddleName] = useState('')
  const [parentLastName, setParentLastName] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [parentPassword, setParentPassword] = useState('')

  const [accessKey, setAccessKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  useUnsavedChanges(dirty)

  useEffect(() => {
    const fetchClasses = async () => {
      const { data } = await safeQuery(() => supabase.from('classes').select('id, class_name').order('class_name'))
      setClasses(data || [])
    }
    fetchClasses()
  }, [])

  const generateStudentId = () => 'STU-' + Math.floor(1000 + Math.random() * 9000)
  const generateParentId = () => 'PAR-' + Math.floor(1000 + Math.random() * 9000)

  const resetForm = () => {
    setFirstName('')
    setMiddleName('')
    setLastName('')
    setSelectedClassId('')
    setStudentPassword('')
    setParentFirstName('')
    setParentMiddleName('')
    setParentLastName('')
    setParentEmail('')
    setParentPhone('')
    setParentPassword('')
    setAccessKey('')
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)

    if (!STUDENT_ACCESS_KEY) {
      props.showToast('Student registration is not configured. Contact system administrator.', 'error')
      setSaving(false)
      return
    }
    if (accessKey !== STUDENT_ACCESS_KEY) {
      props.showToast('Invalid Student Access Key', 'error')
      setSaving(false)
      return
    }

    if (!selectedClassId) {
      props.showToast('Please select a class', 'error')
      setSaving(false)
      return
    }

    const studentId = generateStudentId()
    const parentId = generateParentId()
    const hashedParentPassword = await bcrypt.hash(parentPassword, 10)
    const hashedStudentPassword = await bcrypt.hash(studentPassword, 10)

    const fullParentName = `${parentFirstName} ${parentMiddleName} ${parentLastName}`.trim()
    const fullStudentName = `${firstName} ${middleName} ${lastName}`.trim()

    try {
      const { data: parentData, error: parentError } = await supabase
        .from('parents')
        .insert([{
          parent_id: parentId,
          first_name: parentFirstName,
          middle_name: parentMiddleName || '-',
          last_name: parentLastName,
          email: parentEmail.trim().toLowerCase(),
          phone: parentPhone,
          password: hashedParentPassword,
        }])
        .select('id')
        .single()

      if (parentError) throw parentError

      const { error: studentError } = await supabase
        .from('students')
        .insert([{
          first_name: firstName,
          middle_name: middleName || '-',
          last_name: lastName,
          student_id: studentId,
          login_id: studentId,
          class_id: Number(selectedClassId),
          parent_id: parentData.id,
          password: hashedStudentPassword,
          is_active: true,
        }])

      if (studentError) throw studentError

      await sendWelcomeEmail(
        parentEmail.trim().toLowerCase(),
        parentId,
        parentPassword,
        'parent',
        fullParentName,
        fullStudentName,
      )

      await sendWelcomeEmail(
        parentEmail.trim().toLowerCase(),
        studentId,
        studentPassword,
        'student',
        null,
        fullStudentName,
      )

      props.showToast(`${firstName} ${lastName} registered! Credentials sent to ${parentEmail}`, 'success')
      setDirty(false)
      resetForm()
      if (props.onAdd) props.onAdd()
    } catch (err) {
      props.showToast('Error: ' + err.message, 'error')
    }

    setSaving(false)
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 clamp(0px, 3vw, 20px)' }}>
      <h2 style={{ margin: '0 0 30px', color: '#f8fafc', textAlign: 'center' }}>Register New Student</h2>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        <div className="responsive-card" style={{ background: '#1e293b', padding: 24, borderRadius: 14, border: '1px solid #334155' }}>
          <h4 style={{ margin: '0 0 20px', color: '#38bdf8' }}>Student Information</h4>
          <div className="responsive-grid-3" style={{ gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>First Name</label>
              <input
                value={firstName}
                onChange={(e) => { setFirstName(e.target.value); setDirty(true) }}
                required
                style={{ width: '100%', padding: 10, background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>Middle Name</label>
              <input
                value={middleName}
                onChange={(e) => { setMiddleName(e.target.value); setDirty(true) }}
                style={{ width: '100%', padding: 10, background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>Last Name</label>
              <input
                value={lastName}
                onChange={(e) => { setLastName(e.target.value); setDirty(true) }}
                required
                style={{ width: '100%', padding: 10, background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', outline: 'none' }}
              />
            </div>
          </div>
          <div className="responsive-grid-2" style={{ gap: 15, marginTop: 15 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>Class</label>
              <select
                value={selectedClassId}
                onChange={(e) => { setSelectedClassId(e.target.value); setDirty(true) }}
                required
                style={{ width: '100%', padding: 10, background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', outline: 'none' }}
              >
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.class_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>Student Password</label>
              <input
                type="password"
                value={studentPassword}
                onChange={(e) => { setStudentPassword(e.target.value); setDirty(true) }}
                required
                style={{ width: '100%', padding: 10, background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', outline: 'none' }}
              />
            </div>
          </div>
        </div>

        <div className="responsive-card" style={{ background: '#1e293b', padding: 24, borderRadius: 14, border: '1px solid #334155' }}>
          <h4 style={{ margin: '0 0 20px', color: '#a855f7' }}>Primary Guardian / Parent</h4>
          <div className="responsive-grid-3" style={{ gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>Parent First Name</label>
              <input
                value={parentFirstName}
                onChange={(e) => { setParentFirstName(e.target.value); setDirty(true) }}
                required
                style={{ width: '100%', padding: 10, background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>Parent Middle Name</label>
              <input
                value={parentMiddleName}
                onChange={(e) => { setParentMiddleName(e.target.value); setDirty(true) }}
                style={{ width: '100%', padding: 10, background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>Parent Last Name</label>
              <input
                value={parentLastName}
                onChange={(e) => { setParentLastName(e.target.value); setDirty(true) }}
                required
                style={{ width: '100%', padding: 10, background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', outline: 'none' }}
              />
            </div>
          </div>
          <div className="responsive-grid-2" style={{ gap: 20, marginTop: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>Parent Email</label>
              <input
                type="email"
                value={parentEmail}
                onChange={(e) => { setParentEmail(e.target.value); setDirty(true) }}
                required
                style={{ width: '100%', padding: 10, background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>Parent Phone</label>
              <input
                value={parentPhone}
                onChange={(e) => { setParentPhone(e.target.value); setDirty(true) }}
                style={{ width: '100%', padding: 10, background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', outline: 'none' }}
              />
            </div>
          </div>
          <div style={{ marginTop: 15 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>Parent Password</label>
            <input
              type="password"
              value={parentPassword}
                onChange={(e) => { setParentPassword(e.target.value); setDirty(true) }}
                required
              style={{ width: '100%', padding: 10, background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', outline: 'none' }}
            />
          </div>
        </div>

        <div className="responsive-card" style={{ background: '#1e293b', padding: 24, borderRadius: 14, border: '1px solid #334155' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: 10, fontWeight: 600 }}>Student Access Key</label>
          <input
            type="password"
            value={accessKey}
            onChange={(e) => { setAccessKey(e.target.value); setDirty(true) }}
            required
            style={{ width: '100%', padding: 14, background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#e2e8f0', outline: 'none', fontSize: '1rem' }}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: 16,
            background: saving ? '#334155' : '#10b981',
            color: saving ? '#94a3b8' : '#fff',
            border: 'none',
            borderRadius: 12,
            fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '1.1rem',
            marginTop: 10,
            letterSpacing: '0.5px',
          }}
        >
          {saving ? 'Registering...' : 'Confirm Registration'}
        </button>
      </form>
    </div>
  )
}
