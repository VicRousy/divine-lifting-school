import { useState } from 'react'
import { supabase } from '../supabaseClient'

function AddClass(props) {
  const [className, setClassName] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg('Creating class...')

    const { error } = await supabase
      .from('classes')
      .insert([{ class_name: className }])

    setLoading(false)
    if (error) {
      setMsg('Error: ' + error.message)
    } else {
      setMsg('Class "' + className + '" added successfully!')
      setClassName('')
      if (props.onAdd) props.onAdd();
    }
  }

  return (
    <div className="admin-table-container" style={{ maxWidth: '500px' }}>
      <div className="modal-content" style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '0' }}>
        <h3 style={{ color: '#f8fafc', marginBottom: '20px' }}>Register New Class</h3>
        
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="text-dim" style={{ fontSize: '0.8rem' }}>Class Name</label>
            <input 
              className="counter" 
              style={{ background: '#1e293b', width: '100%' }}
              placeholder="e.g. Basic 5" 
              value={className} 
              onChange={(e) => setClassName(e.target.value)} 
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-delete" 
            style={{ background: '#38bdf8', width: '100%', marginTop: '10px', height: '45px' }}
          >
            {loading ? 'Saving...' : 'Save Class'}
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