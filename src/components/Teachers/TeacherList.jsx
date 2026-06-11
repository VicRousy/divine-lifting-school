import { useState, useEffect, memo } from 'react'
import { supabase } from '../../supabaseClient'
import ConfirmModal from '../ConfirmModal' // Import shared component

function TeacherList({ refreshTrigger, showToast }) {
  const [teachers, setTeachers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [targetTeacher, setTargetTeacher] = useState(null) // Track full teacher object
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  const fetchTeachers = async () => {
    try {
      setLoading(true)
      setFetchError('')
      const { data, error } = await supabase.from('teachers').select('*')
      if (error) throw error
      setTeachers(data || [])
    } catch (err) {
      setFetchError('Failed to load staff records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTeachers() }, [refreshTrigger])

  const handleDeleteClick = (teacher) => {
    setTargetTeacher(teacher)
    setShowModal(true)
  }

  const confirmDelete = async () => {
    try {
      const { error } = await supabase.from('teachers').delete().eq('id', targetTeacher.id)
      if (error) throw error
      setShowModal(false)
      fetchTeachers()
    } catch (err) {
      showToast("Error deleting staff: " + err.message, 'error')
    }
  }

  const filteredTeachers = teachers.filter(t => {
    const fullName = `${t.first_name} ${t.middle_name || ''} ${t.last_name}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  })

  if (loading) return <p className="text-dim" style={{ padding: '20px' }}>Loading staff records...</p>

  if (fetchError) return <p style={{ padding: '20px', color: '#ef4444', background: 'rgba(239,68,68,0.1)', borderRadius: 8 }}>{fetchError}</p>

  return (
    <div className="admin-table-container">
      <input 
        type="text" 
        className="counter search-input"
        placeholder="🔍 Search staff by name..." 
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {filteredTeachers.length === 0 ? (
        <p className="text-dim" style={{ padding: '20px', textAlign: 'center' }}>
          {searchTerm ? 'No staff match your search.' : 'No staff records found.'}
        </p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th scope="col">Full Name</th>
              <th scope="col">Middle Name</th>
              <th scope="col" style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeachers.map(t => (
              <tr key={t.id}>
                <td>{t.first_name} {t.last_name}</td>
                <td className="text-dim">{t.middle_name || '-'}</td>
                <td className="action-group">
                  <button className="btn-delete" onClick={() => handleDeleteClick(t)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* NEW UPDATED DELETE CONFIRMATION */}
      <ConfirmModal 
        isOpen={showModal}
        title="Remove Staff Member?"
        message={`Are you sure you want to remove ${targetTeacher?.first_name} ${targetTeacher?.last_name}? This will permanently delete their record from the database.`}
        confirmText="Confirm"
        onConfirm={confirmDelete}
        onCancel={() => setShowModal(false)}
        type="danger"
      />
    </div>
  )
}

export default memo(TeacherList)