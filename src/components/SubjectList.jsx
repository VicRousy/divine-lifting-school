import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

function SubjectList() {
  const [subjects, setSubjects] = useState([])
  const [newSubject, setNewSubject] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [targetId, setTargetId] = useState(null)

  const fetchSubjects = async () => {
    const { data } = await supabase.from('subjects').select('*')
    setSubjects(data || [])
  }

  const addSubject = async () => {
    if (!newSubject) return
    try {
      const { error } = await supabase.from('subjects').insert([{ subject_name: newSubject }])
      if (error) throw error
      setNewSubject('')
      fetchSubjects()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDeleteClick = (id) => {
    setTargetId(id)
    setShowModal(true)
  }

  const confirmDelete = async () => {
    await supabase.from('subjects').delete().eq('id', targetId)
    setShowModal(false)
    fetchSubjects()
  }

  useEffect(() => { fetchSubjects() }, [])

  return (
    <div className="admin-table-container">
      {/* ADD SUBJECT SECTION - Styled to match Staff/Class forms */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', maxWidth: '600px' }}>
        <input 
          className="counter" 
          value={newSubject} 
          onChange={(e) => setNewSubject(e.target.value)}
          placeholder="Enter Subject Name (e.g. Mathematics)"
          style={{ flex: 1, background: '#1e293b', padding: '12px' }}
        />
        <button 
          className="btn-delete" 
          onClick={addSubject} 
          style={{ background: '#38bdf8', padding: '0 30px', height: '48px' }}
        >
          Add
        </button>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Subject Name</th>
            <th style={{ textAlign: 'right' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map(s => (
            <tr key={s.id}>
              <td>{s.subject_name}</td>
              <td style={{ textAlign: 'right' }}>
                <button className="btn-delete" onClick={() => handleDeleteClick(s.id)}>
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
            <h3 style={{ color: '#f8fafc' }}>Remove Subject?</h3>
            <p className="text-dim" style={{ margin: '10px 0 20px' }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-cancel" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-delete" style={{ flex: 1 }} onClick={confirmDelete}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SubjectList