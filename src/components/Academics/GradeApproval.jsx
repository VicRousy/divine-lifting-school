import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { safeQuery } from '../../utils/safeQuery'
import { getGradeInfo } from '../../utils/gradeUtils'

export default function GradeApproval({ showToast }) {
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
    const { data } = await safeQuery(() => supabase
      .from('exam_scores')
      .select(`
        *,
        students(id, first_name, middle_name, last_name, class_id),
        subjects(id, subject_name),
        classes(id, class_name)
      `)
      .order('created_at', { ascending: false }))
    const enriched = (data || []).map((row) => {
      const total = Number(row.ca1_score || 0) + Number(row.ca2_score || 0) + Number(row.exam_score || 0)
      return { ...row, total_score: total }
    })
    setSubmissions(enriched)
    setLoading(false)
  }

  const handleApprove = async (submissionId) => {
    await safeQuery(() => supabase
      .from('exam_scores')
      .update({
        approval_status: 'approved',
        approved_at: new Date().toISOString(),
      })
      .eq('id', submissionId))
    showToast?.('Submission approved!', 'success')
    setSelectedSubmission(null)
    loadSubmissions()
  }

  const handleReject = async (submissionId) => {
    if (!rejectionReason.trim()) {
      showToast?.('Please provide a reason for rejection.', 'error')
      return
    }

    await safeQuery(() => supabase
      .from('exam_scores')
      .update({
        approval_status: 'rejected',
        rejection_reason: rejectionReason,
      })
      .eq('id', submissionId))
    showToast?.('Submission rejected.', 'success')
    setRejectionReason('')
    setSelectedSubmission(null)
    loadSubmissions()
  }

  const filteredSubmissions = submissions.filter((s) => {
    if (filter === 'all') return true
    return s.approval_status === filter
  })

  const stats = {
    pending: submissions.filter((s) => s.approval_status === 'pending').length,
    approved: submissions.filter((s) => s.approval_status === 'approved').length,
    rejected: submissions.filter((s) => s.approval_status === 'rejected').length,
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading submissions...</div>

  return (
    <div style={{ padding: 30 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <h2 style={{ margin: 0, color: '#f8fafc' }}>Grade Approval</h2>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { key: 'pending', label: 'Pending', color: '#f59e0b' },
          { key: 'approved', label: 'Approved', color: '#10b981' },
          { key: 'rejected', label: 'Rejected', color: '#ef4444' },
          { key: 'all', label: 'All', color: '#38bdf8' },
        ].map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              padding: '8px 16px',
              background: filter === key ? color : 'transparent',
              color: filter === key ? '#0f172a' : '#94a3b8',
              border: '1px solid #334155',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {label} ({stats[key]})
          </button>
        ))}
      </div>

      {filteredSubmissions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', border: '1px dashed #334155', borderRadius: 14 }}>
          No submissions found.
        </div>
      ) : (
        <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #334155', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155' }}>
                  {['STUDENT', 'CLASS', 'SUBJECT', 'TERM', 'CA1', 'CA2', 'EXAM', 'TOTAL', 'GRADE', 'STATUS', 'ACTION'].map((h) => (
                    <th scope="col"
                      key={h}
                      style={{
                        padding: 14,
                        textAlign: h === 'STUDENT' || h === 'SUBJECT' ? 'left' : 'center',
                        color: '#94a3b8',
                        fontSize: '0.8rem',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((sub) => {
                  const gradeInfo = getGradeInfo(sub.total_score)
                  return (
                    <tr key={sub.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <td style={{ padding: 14, color: '#e2e8f0', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {sub.students?.first_name} {sub.students?.last_name}
                      </td>
                      <td style={{ padding: 14, textAlign: 'center', color: '#94a3b8' }}>
                        {sub.classes?.class_name || sub.students?.class_id}
                      </td>
                      <td style={{ padding: 14, textAlign: 'center', color: '#94a3b8' }}>
                        {sub.subjects?.subject_name}
                      </td>
                      <td style={{ padding: 14, textAlign: 'center', color: '#94a3b8' }}>{sub.term}</td>
                      <td style={{ padding: 14, textAlign: 'center', color: '#e2e8f0' }}>{sub.ca1_score ?? 0}</td>
                      <td style={{ padding: 14, textAlign: 'center', color: '#e2e8f0' }}>{sub.ca2_score ?? 0}</td>
                      <td style={{ padding: 14, textAlign: 'center', color: '#e2e8f0' }}>{sub.exam_score ?? 0}</td>
                      <td style={{ padding: 14, textAlign: 'center', fontWeight: 800, color: sub.total_score >= 50 ? '#22c55e' : '#f59e0b' }}>
                        {sub.total_score}
                      </td>
                      <td style={{ padding: 14, textAlign: 'center', color: gradeInfo.color, fontWeight: 700 }}>
                        {gradeInfo.grade}
                      </td>
                      <td style={{ padding: 14, textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: 6,
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            background:
                              sub.approval_status === 'approved'
                                ? 'rgba(16,185,129,0.15)'
                                : sub.approval_status === 'rejected'
                                ? 'rgba(239,68,68,0.15)'
                                : 'rgba(245,158,11,0.15)',
                            color:
                              sub.approval_status === 'approved'
                                ? '#10b981'
                                : sub.approval_status === 'rejected'
                                ? '#ef4444'
                                : '#f59e0b',
                          }}
                        >
                          {sub.approval_status}
                        </span>
                      </td>
                      <td style={{ padding: 14, textAlign: 'center' }}>
                        {sub.approval_status === 'pending' && (
                          <button
                            onClick={() => setSelectedSubmission(sub)}
                            style={{
                              padding: '6px 14px',
                              background: '#38bdf8',
                              color: '#0f172a',
                              border: 'none',
                              borderRadius: 6,
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                            }}
                          >
                            Review
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedSubmission && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => { setSelectedSubmission(null); setRejectionReason('') }}
        >
          <div
            style={{ background: '#1e293b', padding: 30, borderRadius: 14, width: 500, maxWidth: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 20px', color: '#f8fafc' }}>Review Submission</h3>

            <div style={{ marginBottom: 12, color: '#94a3b8' }}>
              <strong style={{ color: '#e2e8f0' }}>Student:</strong>{' '}
              {selectedSubmission.students?.first_name} {selectedSubmission.students?.middle_name ? `${selectedSubmission.students.middle_name} ` : ''}
              {selectedSubmission.students?.last_name}
            </div>
            <div style={{ marginBottom: 12, color: '#94a3b8' }}>
              <strong style={{ color: '#e2e8f0' }}>Class:</strong>{' '}
              {selectedSubmission.classes?.class_name || selectedSubmission.students?.class_id}
            </div>
            <div style={{ marginBottom: 12, color: '#94a3b8' }}>
              <strong style={{ color: '#e2e8f0' }}>Subject:</strong> {selectedSubmission.subjects?.subject_name}
            </div>
            <div style={{ marginBottom: 12, color: '#94a3b8' }}>
              <strong style={{ color: '#e2e8f0' }}>Term:</strong> {selectedSubmission.term}
            </div>
            <div style={{ marginBottom: 12, display: 'flex', gap: 16, color: '#94a3b8' }}>
              <span><strong style={{ color: '#e2e8f0' }}>CA1:</strong> {selectedSubmission.ca1_score ?? 0}</span>
              <span><strong style={{ color: '#e2e8f0' }}>CA2:</strong> {selectedSubmission.ca2_score ?? 0}</span>
              <span><strong style={{ color: '#e2e8f0' }}>Exam:</strong> {selectedSubmission.exam_score ?? 0}</span>
            </div>
            <div style={{ marginBottom: 20, padding: 12, background: '#0f172a', borderRadius: 8, textAlign: 'center' }}>
              <strong style={{ color: '#38bdf8', fontSize: '1.1rem' }}>Total: {selectedSubmission.total_score}</strong>
              <span style={{ marginLeft: 12, color: getGradeInfo(selectedSubmission.total_score).color, fontWeight: 700 }}>
                Grade: {getGradeInfo(selectedSubmission.total_score).grade}
              </span>
            </div>

            {selectedSubmission.approval_status === 'pending' && (
              <>
                <div style={{ marginBottom: 15 }}>
                  <label style={{ display: 'block', marginBottom: 6, color: '#94a3b8', fontSize: '0.85rem' }}>
                    Rejection Reason
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter reason if rejecting..."
                    style={{
                      width: '100%',
                      padding: 10,
                      background: '#0f172a',
                      border: '1px solid #334155',
                      color: '#e2e8f0',
                      borderRadius: 8,
                      minHeight: 80,
                      outline: 'none',
                      resize: 'vertical',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => handleApprove(selectedSubmission.id)}
                    style={{
                      flex: 1,
                      padding: 12,
                      background: '#10b981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontWeight: 700,
                    }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(selectedSubmission.id)}
                    style={{
                      flex: 1,
                      padding: 12,
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontWeight: 700,
                    }}
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => { setSelectedSubmission(null); setRejectionReason('') }}
                    style={{
                      padding: '12px 20px',
                      background: '#334155',
                      color: '#e2e8f0',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {selectedSubmission.approval_status === 'rejected' && (
              <div style={{ padding: 12, background: 'rgba(239,68,68,0.1)', borderRadius: 8, color: '#ef4444' }}>
                <strong>Rejection Reason:</strong> {selectedSubmission.rejection_reason}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
