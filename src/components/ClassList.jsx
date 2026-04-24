import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

function ClassList({ refreshTrigger }) {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [targetId, setTargetId] = useState(null)

  const fetchClasses = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('classes').select('*')
      if (error) throw error
      setClasses(data || [])
    } catch (err) {
      console.error("Class fetch error:", err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchClasses() }, [refreshTrigger])

  const handleDeleteClick = (id) => {
    setTargetId(id)
    setShowModal(true)
  }

  const confirmDelete = async () => {
    try {
      const { error } = await supabase.from('classes').delete().eq('id', targetId)
      if (error) throw error
      setShowModal(false)
      fetchClasses()
    } catch (err) {
      alert("Error: " + err.message)
    }
  }

  if (loading) return <p className="text-dim" style={{ padding: '20px' }}>Loading classrooms...</p>

  return (
    <div className="admin-table-container">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Class Name</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {classes.map(c => (
            <tr key={c.id}>
              <td>{c.class_name}</td>
              <td className="text-accent">Active</td>
              <td>
                <button className="btn-delete" onClick={() => handleDeleteClick(c.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Delete Class?</h3>
            <p className="text-dim">Removing this classroom is permanent.</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn-cancel" style={{flex: 1}} onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-delete" style={{flex: 1}} onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClassList