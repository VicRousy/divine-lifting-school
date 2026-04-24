import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

function TeacherList({ refreshTrigger }) {
  const [teachers, setTeachers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [targetId, setTargetId] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchTeachers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('teachers').select('*')
      if (error) throw error
      setTeachers(data || [])
    } catch (err) {
      console.error("Staff fetch failed:", err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTeachers() }, [refreshTrigger])

  const handleDeleteClick = (id) => {
    setTargetId(id)
    setShowModal(true)
  }

  const confirmDelete = async () => {
    try {
      const { error } = await supabase.from('teachers').delete().eq('id', targetId)
      if (error) throw error
      setShowModal(false)
      fetchTeachers()
    } catch (err) {
      alert("Error deleting staff: " + err.message)
    }
  }

  // Filter teachers based on first, middle, or last name
  const filteredTeachers = teachers.filter(t => {
    const fullName = `${t.first_name} ${t.middle_name || ''} ${t.last_name}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  })

  if (loading) return <p className="text-dim" style={{ padding: '20px' }}>Loading staff records...</p>

  return (
    <div className="admin-table-container">
      {/* SEARCH BAR */}
      <input 
        type="text" 
        className="counter search-input"
        placeholder="🔍 Search staff by name..." 
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <table className="admin-table">
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Middle Name</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredTeachers.map(t => (
            <tr key={t.id}>
              <td>{t.first_name} {t.last_name}</td>
              <td className="text-dim">{t.middle_name || '-'}</td>
              <td className="action-group">
                {/* Space for an Edit button later if needed */}
                <button className="btn-delete" onClick={() => handleDeleteClick(t.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* DELETE CONFIRMATION MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ color: '#ef4444' }}>Remove Staff Member?</h3>
            <p className="text-dim" style={{ margin: '15px 0 25px' }}>
              This will permanently delete this record from the database.
            </p>
            <div className="action-group">
              <button className="btn-cancel" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn-delete" style={{ flex: 1 }} onClick={confirmDelete}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeacherList