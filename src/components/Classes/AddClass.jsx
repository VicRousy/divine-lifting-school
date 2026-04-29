import { useState } from 'react'
import { supabase } from '../../supabaseClient'

function AddClass(props) {
  const [className, setClassName] = useState('')
  const [baseFee, setBaseFee] = useState('50000') 
  const [loading, setLoading] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase
      .from('classes')
      .insert([{ 
        class_name: className,
        base_fee: parseFloat(baseFee) 
      }])

    setLoading(false)
    
    if (error) {
      props.showToast('Error: ' + error.message, 'error')
    } else {
      // SUCCESS! Using the toast for a clean finish
      const formattedFee = parseFloat(baseFee).toLocaleString();
      props.showToast(`${className} added with tuition fee of ₦${formattedFee}`, 'success')
      
      setClassName('')
      setBaseFee('50000') // Reset to default
      
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
              style={{ background: '#1e293b', color: 'white', width: '100%' }}
              placeholder="e.g. Basic 5" 
              value={className} 
              onChange={(e) => setClassName(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group" style={{ marginTop: '15px' }}>
            <label className="text-dim" style={{ fontSize: '0.8rem' }}>Standard Tuition Fee (₦)</label>
            <input 
              type="number"
              className="counter" 
              style={{ background: '#1e293b', color: 'white', width: '100%' }}
              placeholder="50000" 
              value={baseFee} 
              onChange={(e) => setBaseFee(e.target.value)} 
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-delete" 
            style={{ background: '#38bdf8', width: '100%', marginTop: '20px', height: '45px' }}
          >
            {loading ? 'Saving...' : 'Save Class'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AddClass