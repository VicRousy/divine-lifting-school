import { useState, useEffect, useMemo, memo } from 'react'
import { supabase } from '../../supabaseClient'
import { safeQuery } from '../../utils/safeQuery'
import { useServerPagination } from '../../utils/useServerPagination'
import ConfirmModal from '../ConfirmModal'
import Pagination from '../Common/Pagination'

const PAGE_SIZE = 15

interface StudentListProps {
  refreshTrigger?: number
  onUpdate?: () => void
  onStudentSelect?: (student: any) => void
  showToast?: (msg: string, type: string) => void
  requireReAuth?: (desc: string, cb: () => void) => void
}

const StudentList = memo(function StudentList({ refreshTrigger, onUpdate, onStudentSelect, showToast }: StudentListProps) {
  const [classes, setClasses] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [editData, setEditData] = useState({ first_name: '', middle_name: '', last_name: '', class_id: '' })

  const fetchClasses = async () => {
    const { data } = await safeQuery(() => supabase.from('classes').select('id, class_name').order('class_name'))
    setClasses(data || [])
  }

  const fetchData = useMemo(() => (rangeStart: number, rangeEnd: number) => {
    let query = supabase
      .from('students')
      .select('id, first_name, middle_name, last_name, admission_number, class_id, created_at, classes (class_name)')
      .order('created_at', { ascending: false })
      .range(rangeStart, rangeEnd)

    if (searchTerm) {
      const term = `%${searchTerm}%`
      query = query.or(`first_name.ilike.${term},middle_name.ilike.${term},last_name.ilike.${term}`)
    }

    return query
  }, [searchTerm])

  const fetchCount = useMemo(() => () => {
    let query = supabase
      .from('students')
      .select('id', { count: 'exact', head: true })

    if (searchTerm) {
      const term = `%${searchTerm}%`
      query = query.or(`first_name.ilike.${term},middle_name.ilike.${term},last_name.ilike.${term}`)
    }

    return query
  }, [searchTerm])

  const {
    data: students,
    totalPages,
    currentPage,
    loading,
    setPage,
  } = useServerPagination(fetchData, fetchCount, { pageSize: PAGE_SIZE, deps: [refreshTrigger, searchTerm] })

  useEffect(() => { 
    fetchClasses() 
  }, [refreshTrigger])

  const openEditModal = (student: any) => {
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
    await safeQuery(() => supabase
      .from('students')
      .update({ 
        first_name: editData.first_name, 
        middle_name: editData.middle_name, 
        last_name: editData.last_name,
        class_id: editData.class_id 
      })
      .eq('id', selectedStudent.id))
    showToast?.(`${editData.first_name}'s profile updated!`, 'success')
    setShowEditModal(false)
    if (onUpdate) onUpdate()
  }

  const handleDelete = async () => {
    await safeQuery(() => supabase.from('students').delete().eq('id', selectedStudent.id))
    showToast?.(`${selectedStudent.first_name} removed from registry.`, "success")
    setShowDeleteModal(false)
    if (onUpdate) onUpdate()
  }

  const forceDarkStyle = {
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    border: '1px solid #334155',
    width: '100%'
  }

  return (
    <div className="admin-table-container">
      <input 
        type="text" 
        className="counter search-input"
        placeholder="Search students by name..." 
        aria-label="Search students by name"
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="responsive-table-wrap">
        <table className="admin-table">
        <thead>
          <tr>
            <th scope="col">Full Name</th>
            <th scope="col">Current Class</th>
            <th scope="col" style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr><td colSpan={3} style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>Loading...</td></tr>
          )}
          {!loading && students.length === 0 && (
            <tr><td colSpan={3} style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>No students found.</td></tr>
          )}
          {!loading && students.map((s: any) => (
            <tr key={s.id}>
              <td 
                onClick={() => onStudentSelect && onStudentSelect(s)}
                style={{ cursor: 'pointer', fontWeight: '500' }}
                onMouseOver={(e) => e.currentTarget.style.color = '#38bdf8'}
                onMouseOut={(e) => e.currentTarget.style.color = 'inherit'}
              >
                {s.first_name} {s.middle_name ? `${s.middle_name} ` : ''}{s.last_name}
              </td>
              <td className="text-accent">{s.classes?.class_name || 'Unassigned'}</td>
              <td className="action-group" style={{ textAlign: 'right' }}>
                <button className="btn-edit" onClick={() => openEditModal(s)}>Edit / Promote</button>
                <button className="btn-delete" onClick={() => { setSelectedStudent(s); setShowDeleteModal(true); }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />

      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'left' }}>
            <h3 style={{ color: '#f8fafc', marginBottom: '20px' }}>Edit Student & Class</h3>
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label className="text-dim">First Name</label>
              <input className="counter" style={forceDarkStyle} value={editData.first_name} onChange={(e) => setEditData({...editData, first_name: e.target.value})} />
            </div>
            
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label className="text-dim">Middle Name</label>
              <input className="counter" style={forceDarkStyle} value={editData.middle_name} onChange={(e) => setEditData({...editData, middle_name: e.target.value})} />
            </div>
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label className="text-dim">Last Name</label>
              <input className="counter" style={forceDarkStyle} value={editData.last_name} onChange={(e) => setEditData({...editData, last_name: e.target.value})} />
            </div>
            <div className="form-group" style={{ marginBottom: '25px' }}>
              <label className="text-dim">Promote to Class</label>
              <select 
                className="counter" 
                style={forceDarkStyle} 
                value={editData.class_id} 
                onChange={(e) => setEditData({...editData, class_id: e.target.value})}
              >
                <option value="">-- Select Class --</option>
                {classes.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.class_name}</option>
                ))}
              </select>
            </div>
            <div className="action-group" style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-cancel" style={{ flex: 1 }} onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn-delete" style={{ flex: 1, background: '#38bdf8' }} onClick={handleUpdate}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={showDeleteModal}
        title="Delete Student?"
        message={`Are you sure you want to permanently delete ${selectedStudent?.first_name} ${selectedStudent?.last_name}? This action cannot be undone.`}
        confirmText="Confirm Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        type="danger"
      />
    </div>
  )
})

export default StudentList
