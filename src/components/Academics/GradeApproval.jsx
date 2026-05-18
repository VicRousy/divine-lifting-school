import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

function GradeApproval({ showToast }) {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    loadSubmissions()
  }, [])

  const loadSubmissions = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('exam_scores')
      .select(`
        *,
        students(first_name, last_name, class_name),
        subjects(subject_name),
        teachers(first_name, last_name)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      showToast('Error loading submissions: ' + error.message, 'error')
    } else {
      setSubmissions(data || [])
    }
    setLoading(false)
  }

  const handleApprove = async (submissionId) => {
    const { error } = await supabase
      .from('exam_scores')
      .update({ approval_status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', submissionId)

    if (error) {
      showToast('Error approving: ' + error.message, 'error')
    } else {
      showToast('Submission approved!', 'success')
      setSelectedSubmission(null)
      loadSubmissions()
    }
  }

  const handleReject = async (submissionId) => {
    if (!rejectionReason.trim()) {
      showToast('Please provide a reason for rejection.', 'error')
      return
    }

    const { error } = await supabase
      .from('exam_scores')
      .update({ 
        approval_status: 'rejected', 
        rejection_reason: rejectionReason,
        approved_at: new Date().toISOString()
      })
      .eq('id', submissionId)

    if (error) {
      showToast('Error rejecting: ' + error.message, 'error')
    } else {
      showToast('Submission rejected.', 'success')
      setRejectionReason('')
      setSelectedSubmission(null)
      loadSubmissions()
    }
  }

  const filteredSubmissions = submissions.filter(s => {
    if (filter === 'all') return true
    return s.approval_status === filter
  })

  const stats = {
    pending: submissions.filter(s => s.approval_status === 'pending').length,
    approved: submissions.filter(s => s.approval_status === 'approved').length,
    rejected: submissions.filter(s => s.approval_status === 'rejected').length
  }

  if (loading) return <div className="dashboard-card">Loading Submissions...</div>

  return (
    <div className="dashboard-card">
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button onClick={() => setFilter('pending')} style={{ padding: '8px 16px', background: filter === 'pending' ? '#f59e0b' : 'transparent', color: filter === 'pending' ? '#0f172a' : '#94a3b8', border: '1px solid #334155', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          Pending ({stats.pending})
        </button>
        <button onClick={() => setFilter('approved')} style={{ padding: '8px 16px', background: filter === 'approved' ? '#10b981' : 'transparent', color: filter === 'approved' ? '#0f172a' : '#94a3b8', border: '1px solid #334155', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          Approved ({stats.approved})
        </button>
        <button onClick={() => setFilter('rejected')} style={{ padding: '8px 16px', background: filter === 'rejected' ? '#ef4444' : 'transparent', color: filter === 'rejected' ? '#0f172a' : '#94a3b8', border: '1px solid #334155', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          Rejected ({stats.rejected})
        </button>
      </div>

      {filteredSubmissions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          No submissions found.
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #334155', textAlign: 'left' }}>
              <th style={{ padding: '10px', color: '#94a3b8' }}>Student</th>
              <th style={{ padding: '10px', color: '#94a3b8' }}>Subject</th>
              <th style={{ padding: '10px', color: '#94a3b8' }}>Class</th>
              <th style={{ padding: '10px', color: '#94a3b8' }}>Term</th>
              <th style={{ padding: '10px', color: '#94a3b8' }}>Total Score</th>
              <th style={{ padding: '10px', color: '#94a3b8' }}>Status</th>
              <th style={{ padding: '10px', color: '#94a3b8' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubmissions.map(sub => (
              <tr key={sub.id} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '10px' }}>{sub.students?.first_name} {sub.students?.last_name}</td>
                <td style={{ padding: '10px' }}>{sub.subjects?.subject_name}</td>
                <td style={{ padding: '10px' }}>{sub.students?.class_name}</td>
                <td style={{ padding: '10px' }}>{sub.term}</td>
                <td style={{ padding: '10px' }}>{sub.total_score || 0}</td>
                <td style={{ padding: '10px' }}>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem',
                    background: sub.approval_status === 'approved' ? '#10b98122' : sub.approval_status === 'rejected' ? '#ef444422' : '#f59e0b22',
                    color: sub.approval_status === 'approved' ? '#10b981' : sub.approval_status === 'rejected' ? '#ef4444' : '#f59e0b'
                  }}>
                    {sub.approval_status}
                  </span>
                </td>
                <td style={{ padding: '10px' }}>
                  {sub.approval_status === 'pending' && (
                    <button 
                      onClick={() => setSelectedSubmission(sub)}
                      style={{ padding: '6px 12px', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                    >
                      Review
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selectedSubmission && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 
        }}>
          <div style={{ background: '#1e293b', padding: '30px', borderRadius: '12px', width: '500px', maxWidth: '90%' }}>
            <h3 style={{ margin: '0 0 20px', color: '#f8fafc' }}>Review Submission</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <strong style={{ color: '#94a3b8' }}>Student:</strong> {selectedSubmission.students?.first_name} {selectedSubmission.students?.last_name}
            </div>
            <div style={{ marginBottom: '15px' }}>
              <strong style={{ color: '#94a3b8' }}>Subject:</strong> {selectedSubmission.subjects?.subject_name}
            </div>
            <div style={{ marginBottom: '15px' }}>
              <strong style={{ color: '#94a3b8' }}>Class:</strong> {selectedSubmission.students?.class_name}
            </div>
            <div style={{ marginBottom: '15px' }}>
              <strong style={{ color: '#94a3b8' }}>Term:</strong> {selectedSubmission.term}
            </div>
            <div style={{ marginBottom: '15px' }}>
              <strong style={{ color: '#94a3b8' }}>CA1:</strong> {selectedSubmission.ca1 || 0} | 
              <strong style={{ color: '#94a3b8', marginLeft: '10px' }}>CA2:</strong> {selectedSubmission.ca2 || 0} | 
              <strong style={{ color: '#94a3b8', marginLeft: '10px' }}>Exam:</strong> {selectedSubmission.exam_score || 0}
            </div>
            <div style={{ marginBottom: '20px', padding: '10px', background: '#0f172a', borderRadius: '6px' }}>
              <strong style={{ color: '#38bdf8' }}>Total Score:</strong> {selectedSubmission.total_score || 0}
            </div>

            {selectedSubmission.approval_status === 'pending' && (
              <>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', color: '#94a3b8' }}>Rejection Reason (if rejecting)</label>
                  <textarea 
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '6px', minHeight: '80px' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => handleApprove(selectedSubmission.id)}
                    style={{ flex: 1, padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => handleReject(selectedSubmission.id)}
                    style={{ flex: 1, padding: '12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => { setSelectedSubmission(null); setRejectionReason('') }}
                    style={{ padding: '12px 20px', background: '#334155', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {selectedSubmission.approval_status === 'rejected' && (
              <div style={{ padding: '10px', background: '#ef444422', borderRadius: '6px', color: '#ef4444' }}>
                <strong>Rejection Reason:</strong> {selectedSubmission.rejection_reason}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default GradeApproval
