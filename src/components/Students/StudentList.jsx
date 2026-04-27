import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

// Added onSelectStudent to props
function StudentList({ refreshTrigger, onUpdate, onSelectStudent }) {
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [editData, setEditData] = useState({ first_name: '', middle_name: '', last_name: '', class_id: '' })

  const fetchStudents = async () => {
    const { data } = await supabase
      .from('students')
      .select(`id, first_name, middle_name, last_name, admission_number, class_id, created_at, classes (class_name)`)
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
      middle_name: student.middle_name || '', 
      last_name: student.last_name, 
      class_id: student.class_id 
    })
    setShowEditModal(true)
  }

  const handleUpdate = async () => {
    const { error } = await supabase
      .from('students')
      .update({ 
        first_name: editData.first_name, 
        middle_name: editData.middle_name, 
        last_name: editData.last_name,
        class_id: editData.class_id 
      })
      .eq('id', selectedStudent.id)

    if (error) alert(error.message)
    else {
      fetchStudents(); setShowEditModal(false);
      if (onUpdate) onUpdate();
    }
  }

  const filteredStudents = students.filter(s => {
    const fullName = `${s.first_name} ${s.middle_name || ''} ${s.last_name}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  })

  const forceDarkStyle = {
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    border: '1px solid #334155',
    width: '100%'
  };

  return (
    <div className="admin-table-container">
      <input 
        type="text" 
        className="counter search-input"
        placeholder="🔍 Search students by name..." 
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <table className="admin-table">
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Current Class</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.map(s => (
            <tr key={s.id}>
              {/* Added onClick and styling to the name for Profile View */}
              <td 
                onClick={() => onSelectStudent && onSelectStudent(s)}
                style={{ cursor: 'pointer', fontWeight: '500' }}
                onMouseOver={(e) => e.currentTarget.style.color = '#38bdf8'}
                onMouseOut={(e) => e.currentTarget.style.color = 'inherit'}
              >
                {s.first_name} {s.middle_name ? `${s.middle_name} ` : ''}{s.last_name}
              </td>
              <td className="text-accent">{s.classes?.class_name || 'Unassigned'}</td>
              <td className="action-group">
                <button className="btn-delete" style={{ background: '#38bdf8' }} onClick={() => openEditModal(s)}>Edit / Promote</button>
                <button className="btn-delete" onClick={() => { setSelectedStudent(s); setShowDeleteModal(true); }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'left' }}>
            <h3>Edit Student & Class</h3>
            
            <div className="form-group">
              <label className="text-dim">First Name</label>
              <input 
                className="counter" 
                style={forceDarkStyle}
                value={editData.first_name} 
                onChange={(e) => setEditData({...editData, first_name: e.target.value})} 
              />
            </div>
            
            <div className="form-group">
              <label className="text-dim">Middle Name</label>
              <input 
                className="counter" 
                style={forceDarkStyle}
                value={editData.middle_name} 
                onChange={(e) => setEditData({...editData, middle_name: e.target.value})} 
              />
            </div>
            
            <div className="form-group">
              <label className="text-dim">Last Name</label>
              <input 
                className="counter" 
                style={forceDarkStyle}
                value={editData.last_name} 
                onChange={(e) => setEditData({...editData, last_name: e.target.value})} 
              />
            </div>
            
            <div className="form-group">
              <label className="text-dim">Promote to Class</label>
              <select 
                className="counter" 
                style={forceDarkStyle} 
                value={editData.class_id} 
                onChange={(e) => setFormData({...editData, class_id: e.target.value})}
              >
                <option value="" style={{ backgroundColor: '#1e293b', color: '#f8fafc' }}>-- Select Class --</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id} style={{ backgroundColor: '#1e293b', color: '#f8fafc' }}>
                    {c.class_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="action-group" style={{ marginTop: '20px' }}>
              <button className="btn-cancel" style={{ flex: 1 }} onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn-delete" style={{ flex: 1, background: '#38bdf8' }} onClick={handleUpdate}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ color: '#ef4444' }}>Delete Student?</h3>
            <p className="text-dim">This action cannot be undone.</p>
            <div className="action-group" style={{ marginTop: '20px' }}>
              <button className="btn-cancel" style={{ flex: 1 }} onClick={() => setShowDeleteModal(false)}>Back</button>
              <button className="btn-delete" style={{ flex: 1 }} onClick={async () => {
                await supabase.from('students').delete().eq('id', selectedStudent.id);
                fetchStudents();
                setShowDeleteModal(false);
              }}>Delete Forever</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentList