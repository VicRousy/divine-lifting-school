import { useState, useMemo, memo } from 'react'
import { supabase } from '../../supabaseClient'
import { useServerPagination } from '../../utils/useServerPagination'
import ConfirmModal from '../ConfirmModal'
import Pagination from '../Common/Pagination'

const PAGE_SIZE = 15

interface ClassListProps {
  refreshTrigger?: number
  showToast?: (msg: string, type: string) => void
}

function ClassList({ refreshTrigger, showToast }: ClassListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedClass, setSelectedClass] = useState<any>(null)

  const fetchData = useMemo(() => (rangeStart: number, rangeEnd: number) => {
    let query = supabase
      .from('classes')
      .select('id, class_name, base_fee')
      .order('class_name', { ascending: true })
      .range(rangeStart, rangeEnd)

    if (searchTerm) {
      query = query.ilike('class_name', `%${searchTerm}%`)
    }

    return query
  }, [searchTerm])

  const fetchCount = useMemo(() => () => {
    let query = supabase
      .from('classes')
      .select('id', { count: 'exact', head: true })

    if (searchTerm) {
      query = query.ilike('class_name', `%${searchTerm}%`)
    }

    return query
  }, [searchTerm])

  const {
    data: classes,
    totalPages,
    currentPage,
    loading,
    error,
    setPage,
  } = useServerPagination(fetchData, fetchCount, { pageSize: PAGE_SIZE, deps: [refreshTrigger, searchTerm] })

  const handleDeleteClick = (cls: any) => {
    setSelectedClass(cls)
    setShowModal(true)
  }

  const confirmDelete = async () => {
    try {
      const { error } = await supabase.from('classes').delete().eq('id', selectedClass.id)
      if (error) throw error
      showToast?.(`${selectedClass.class_name} has been successfully deleted.`, "success")
      setShowModal(false)
    } catch {
      showToast?.("Could not delete class. It might still have students assigned.", "error")
      setShowModal(false)
    }
  }

  if (loading) return <p className="text-dim" style={{ padding: '20px' }}>Loading classrooms...</p>

  return (
    <div className="admin-table-container">
      <input 
        type="text" 
        className="counter search-input"
        placeholder="Search classrooms..." 
        aria-label="Search classrooms"
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {error && <p style={{ color: '#ef4444', marginBottom: '10px' }}>{error}</p>}

      <div className="responsive-table-wrap">
        <table className="admin-table">
        <thead>
          <tr>
            <th scope="col">Class Name</th>
            <th scope="col">Status</th>
            <th scope="col">Tuition Fee</th>
            <th scope="col" style={{ textAlign: 'right' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {classes.length === 0 ? (
            <tr><td colSpan={4} style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>No classes found.</td></tr>
          ) : classes.map((c: any) => (
            <tr key={c.id}>
              <td>{c.class_name}</td>
              <td className="text-accent">Active</td>
              <td style={{ color: '#38bdf8', fontWeight: '500' }}>
                N{Number(c.base_fee || 0).toLocaleString()}
              </td>
              <td className="action-group" style={{ textAlign: 'right' }}>
                <button 
                  className="btn-delete" 
                  style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                  onClick={() => handleDeleteClick(c)}
                >
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
        title="Delete Class?"
        message={`Are you sure you want to delete the ${selectedClass?.class_name} classroom? All associated student records might be affected.`}
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setShowModal(false)}
        type="danger"
      />
    </div>
  )
}

export default memo(ClassList)
