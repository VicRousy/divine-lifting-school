import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

function StudentList({ refreshTrigger, onUpdate }) {
  const [students, setStudents] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modals State
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)

  // Edit Form State
  const [editData, setEditData] = useState({ first_name: '', last_name: '' })

  const fetchStudents = async () => {
    const { data } = await supabase
      .from('students')
      .select(`id, first_name, last_name, admission_number, classes (class_name)`)
    setStudents(data || [])
  }

  useEffect(() => { fetchStudents() }, [refreshTrigger])

  // --- EDIT LOGIC ---
  const openEditModal = (student) => {
    setSelectedStudent(student)
    setEditData({ first_name: student.first_name, last_name: student.last_name })
    setShowEditModal(true)
  }

  const handleUpdate = async () => {
    const { error } = await supabase
      .from('students')
      .update({ first_name: editData.first_name, last_name: editData.last_name })
      .eq('id', selectedStudent.id)

    if (error) alert(error.message)
    else {
      fetchStudents()
      setShowEditModal(false)
    }
  }

  // --- DELETE LOGIC ---
  const openDeleteModal = (student) => {
    setSelectedStudent(student)
    setShowDeleteModal(true)
  }

  const handleDelete = async () => {
    const { error } = await supabase.from('students').delete().eq('id', selectedStudent.id)
    if (error) alert(error.message)
    else {
      fetchStudents()
      if (onUpdate) onUpdate()
      setShowDeleteModal(false)
    }
  }

  const filteredStudents = students.filter(s => 
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div style={{ marginTop: '20px' }}>
      <input 
        type="text" 
        placeholder="🔍 Search students..." 
        className="search-bar"
        style={{ width: '100%', marginBottom: '20px', padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: 'white' }}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <table style={{ width: '100%', borderCollapse: 'collapse', color: '#f8fafc' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #334155', textAlign: 'left', color: '#94a3b8' }}>
            <th style={{ padding: '12px' }}>Name</th>
            <th>Class</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.map(s => (
            <tr key={s.id} style={{ borderBottom: '1px solid #1e293b' }}>
              <td style={{ padding: '12px' }}>{s.first_name} {s.last_name}</td>
              <td>{s.classes?.class_name || 'No Class'}</td>
              <td style={{ display: 'flex', gap: '8px', padding: '10px 0' }}>
                <button onClick={() => openEditModal(s)} style={{ background: '#38bdf8', color: '#020617', padding: '5px 10px', fontSize: '0.7rem' }}>Edit</button>
                <button onClick={() => openDeleteModal(s)} style={{ background: '#ef4444', padding: '5px 10px', fontSize: '0.7rem' }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* --- EDIT MODAL --- */}
      {showEditModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="dashboard-card" style={{ width: '400px', textAlign: 'center' }}>
            <h3>Update Student Info</h3>
            <input 
              style={{ width: '90%', display: 'block', margin: '10px auto' }}
              value={editData.first_name} 
              onChange={(e) => setEditData({...editData, first_name: e.target.value})} 
            />
            <input 
              style={{ width: '90%', display: 'block', margin: '10px auto' }}
              value={editData.last_name} 
              onChange={(e) => setEditData({...editData, last_name: e.target.value})} 
            />
            <div style={{ marginTop: '20px' }}>
              <button onClick={() => setShowEditModal(false)} style={{ background: '#334155', marginRight: '10px' }}>Cancel</button>
              <button onClick={handleUpdate}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE MODAL (Re-using your existing one) --- */}
      {showDeleteModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="dashboard-card" style={{ width: '400px', textAlign: 'center' }}>
            <h3 style={{color: '#ef4444'}}>Confirm Delete</h3>
            <p>Delete {selectedStudent?.first_name} permanently?</p>
            <button onClick={() => setShowDeleteModal(false)} style={{ background: '#334155', marginRight: '10px' }}>Cancel</button>
            <button onClick={handleDelete} style={{ background: '#ef4444' }}>Yes, Delete</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentList