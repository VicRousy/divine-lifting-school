import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

function StudentList({ refreshTrigger, onUpdate }) {
  const [students, setStudents] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  
  // --- NEW STATE FOR CUSTOM MODAL ---
  const [showModal, setShowModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select(`id, first_name, last_name, admission_number, classes (class_name)`)
    if (error) console.log(error)
    else setStudents(data || [])
  }

  useEffect(() => { fetchStudents() }, [refreshTrigger])

  const confirmDelete = (student) => {
    setSelectedStudent(student)
    setShowModal(true) // Open our custom pop-up
  }

  const handleDelete = async () => {
    const { error } = await supabase.from('students').delete().eq('id', selectedStudent.id)
    if (error) {
      alert(error.message)
    } else {
      fetchStudents()
      if (onUpdate) onUpdate() // Refresh the dashboard numbers!
      setShowModal(false) // Close pop-up
    }
  }

  const filteredStudents = students.filter(s => 
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div style={{ marginTop: '20px', position: 'relative' }}>
      {/* Search Bar */}
      <input 
        type="text" 
        placeholder="🔍 Search students..." 
        style={{ width: '100%', marginBottom: '20px', padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: 'white' }}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', color: '#f8fafc' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #334155', textAlign: 'left', color: '#94a3b8' }}>
            <th style={{ padding: '12px' }}>Name</th>
            <th>Class</th>
            <th>ID</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.map(s => (
            <tr key={s.id} style={{ borderBottom: '1px solid #1e293b' }}>
              <td style={{ padding: '12px' }}>{s.first_name} {s.last_name}</td>
              <td>{s.classes?.class_name || 'No Class'}</td>
              <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{s.admission_number}</td>
              <td>
                <button 
                  onClick={() => confirmDelete(s)}
                  style={{ background: '#ef4444', padding: '6px 12px', fontSize: '0.7rem', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* --- CUSTOM MODAL POP-UP --- */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#1e293b', padding: '30px', borderRadius: '16px', border: '1px solid #334155',
            textAlign: 'center', maxWidth: '400px', width: '90%'
          }}>
            <h3 style={{ color: '#f8fafc' }}>Confirm Delete</h3>
            <p style={{ color: '#94a3b8' }}>Are you sure you want to remove <strong>{selectedStudent?.first_name}</strong> from the school records?</p>
            <div style={{ marginTop: '25px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: '#334155', color: 'white' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                style={{ background: '#ef4444', color: 'white' }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentList