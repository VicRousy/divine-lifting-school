import { useState } from 'react'
import { supabase } from '../supabaseClient'

function AddTeacher(props) {
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('') 
  const [lastName, setLastName] = useState('')
  const [msg, setMsg] = useState('')

  const handleSave = async (e) => {
    e.preventDefault()
    setMsg('Saving to database...')

    const { error } = await supabase
      .from('teachers')
      .insert([{ 
        first_name: firstName, 
        middle_name: middleName || '-', // Uses a dash if middle name is empty
        last_name: lastName,
        staff_id: 'TCH-' + Math.floor(Math.random() * 1000),
        email: firstName.toLowerCase() + '.' + lastName.toLowerCase() + '@school.com'
      }])

    if (error) {
      setMsg('Error: ' + error.message)
    } else {
      setMsg('Teacher added successfully!')
      // Clear the boxes
      setFirstName('')
      setMiddleName('') 
      setLastName('')
      
      // Tell the Dashboard to refresh the list
      if (props.onAdd) props.onAdd();
    }
  }

  return (
    <div className="admin-table-container" style={{ maxWidth: '600px' }}>
      <div className="modal-content" style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none' }}>
        <h3 style={{ color: '#f8fafc', marginBottom: '20px' }}>Register New Staff</h3>
        
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label className="text-dim" style={{ fontSize: '0.8rem' }}>First Name</label>
            <input 
              className="counter" /* Using your existing styled input feel */
              style={{ background: '#1e293b', padding: '12px', width: '100%' }}
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
              style={{ background: '#1e293b', padding: '12px', width: '100%' }}
              placeholder="e.g. Peace" 
              value={middleName} 
              onChange={(e) => setMiddleName(e.target.value)} 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label className="text-dim" style={{ fontSize: '0.8rem' }}>Last Name</label>
            <input 
              className="counter"
              style={{ background: '#1e293b', padding: '12px', width: '100%' }}
              placeholder="e.g. Peace" 
              value={lastName} 
              onChange={(e) => setLastName(e.target.value)} 
              required 
            />
          </div>

          <button 
            type="submit" 
            className="btn-delete" /* Using your styled button but we can rename it later */
            style={{ background: '#38bdf8', marginTop: '10px', height: '45px' }}
          >
            Confirm Registration
          </button>
        </form>

        {msg && (
          <p className="text-accent" style={{ marginTop: '15px', fontSize: '0.9rem', fontWeight: '500' }}>
            {msg}
          </p>
        )}
      </div>
    </div>
  )
}

export default AddTeacher