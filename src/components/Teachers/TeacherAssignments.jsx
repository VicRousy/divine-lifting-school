import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

function TeacherAssignments({ refreshTrigger }) {
  const [teachers, setTeachers] = useState([])
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({ teacher_id: '', class_id: '', subject_id: '' })

  const fetchData = async () => {
    const { data: t } = await supabase.from('teachers').select('id, first_name, last_name')
    const { data: c } = await supabase.from('classes').select('id, class_name')
    const { data: s } = await supabase.from('subjects').select('id, subject_name')
    
    // Updated selection to get the actual names from joined tables
    const { data: a } = await supabase.from('teacher_assignments').select(`
      id,
      teachers (first_name, last_name),
      classes (class_name),
      subjects (subject_name)
    `)

    setTeachers(t || [])
    setClasses(c || [])
    setSubjects(s || [])
    setAssignments(a || [])
  }

  useEffect(() => { fetchData() }, [refreshTrigger])

  const handleAssign = async () => {
    if (!formData.teacher_id || !formData.class_id || !formData.subject_id) {
      alert("Please ensure all fields are selected.")
      return
    }

    setLoading(true)
    const payload = {
      teacher_id: parseInt(formData.teacher_id),
      class_id: parseInt(formData.class_id),
      subject_id: parseInt(formData.subject_id)
    }

    const { error } = await supabase.from('teacher_assignments').insert([payload])
    
    if (error) {
      alert(error.code === '23505' ? "This assignment already exists." : "Error: " + error.message)
    } else {
      setFormData({ teacher_id: '', class_id: '', subject_id: '' })
      fetchData()
    }
    setLoading(false)
  }

  const removeAssignment = async (id) => {
    const { error } = await supabase.from('teacher_assignments').delete().eq('id', id)
    if (!error) fetchData()
  }

  return (
    <div className="admin-table-container" style={{ marginTop: '20px', background: 'rgba(255,255,255,0.02)' }}>
      <h3 style={{ color: '#f8fafc', marginBottom: '20px' }}>Teacher Assignments</h3>
      
      {/* The Dropdown Row - Now fully connected to logic */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <select 
          className="counter" 
          style={{ flex: 1, background: '#1e293b', color: 'white' }}
          value={formData.teacher_id}
          onChange={(e) => setFormData({...formData, teacher_id: e.target.value})}
        >
          <option value="">Select Teacher</option>
          {teachers.map(t => (
            <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
          ))}
        </select>

        <select 
          className="counter" 
          style={{ flex: 1, background: '#1e293b', color: 'white' }}
          value={formData.class_id}
          onChange={(e) => setFormData({...formData, class_id: e.target.value})}
        >
          <option value="">Select Class</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.class_name}</option>
          ))}
        </select>

        <select 
          className="counter" 
          style={{ flex: 1, background: '#1e293b', color: 'white' }}
          value={formData.subject_id}
          onChange={(e) => setFormData({...formData, subject_id: e.target.value})}
        >
          <option value="">Select Subject</option>
          {subjects.map(s => (
            <option key={s.id} value={s.id}>{s.subject_name}</option>
          ))}
        </select>

        <button 
          className="btn-delete" 
          onClick={handleAssign}
          disabled={loading}
          style={{ background: '#38bdf8', padding: '0 30px' }}
        >
          {loading ? 'Assigning...' : 'Assign Role'}
        </button>
      </div>

      <table className="admin-table">
        <thead>
          <tr style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
            <th>Staff Member</th>
            <th>Assigned Class</th>
            <th>Subject</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((asgn) => (
            <tr key={asgn.id}>
              {/* Mapping nested Supabase data */}
              <td style={{ fontWeight: '600' }}>
                {asgn.teachers?.first_name} {asgn.teachers?.last_name}
              </td>
              <td><span className="text-accent">{asgn.classes?.class_name}</span></td>
              <td className="text-dim">{asgn.subjects?.subject_name}</td>
              <td style={{ textAlign: 'right' }}>
                <button 
                  className="btn-delete" 
                  onClick={() => removeAssignment(asgn.id)}
                  style={{ padding: '5px 15px', fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default TeacherAssignments