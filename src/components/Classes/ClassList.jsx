import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import ConfirmModal from '../ConfirmModal'

function ClassList({ refreshTrigger, showToast }) { // Added showToast to props
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedClass, setSelectedClass] = useState(null)

  const fetchClasses = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('classes').select('*')
      if (error) throw error
      setClasses(data || [])
    } catch (err) {
      showToast("Error fetching classes: " + err.message, "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchClasses() }, [refreshTrigger])

  const handleDeleteClick = (cls) => {
    setSelectedClass(cls)
    setShowModal(true)
  }

  const confirmDelete = async () => {
    try {
      const { error } = await supabase.from('classes').delete().eq('id', selectedClass.id)
      if (error) throw error
      
      showToast(`${selectedClass.class_name} has been successfully deleted.`, "success")
      setShowModal(false)
      fetchClasses()
    } catch (err) {
      // Handles database constraint errors gracefully
      showToast("Could not delete class. It might still have students assigned.", "error")
      setShowModal(false)
    }
  }

  const filteredClasses = classes.filter(c => 
    c.class_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <p className="text-dim" style={{ padding: '20px' }}>Loading classrooms...</p>

  return (
    <div className="admin-table-container">
      <input 
        type="text" 
        className="counter search-input"
        placeholder="🔍 Search classrooms..." 
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <table className="admin-table">
        <thead>
          <tr>
            <th>Class Name</th>
            <th>Status</th>
            <th>Tuition Fee</th>
            <th style={{ textAlign: 'right' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredClasses.map(c => (
            <tr key={c.id}>
              <td>{c.class_name}</td>
              <td className="text-accent">Active</td>
              <td style={{ color: '#38bdf8', fontWeight: '500' }}>
                ₦{Number(c.base_fee || 0).toLocaleString()}
              </td>
              <td className="action-group" style={{ textAlign: 'right' }}>
                <button 
                  className="btn-delete" 
                  style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                  onClick={() => handleDeleteClick(c)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ConfirmModal 
        isOpen={showModal}
        title="Delete Class?"
        message={`Are you sure you want to delete the ${selectedClass?.class_name} classroom? All associated student records might be affected.`}
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setShowModal(false)}
        type="danger"
      />
    </div>
  )
}

export default ClassList