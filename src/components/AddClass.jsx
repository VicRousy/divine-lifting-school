import { useState } from 'react'
import { supabase } from '../supabaseClient'

function AddClass(props) {
  const [className, setClassName] = useState('')
  const [msg, setMsg] = useState('')

  const handleSave = async (e) => {
    e.preventDefault()
    setMsg('Creating class...')

    const { error } = await supabase
      .from('classes')
      .insert([{ 
        class_name: className 
      }])

    if (error) {
      setMsg('Error: ' + error.message)
    } else {
      setMsg('Class "' + className + '" added successfully!')
      setClassName('')
      
      // Refreshes the list in Classroom Manager automatically
      if (props.onAdd) props.onAdd();
    }
  }

  return (
    <div className="admin-table-container" style={{ maxWidth: '500px' }}>
      <div className="modal-content" style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none' }}>
        <h3 style={{ color: '#f8fafc', marginBottom: '20px' }}>Register New Class</h3>
        
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label className="text-dim" style={{ fontSize: '0.8rem' }}>Class Name</label>
            <input 
              className="counter" 
              style={{ background: '#1e293b', padding: '12px', width: '100%' }}
              placeholder="e.g. Basic 5" 
              value={className} 
              onChange={(e) => setClassName(e.target.value)} 
              required 
            />
          </div>

          <button 
            type="submit" 
            className="btn-delete" 
            style={{ background: '#38bdf8', marginTop: '10px', height: '45px' }}
          >
            Save Class
          </button>
        </form>

        {msg && (
          <p className="text-accent" style={{ marginTop: '15px', fontSize: '0.9rem' }}>
            {msg}
          </p>
        )}
      </div>
    </div>
  )
}

export default AddClass