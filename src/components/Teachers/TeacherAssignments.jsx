import { useState, useEffect, memo } from 'react'
import { supabase } from '../../supabaseClient'
import { safeQuery } from '../../utils/safeQuery'
import ConfirmModal from '../ConfirmModal'

function TeacherAssignments({ refreshTrigger, showToast }) { // Destructured showToast
  const [teachers, setTeachers] = useState([])
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [fetching, setFetching] = useState(true)
  
  const [showConfirm, setShowConfirm] = useState(false)
  const [targetAssignment, setTargetAssignment] = useState(null)

  const [formData, setFormData] = useState({ teacher_id: '', class_id: '', subject_id: '' })

  const fetchData = async () => {
    setFetching(true)
    setFetchError('')
    const { data: t, error: te } = await safeQuery(() => supabase.from('teachers').select('id, first_name, last_name'))
    const { data: c, error: ce } = await safeQuery(() => supabase.from('classes').select('id, class_name'))
    const { data: s, error: se } = await safeQuery(() => supabase.from('subjects').select('id, subject_name'))
    
    const { data: a, error: ae } = await safeQuery(() => supabase.from('teacher_assignments').select(`
      id,
      teachers (first_name, last_name),
      classes (class_name),
      subjects (subject_name)
    `))

    if (te || ce || se || ae) setFetchError('Failed to load data.')

    setTeachers(t || [])
    setClasses(c || [])
    setSubjects(s || [])
    setAssignments(a || [])
    setFetching(false)
  }

  useEffect(() => { fetchData() }, [refreshTrigger])

  const handleAssign = async () => {
    if (!formData.teacher_id || !formData.class_id || !formData.subject_id) {
      showToast("Please ensure all fields are selected.", "error")
      return
    }

    setLoading(true)
    const payload = {
      teacher_id: parseInt(formData.teacher_id),
      class_id: parseInt(formData.class_id),
      subject_id: parseInt(formData.subject_id)
    }

    await safeQuery(() => supabase.from('teacher_assignments').insert([payload]))
    
    showToast("Role assigned successfully!", "success")
    setFormData({ teacher_id: '', class_id: '', subject_id: '' })
    fetchData()
    setLoading(false)
  }

  const initiateRemove = (asgn) => {
    setTargetAssignment(asgn)
    setShowConfirm(true)
  }

  const confirmRemove = async () => {
    await safeQuery(() => supabase.from('teacher_assignments').delete().eq('id', targetAssignment.id))
    showToast("Assignment removed.", "success")
    fetchData()
    setShowConfirm(false)
  }

  return (
    <div className="admin-table-container" style={{ marginTop: '20px', background: 'rgba(255,255,255,0.02)' }}>
      <h3 style={{ color: '#f8fafc', marginBottom: '20px' }}>Teacher Role Management</h3>
      
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

      {fetching ? (
        <p className="text-dim" style={{ padding: '20px', textAlign: 'center' }}>Loading assignments...</p>
      ) : fetchError ? (
        <p style={{ padding: '20px', textAlign: 'center', color: '#ef4444', background: 'rgba(239,68,68,0.1)', borderRadius: 8 }}>{fetchError}</p>
      ) : assignments.length === 0 ? (
        <p className="text-dim" style={{ padding: '20px', textAlign: 'center' }}>No assignments yet. Use the form above to assign a role.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
              <th scope="col">Staff Member</th>
              <th scope="col">Assigned Class</th>
              <th scope="col">Subject</th>
              <th scope="col" style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((asgn) => (
              <tr key={asgn.id}>
                <td style={{ fontWeight: '600' }}>
                  {asgn.teachers?.first_name} {asgn.teachers?.last_name}
                </td>
                <td><span className="text-accent">{asgn.classes?.class_name}</span></td>
                <td className="text-dim">{asgn.subjects?.subject_name}</td>
                <td style={{ textAlign: 'right' }}>
                  <button 
                    className="btn-delete" 
                    onClick={() => initiateRemove(asgn)}
                    style={{ padding: '5px 15px', fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ConfirmModal 
        isOpen={showConfirm}
        title="Remove Assignment?"
        message={`Are you sure you want to remove ${targetAssignment?.teachers?.first_name} from teaching ${targetAssignment?.subjects?.subject_name} in ${targetAssignment?.classes?.class_name}?`}
        confirmText="Remove Role"
        onConfirm={confirmRemove}
        onCancel={() => setShowConfirm(false)}
        type="danger"
      />
    </div>
  )
}

export default memo(TeacherAssignments)