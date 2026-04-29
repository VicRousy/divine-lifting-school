import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import ConfirmModal from '../ConfirmModal'

function SubjectList({ refreshTrigger, showToast }) { // Destructured showToast from props
  const [subjects, setSubjects] = useState([])
  const [newSubject, setNewSubject] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState(null)

  const fetchSubjects = async () => {
    const { data } = await supabase.from('subjects').select('*').order('subject_name', { ascending: true })
    setSubjects(data || [])
  }

  const addSubject = async () => {
    if (!newSubject) return
    try {
      const { error } = await supabase.from('subjects').insert([{ subject_name: newSubject }])
      if (error) throw error
      
      showToast(`"${newSubject}" added to curriculum`, 'success') // Nice success toast
      setNewSubject('')
      fetchSubjects()
    } catch (err) {
      showToast(err.message, 'error') // Toast for errors instead of alert
    }
  }

  const handleDeleteClick = (subject) => {
    setSelectedSubject(subject)
    setShowModal(true)
  }

  const confirmDelete = async () => {
    try {
      const { error } = await supabase.from('subjects').delete().eq('id', selectedSubject.id)
      if (error) throw error
      
      showToast(`${selectedSubject.subject_name} has been removed`, 'success')
      setShowModal(false)
      fetchSubjects()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  useEffect(() => { fetchSubjects() }, [refreshTrigger])

  const filteredSubjects = subjects.filter(s => 
    s.subject_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="admin-table-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          className="counter search-input"
          placeholder="🔍 Filter subjects..." 
          style={{ margin: 0, maxWidth: '300px' }}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

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
                  onClick={() => handleDeleteClick(s)}
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
        title="Remove Subject?"
        message={`Are you sure you want to delete ${selectedSubject?.subject_name}? Deleting this subject might affect reports and academic records.`}
        confirmText="Confirm Delete"
        onConfirm={confirmDelete}
        onCancel={() => setShowModal(false)}
        type="danger"
      />
    </div>
  )
}

export default SubjectList