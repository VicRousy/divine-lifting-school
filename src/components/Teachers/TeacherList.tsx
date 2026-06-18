import { useState, useMemo, memo } from 'react'
import { supabase } from '../../supabaseClient'
import { useServerPagination } from '../../utils/useServerPagination'
import ConfirmModal from '../ConfirmModal'
import Pagination from '../Common/Pagination'

const PAGE_SIZE = 15

interface TeacherListProps {
  refreshTrigger?: number
  showToast?: (msg: string, type: string) => void
}

function TeacherList({ refreshTrigger, showToast }: TeacherListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [targetTeacher, setTargetTeacher] = useState<any>(null)

  const fetchData = useMemo(() => (rangeStart: number, rangeEnd: number) => {
    let query = supabase
      .from('teachers')
      .select('id, first_name, middle_name, last_name, email, login_id, staff_id, is_first_login')
      .order('id', { ascending: true })
      .range(rangeStart, rangeEnd)

    if (searchTerm) {
      const term = `%${searchTerm}%`
      query = query.or(`first_name.ilike.${term},middle_name.ilike.${term},last_name.ilike.${term}`)
    }

    return query
  }, [searchTerm])

  const fetchCount = useMemo(() => () => {
    let query = supabase
      .from('teachers')
      .select('id', { count: 'exact', head: true })

    if (searchTerm) {
      const term = `%${searchTerm}%`
      query = query.or(`first_name.ilike.${term},middle_name.ilike.${term},last_name.ilike.${term}`)
    }

    return query
  }, [searchTerm])

  const {
    data: teachers,
    totalPages,
    currentPage,
    loading,
    setPage,
  } = useServerPagination(fetchData, fetchCount, { pageSize: PAGE_SIZE, deps: [refreshTrigger, searchTerm] })

  const handleDeleteClick = (teacher: any) => {
    setTargetTeacher(teacher)
    setShowModal(true)
  }

  const confirmDelete = async () => {
    try {
      const { error } = await supabase.from('teachers').delete().eq('id', targetTeacher.id)
      if (error) throw error
      setShowModal(false)
      showToast?.('Staff member removed', 'success')
    } catch (err: any) {
      showToast?.("Error deleting staff: " + err.message, 'error')
    }
  }

  if (loading) return <p className="text-dim" style={{ padding: '20px' }}>Loading staff records...</p>

  return (
    <div className="admin-table-container">
      <input 
        type="text" 
        className="counter search-input"
        placeholder="Search staff by name..." 
        aria-label="Search staff by name"
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="responsive-table-wrap">
        <table className="admin-table">
        <thead>
          <tr>
            <th scope="col">Full Name</th>
            <th scope="col">Middle Name</th>
            <th scope="col" style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {teachers.length === 0 ? (
            <tr><td colSpan={3} style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>No staff found.</td></tr>
          ) : teachers.map((t: any) => (
            <tr key={t.id}>
              <td>{t.first_name} {t.last_name}</td>
              <td className="text-dim">{t.middle_name || '-'}</td>
              <td className="action-group">
                <button className="btn-delete" onClick={() => handleDeleteClick(t)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />

      <ConfirmModal 
        isOpen={showModal}
        title="Remove Staff Member?"
        message={`Are you sure you want to remove ${targetTeacher?.first_name} ${targetTeacher?.last_name}? This will permanently delete their record from the database.`}
        confirmText="Confirm"
        onConfirm={confirmDelete}
        onCancel={() => setShowModal(false)}
        type="danger"
      />
    </div>
  )
}

export default memo(TeacherList)
