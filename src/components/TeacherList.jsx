import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

function TeacherList({ refreshTrigger }) {
  const [teachers, setTeachers] = useState([])
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

  if (loading) return <p className="text-dim" style={{ padding: '20px' }}>Loading staff records...</p>

  return (
  <div className="admin-table-container" >
    {/* MAKE SURE THIS HAS THE CLASSNAME */}
    <table className="admin-table">
      <thead>
        <tr>
          <th>Full Name</th>
          <th>Middle Name</th>
          <th style={{ textAlign: 'right' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {teachers.map(t => (
          <tr key={t.id}>
            <td>{t.first_name} {t.last_name}</td>
            <td className="text-dim">{t.middle_name || '-'}</td>
            <td style={{ textAlign: 'right' }}>
              <button className="btn-delete" onClick={() => handleDeleteClick(t.id)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)
}

export default TeacherList