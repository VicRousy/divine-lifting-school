import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { sendApplicationDecision } from '../../services/emailService'
import { FileText, RefreshCw, Trash2, Eye, EyeOff } from 'lucide-react'
import Pagination from '../Common/Pagination'
import { CardSkeleton } from '../Common/Skeleton'

const ITEMS_PER_PAGE = 10

const STATUS_COLORS = {
  pending: { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', label: 'Pending' },
  reviewed: { bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', label: 'Reviewed' },
  accepted: { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', label: 'Accepted' },
  rejected: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', label: 'Rejected' },
}

export default function Applications({ showToast }) {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(applications.length / ITEMS_PER_PAGE)
  const paginatedApps = applications.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setApplications(data || [])
    } catch (err) {
      console.error('Error fetching applications:', err)
      showToast?.('Failed to load applications', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [])

  const handleStatusUpdate = async (id, status) => {
    try {
      const app = applications.find(a => a.id === id)
      if (!app) throw new Error('Application not found')

      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', id)

      if (error) throw error
      setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a))
      showToast?.(`Application marked as ${status}`, 'success')

      if (status === 'accepted' || status === 'rejected') {
        const recipient = app.father_email || app.mother_email
        if (recipient) {
          const studentName = `${app.student_first_name} ${app.student_last_name}`
          const result = await sendApplicationDecision(recipient, studentName, app.application_number, status, app.class_applying_for)
          if (result.success) {
            showToast?.(`Decision email sent to ${recipient}`, 'success')
          } else {
            showToast?.('Status updated but email failed to send', 'warning')
          }
        } else {
          showToast?.('Status updated but no parent email on file', 'warning')
        }
      }
    } catch (err) {
      showToast?.('Failed to update status', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this application permanently?')) return
    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', id)

      if (error) throw error
      showToast?.('Application deleted', 'success')
      fetchApplications()
    } catch (err) {
      showToast?.('Failed to delete application', 'error')
    }
  }

  const cardStyle = {
    background: '#1e293b',
    borderRadius: '16px',
    border: '1px solid #334155',
    padding: '20px',
    marginBottom: '12px',
    transition: 'all 0.2s',
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', background: 'rgba(249, 115, 22, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={24} color="#f97316" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#f8fafc' }}>Admission Applications</h2>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>
              {applications.filter(a => a.status === 'pending').length} pending
            </p>
          </div>
        </div>
        <button onClick={fetchApplications} style={{ padding: '10px 16px', background: '#334155', border: 'none', borderRadius: '10px', color: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
          <RefreshCw size={18} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '20px 0' }}>
          <CardSkeleton lines={2} />
          <CardSkeleton lines={3} />
          <CardSkeleton lines={2} />
        </div>
      ) : applications.length === 0 ? (
        <div style={{ background: '#1e293b', borderRadius: '20px', padding: '60px 20px', textAlign: 'center', border: '1px dashed #334155' }}>
          <FileText size={48} color="#475569" style={{ marginBottom: '16px' }} />
          <h3 style={{ color: '#94a3b8', margin: '0 0 8px' }}>No Applications Yet</h3>
          <p style={{ color: '#64748b', margin: 0 }}>Applications from the website admission form will appear here.</p>
        </div>
      ) : (
        <div>
          {paginatedApps.map((app) => {
            const sc = STATUS_COLORS[app.status] || STATUS_COLORS.pending
            const isExpanded = expanded === app.id
            return (
              <div key={app.id} style={{ ...cardStyle, borderLeft: `4px solid ${sc.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <strong style={{ color: '#f8fafc', fontSize: '16px' }}>
                        {app.student_first_name} {app.student_last_name}
                      </strong>
                      <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '12px', background: sc.bg, color: sc.color, textTransform: 'uppercase' }}>
                        {sc.label}
                      </span>
                      <span style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>
                        {app.application_number}
                      </span>
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '13px' }}>
                      {app.class_applying_for} &middot; {app.student_gender}
                      {app.created_at && ` &middot; ${new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button onClick={() => setExpanded(isExpanded ? null : app.id)} title={isExpanded ? 'Collapse' : 'Expand'}
                      style={{ padding: '8px', background: 'rgba(148, 163, 184, 0.1)', border: 'none', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer' }}>
                      {isExpanded ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <button onClick={() => handleDelete(app.id)} title="Delete"
                      style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: '8px', color: '#ef4444', cursor: 'pointer' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {['pending', 'reviewed', 'accepted', 'rejected'].map(s => (
                    <button key={s} onClick={() => handleStatusUpdate(app.id, s)}
                      style={{
                        padding: '4px 12px',
                        background: app.status === s ? STATUS_COLORS[s].bg : 'transparent',
                        border: `1px solid ${app.status === s ? STATUS_COLORS[s].color : '#475569'}`,
                        borderRadius: '6px',
                        color: app.status === s ? STATUS_COLORS[s].color : '#94a3b8',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'capitalize',
                      }}>
                      {STATUS_COLORS[s].label}
                    </button>
                  ))}
                </div>

                {isExpanded && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #334155' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                      <div><span style={{ color: '#64748b' }}>DOB:</span> <span style={{ color: '#cbd5e1' }}>{app.student_dob}</span></div>
                      <div><span style={{ color: '#64748b' }}>Previous School:</span> <span style={{ color: '#cbd5e1' }}>{app.previous_school || 'N/A'}</span></div>
                      {app.father_name && <div><span style={{ color: '#64748b' }}>Father:</span> <span style={{ color: '#cbd5e1' }}>{app.father_name} {app.father_phone ? `(${app.father_phone})` : ''}</span></div>}
                      {app.father_email && <div><span style={{ color: '#64748b' }}>Father Email:</span> <span style={{ color: '#cbd5e1' }}>{app.father_email}</span></div>}
                      {app.mother_name && <div><span style={{ color: '#64748b' }}>Mother:</span> <span style={{ color: '#cbd5e1' }}>{app.mother_name} {app.mother_phone ? `(${app.mother_phone})` : ''}</span></div>}
                      {app.mother_email && <div><span style={{ color: '#64748b' }}>Mother Email:</span> <span style={{ color: '#cbd5e1' }}>{app.mother_email}</span></div>}
                      <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#64748b' }}>Address:</span> <span style={{ color: '#cbd5e1' }}>{app.address}</span></div>
                      <div><span style={{ color: '#64748b' }}>Emergency Contact:</span> <span style={{ color: '#cbd5e1' }}>{app.emergency_contact_name} ({app.emergency_contact_phone})</span></div>
                      {app.medical_notes && <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#64748b' }}>Medical Notes:</span> <span style={{ color: '#cbd5e1' }}>{app.medical_notes}</span></div>}
                      <div><span style={{ color: '#64748b' }}>How Heard:</span> <span style={{ color: '#cbd5e1' }}>{app.how_heard || 'N/A'}</span></div>
                      <div><span style={{ color: '#64748b' }}>Siblings Enrolled:</span> <span style={{ color: '#cbd5e1' }}>{app.siblings_enrolled ? 'Yes' : 'No'}</span></div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}
    </div>
  )
}
