import { useState } from 'react'
import { supabase } from '../../supabaseClient'
import { sendWelcomeEmail } from '../../services/emailService'

const STUDENT_ACCESS_KEY = 'DLS-STUDENT-2026'

function AddStudent(props) {
  // Student State
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [lastName, setLastName] = useState('')
  const [className, setClassName] = useState('')
  const [studentPassword, setStudentPassword] = useState('')

  // Parent State
  const [parentFirstName, setParentFirstName] = useState('')
  const [parentMiddleName, setParentMiddleName] = useState('')
  const [parentLastName, setParentLastName] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [parentPassword, setParentPassword] = useState('')

  const [accessKey, setAccessKey] = useState('')
  const [saving, setSaving] = useState(false)

  const generateStudentId = () => 'STU-' + Math.floor(1000 + Math.random() * 9000)
  const generateParentId = () => 'PAR-' + Math.floor(1000 + Math.random() * 9000)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)

    if (accessKey !== STUDENT_ACCESS_KEY) {
      props.showToast('Invalid Student Access Key', 'error')
      setSaving(false)
      return
    }

    const studentId = generateStudentId()
    const parentId = generateParentId()

    const fullParentName = `${parentFirstName} ${parentMiddleName} ${parentLastName}`.trim()
    const fullStudentName = `${firstName} ${middleName} ${lastName}`.trim()

    try {
      // 1. Create Parent Record First
      const { data: parentData, error: parentError } = await supabase
        .from('parents')
        .insert([{
          parent_id: parentId,
          first_name: parentFirstName,
          middle_name: parentMiddleName || '-',
          last_name: parentLastName,
          email: parentEmail.trim().toLowerCase(),
          phone: parentPhone,
          password: parentPassword
        }])
        .select()
        .single()

      if (parentError) throw parentError

      // 2. Create Student Record Linked to Parent
      const { error: studentError } = await supabase
        .from('students')
        .insert([{
          first_name: firstName,
          middle_name: middleName || '-',
          last_name: lastName,
          student_id: studentId,
          login_id: studentId,
          class_name: className,
          parent_id: parentData.id,
          password: studentPassword
        }])

      if (studentError) throw studentError

      // 3. Send Emails
      // Email to Parent with their credentials + Student info
      await sendWelcomeEmail(
        parentEmail.trim().toLowerCase(), 
        parentId, 
        parentPassword, 
        'parent', 
        fullParentName, 
        fullStudentName
      )
      
      // Email to Parent with Student's credentials
      await sendWelcomeEmail(
        parentEmail.trim().toLowerCase(), 
        studentId, 
        studentPassword, 
        'student', 
        null, 
        fullStudentName
      )

      props.showToast(`${firstName} ${lastName} registered! Credentials sent to ${parentEmail}`, 'success')

      // Clear Form
      setFirstName('')
      setMiddleName('')
      setLastName('')
      setClassName('')
      setStudentPassword('')
      setParentFirstName('')
      setParentMiddleName('')
      setParentLastName('')
      setParentEmail('')
      setParentPhone('')
      setParentPassword('')
      setAccessKey('')

      if (props.onAdd) props.onAdd()
    } catch (err) {
      console.error('Registration error:', err)
      props.showToast('Error: ' + err.message, 'error')
    }

    setSaving(false)
  }

  return (
    <div className="admin-table-container" style={{ maxWidth: '700px' }}>
      <div className="modal-content" style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none' }}>
        <h3 style={{ color: '#f8fafc', marginBottom: '20px' }}>Register New Student</h3>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* SECTION 1: STUDENT INFO */}
          <div style={{ background: '#1e293b', padding: '15px', borderRadius: '8px', border: '1px solid #334155' }}>
            <h4 style={{ color: '#38bdf8', margin: '0 0 15px 0' }}>Student Information</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label className="text-dim" style={{ fontSize: '0.8rem' }}>First Name</label>
                <input className="counter" style={{ background: '#0f172a', padding: '10px', color: 'white', width: '100%' }} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label className="text-dim" style={{ fontSize: '0.8rem' }}>Middle Name</label>
                <input className="counter" style={{ background: '#0f172a', padding: '10px', color: 'white', width: '100%' }} value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label className="text-dim" style={{ fontSize: '0.8rem' }}>Last Name</label>
                <input className="counter" style={{ background: '#0f172a', padding: '10px', color: 'white', width: '100%' }} value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label className="text-dim" style={{ fontSize: '0.8rem' }}>Class</label>
                <input className="counter" style={{ background: '#0f172a', padding: '10px', color: 'white', width: '100%' }} value={className} onChange={(e) => setClassName(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label className="text-dim" style={{ fontSize: '0.8rem' }}>Student Password</label>
                <input className="counter" type="password" style={{ background: '#0f172a', padding: '10px', color: 'white', width: '100%' }} value={studentPassword} onChange={(e) => setStudentPassword(e.target.value)} required />
              </div>
            </div>
          </div>

          {/* SECTION 2: PARENT INFO */}
          <div style={{ background: '#1e293b', padding: '15px', borderRadius: '8px', border: '1px solid #334155' }}>
            <h4 style={{ color: '#a855f7', margin: '0 0 15px 0' }}>Primary Guardian / Parent</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label className="text-dim" style={{ fontSize: '0.8rem' }}>Parent First Name</label>
                <input className="counter" style={{ background: '#0f172a', padding: '10px', color: 'white', width: '100%' }} value={parentFirstName} onChange={(e) => setParentFirstName(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label className="text-dim" style={{ fontSize: '0.8rem' }}>Parent Middle Name</label>
                <input className="counter" style={{ background: '#0f172a', padding: '10px', color: 'white', width: '100%' }} value={parentMiddleName} onChange={(e) => setParentMiddleName(e.target.value)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label className="text-dim" style={{ fontSize: '0.8rem' }}>Parent Last Name</label>
                <input className="counter" style={{ background: '#0f172a', padding: '10px', color: 'white', width: '100%' }} value={parentLastName} onChange={(e) => setParentLastName(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label className="text-dim" style={{ fontSize: '0.8rem' }}>Parent Gmail</label>
                <input className="counter" type="email" style={{ background: '#0f172a', padding: '10px', color: 'white', width: '100%' }} value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label className="text-dim" style={{ fontSize: '0.8rem' }}>Parent Password</label>
                <input className="counter" type="password" style={{ background: '#0f172a', padding: '10px', color: 'white', width: '100%' }} value={parentPassword} onChange={(e) => setParentPassword(e.target.value)} required />
              </div>
            </div>
          </div>

          {/* ACCESS KEY */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label className="text-dim" style={{ fontSize: '0.8rem' }}>Student Access Key</label>
            <input className="counter" type="password" style={{ background: '#1e293b', padding: '12px', color: 'white', width: '100%' }} value={accessKey} onChange={(e) => setAccessKey(e.target.value)} required />
          </div>

          <button type="submit" className="btn-delete" style={{ background: saving ? '#64748b' : '#10b981', marginTop: '10px', height: '45px' }} disabled={saving}>
            {saving ? 'Registering...' : 'Confirm Registration'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AddStudent
