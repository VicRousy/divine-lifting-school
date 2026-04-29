import { useState } from 'react'
import { supabase } from '../../supabaseClient'

function AddTeacher(props) {
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('') 
  const [lastName, setLastName] = useState('')

  const handleSave = async (e) => {
    e.preventDefault()
    
    // Using an ID prefix for better tracking
    const generatedStaffId = 'TCH-' + Math.floor(Math.random() * 1000);

    const { error } = await supabase
      .from('teachers')
      .insert([{ 
        first_name: firstName, 
        middle_name: middleName || '-', 
        last_name: lastName,
        staff_id: generatedStaffId,
        email: firstName.toLowerCase() + '.' + lastName.toLowerCase() + '@school.com'
      }])

    if (error) {
      props.showToast('Error: ' + error.message, 'error')
    } else {
      // SUCCESS! Clean and professional notification
      props.showToast(`${firstName} ${lastName} registered successfully!`, 'success')
      
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

          <button 
            type="submit" 
            className="btn-delete" 
            style={{ background: '#38bdf8', marginTop: '10px', height: '45px' }}
          >
            Confirm Registration
          </button>
        </form>
      </div>
    </div>
  )
}

export default AddTeacher