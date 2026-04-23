import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

function StudentList({ refreshTrigger, onUpdate }) {
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  
  // Added middle_name to the state
  const [editData, setEditData] = useState({ first_name: '', middle_name: '', last_name: '', class_id: '' })

  const fetchStudents = async () => {
    const { data } = await supabase
      .from('students')
      // Make sure to select middle_name from Supabase!
      .select(`id, first_name, middle_name, last_name, admission_number, class_id, classes (class_name)`)
    setStudents(data || [])
  }

  const fetchClasses = async () => {
    const { data } = await supabase.from('classes').select('id, class_name')
    setClasses(data || [])
  }

  useEffect(() => { 
    fetchStudents()
    fetchClasses() 
  }, [refreshTrigger])

  const openEditModal = (student) => {
    setSelectedStudent(student)
    setEditData({ 
      first_name: student.first_name, 
      middle_name: student.middle_name || '', // Handle null values
      last_name: student.last_name, 
      class_id: student.class_id 
    })
    setShowEditModal(true)
  }

  const openDeleteModal = (student) => {
    setSelectedStudent(student)
    setShowDeleteModal(true)
  }

  const handleUpdate = async () => {
    const { error } = await supabase
      .from('students')
      .update({ 
        first_name: editData.first_name, 
        middle_name: editData.middle_name, // Added this
        last_name: editData.last_name,
        class_id: editData.class_id 
      })
      .eq('id', selectedStudent.id)

    if (error) alert(error.message)
    else {
      fetchStudents()
      setShowEditModal(false)
      if (onUpdate) onUpdate()
    }
  }

  const handleDelete = async () => {
    const { error } = await supabase.from('students').delete().eq('id', selectedStudent.id)
    if (error) alert(error.message)
    else {
      fetchStudents()
      setShowDeleteModal(false)
      if (onUpdate) onUpdate()
    }
  }

  // Filter now checks all three names
  const filteredStudents = students.filter(s => 
    `${s.first_name} ${s.middle_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div style={{ marginTop: '20px' }}>
      <input 
        type="text" 
        placeholder="🔍 Search students..." 
        style={{ width: '100%', marginBottom: '20px', padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: 'white' }}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <table style={{ width: '100%', borderCollapse: 'collapse', color: '#f8fafc' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #334155', textAlign: 'left', color: '#94a3b8' }}>
            <th style={{ padding: '12px' }}>Full Name</th>
            <th>Current Class</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.map(s => (
            <tr key={s.id} style={{ borderBottom: '1px solid #1e293b' }}>
              <td style={{ padding: '12px' }}>
                {/* Shows Middle Name if it exists */}
                {s.first_name} {s.middle_name ? `${s.middle_name} ` : ''}{s.last_name}
              </td>
              <td>{s.classes?.class_name || 'Unassigned'}</td>
              <td style={{ display: 'flex', gap: '8px', padding: '10px 0' }}>
                <button onClick={() => openEditModal(s)} style={{ background: '#38bdf8', color: '#020617', padding: '5px 10px', fontSize: '0.7rem', cursor: 'pointer' }}>Edit / Promote</button>
                <button onClick={() => openDeleteModal(s)} style={{ background: '#ef4444', color: 'white', padding: '5px 10px', fontSize: '0.7rem', cursor: 'pointer' }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* --- EDIT MODAL --- */}
      {showEditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="dashboard-card" style={{ width: '400px', textAlign: 'center' }}>
            <h3>Edit Student & Class</h3>
            <input placeholder="First Name" style={{ width: '90%', display: 'block', margin: '10px auto' }} value={editData.first_name} onChange={(e) => setEditData({...editData, first_name: e.target.value})} />
            
            {/* Added Middle Name Input */}
            <input placeholder="Middle Name" style={{ width: '90%', display: 'block', margin: '10px auto' }} value={editData.middle_name} onChange={(e) => setEditData({...editData, middle_name: e.target.value})} />
            
            <input placeholder="Last Name" style={{ width: '90%', display: 'block', margin: '10px auto' }} value={editData.last_name} onChange={(e) => setEditData({...editData, last_name: e.target.value})} />
            
            <select style={{ width: '90%', display: 'block', margin: '10px auto', padding: '10px', background: '#0f172a', color: 'white' }} value={editData.class_id} onChange={(e) => setEditData({...editData, class_id: e.target.value})}>
              <option value="">-- Select Class --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
            </select>
            <div style={{ marginTop: '20px' }}>
              <button onClick={() => setShowEditModal(false)} style={{ background: '#334155', marginRight: '10px' }}>Cancel</button>
              <button onClick={handleUpdate}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE MODAL --- */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="dashboard-card" style={{ width: '400px', textAlign: 'center' }}>
            <h3 style={{ color: '#ef4444' }}>Delete Record?</h3>
            <p>Are you sure you want to delete {selectedStudent?.first_name}?</p>
            <div style={{ marginTop: '20px' }}>
              <button onClick={() => setShowDeleteModal(false)} style={{ background: '#334155', marginRight: '10px' }}>Cancel</button>
              <button onClick={handleDelete} style={{ background: '#ef4444' }}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentList