import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

function AddStudent(props) {
  const [fullName, setFullName] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [classes, setClasses] = useState([])
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  // We fetch the classes so the dropdown menu has options
  useEffect(() => {
    const fetchClasses = async () => {
      const { data, error } = await supabase.from('classes').select('*')
      if (!error && data) setClasses(data)
    }
    fetchClasses()
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!selectedClass) {
      setMsg('Please select a class first.')
      return
    }
    
    setLoading(true)
    setMsg('Registering student...')

    const { error } = await supabase
      .from('students')
      .insert([{ 
        full_name: fullName, 
        current_class: selectedClass,
        admission_date: new Date().toISOString().split('T')[0] // Auto-sets today's date
      }])

    setLoading(false)
    if (error) {
      setMsg('Error: ' + error.message)
    } else {
      setMsg('Student admitted successfully!')
      setFullName('')
      setSelectedClass('')
      
      // Automatically refreshes the Student Master List
      if (props.onAdd) props.onAdd();
    }
  }

  return (
    <div className="admin-table-container" style={{ maxWidth: '600px' }}>
      <div className="modal-content" style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none' }}>
        <h3 style={{ color: '#f8fafc', marginBottom: '20px' }}>Student Admission Form</h3>
        
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* Full Name Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label className="text-dim" style={{ fontSize: '0.8rem' }}>Student Full Name</label>
            <input 
              className="counter" 
              style={{ background: '#1e293b', padding: '12px', width: '100%' }}
              placeholder="e.g. John Joe Doe" 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
              required 
            />
          </div>

          {/* Class Dropdown - Pulls from your 'classes' table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label className="text-dim" style={{ fontSize: '0.8rem' }}>Assign Class</label>
            <select 
              className="counter" 
              style={{ background: '#1e293b', padding: '12px', width: '100%', color: '#f8fafc', cursor: 'pointer' }}
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              required
            >
              <option value="">-- Select a Class --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.class_name}>
                  {c.class_name}
                </option>
              ))}
            </select>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-delete" 
            style={{ background: '#38bdf8', marginTop: '10px', height: '45px' }}
          >
            {loading ? 'Processing...' : 'Admit Student'}
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

export default AddStudent