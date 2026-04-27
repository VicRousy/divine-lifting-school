import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

function SubjectList({ refreshTrigger }) {
  const [subjects, setSubjects] = useState([])
  const [newSubject, setNewSubject] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [targetId, setTargetId] = useState(null)

  const fetchSubjects = async () => {
    const { data } = await supabase.from('subjects').select('*').order('subject_name', { ascending: true })
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

  useEffect(() => { fetchSubjects() }, [refreshTrigger])

  const filteredSubjects = subjects.filter(s => 
    s.subject_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="admin-table-container">
      {/* HEADER SECTION: Search + Add */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
        
        {/* Search bar matching other lists */}
        <input 
          type="text" 
          className="counter search-input"
          placeholder="🔍 Filter subjects..." 
          style={{ margin: 0, maxWidth: '300px' }}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Inline Add Subject Form */}
        <div style={{ display: 'flex', gap: '10px', flex: 1, justifyContent: 'flex-end', maxWidth: '500px' }}>
          <input 
            className="counter" 
            value={newSubject} 
            onChange={(e) => setNewSubject(e.target.value)}
            placeholder="New Subject Name..."
            style={{ flex: 1, background: '#334155' , color: 'white', border: '1px solid #334155' }}
          />
          <button 
            className="btn-delete" 
            onClick={addSubject} 
            style={{ background: '#38bdf8', padding: '0 25px' }}
          >
            Add
          </button>
        </div>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Subject Name</th>
            <th style={{ textAlign: 'right' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredSubjects.map(s => (
            <tr key={s.id}>
              <td style={{ fontSize: '1.1rem', fontWeight: '500' }}>{s.subject_name}</td>
              <td style={{ textAlign: 'right' }}>
                <button 
                  className="btn-delete" 
                  style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                  onClick={() => handleDeleteClick(s.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* CONFIRMATION MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ color: '#f8fafc' }}>Remove Subject?</h3>
            <p className="text-dim" style={{ margin: '10px 0 20px' }}>Deleting this subject might affect reports and academic records.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-cancel" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-delete" style={{ flex: 1 }} onClick={confirmDelete}>Confirm Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SubjectList