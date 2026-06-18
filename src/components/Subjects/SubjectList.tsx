import { useState, useMemo, memo } from 'react'
import { supabase } from '../../supabaseClient'
import { safeQuery } from '../../utils/safeQuery'
import { useServerPagination } from '../../utils/useServerPagination'
import ConfirmModal from '../ConfirmModal'
import Pagination from '../Common/Pagination'

const PAGE_SIZE = 15

interface SubjectListProps {
  refreshTrigger?: number
  showToast?: (msg: string, type: string) => void
}

function SubjectList({ refreshTrigger, showToast }: SubjectListProps) {
  const [newSubject, setNewSubject] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<any>(null)

  const fetchData = useMemo(() => (rangeStart: number, rangeEnd: number) => {
    let query = supabase
      .from('subjects')
      .select('id, subject_name')
      .order('subject_name', { ascending: true })
      .range(rangeStart, rangeEnd)

    if (searchTerm) {
      query = query.ilike('subject_name', `%${searchTerm}%`)
    }

    return query
  }, [searchTerm])

  const fetchCount = useMemo(() => () => {
    let query = supabase
      .from('subjects')
      .select('id', { count: 'exact', head: true })

    if (searchTerm) {
      query = query.ilike('subject_name', `%${searchTerm}%`)
    }

    return query
  }, [searchTerm])

  const {
    data: subjects,
    totalPages,
    currentPage,
    loading,
    error,
    setPage,
  } = useServerPagination(fetchData, fetchCount, { pageSize: PAGE_SIZE, deps: [refreshTrigger, searchTerm] })

  const addSubject = async () => {
    if (!newSubject) return
    try {
      const { error } = await supabase.from('subjects').insert([{ subject_name: newSubject }])
      if (error) throw error
      showToast?.(`"${newSubject}" added to curriculum`, 'success')
      setNewSubject('')
    } catch (err: any) {
      showToast?.(err.message, 'error')
    }
  }

  const handleDeleteClick = (subject: any) => {
    setSelectedSubject(subject)
    setShowModal(true)
  }

  const confirmDelete = async () => {
    try {
      const { error } = await supabase.from('subjects').delete().eq('id', selectedSubject.id)
      if (error) throw error
      showToast?.(`${selectedSubject.subject_name} has been removed`, 'success')
      setShowModal(false)
    } catch (err: any) {
      showToast?.(err.message, 'error')
    }
  }

  return (
    <div className="admin-table-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          className="counter search-input"
          placeholder="Filter subjects..." 
          aria-label="Filter subjects"
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

      {error && <p style={{ color: '#ef4444', marginBottom: '10px' }}>{error}</p>}

      <div className="responsive-table-wrap">
        <table className="admin-table">
        <thead>
          <tr>
            <th scope="col">Subject Name</th>
            <th scope="col" style={{ textAlign: 'right' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={2} style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>Loading...</td></tr>
          ) : subjects.length === 0 ? (
            <tr><td colSpan={2} style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>No subjects found.</td></tr>
          ) : subjects.map((s: any) => (
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
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />

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

export default memo(SubjectList)
