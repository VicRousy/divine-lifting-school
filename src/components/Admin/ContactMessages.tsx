import { useState, useMemo, memo } from 'react'
import { supabase } from '../../supabaseClient'
import { useServerPagination } from '../../utils/useServerPagination'
import { Mail, RefreshCw, CheckCheck, Trash2, MessageSquare } from 'lucide-react'
import Pagination from '../Common/Pagination'
import { CardSkeleton } from '../Common/Skeleton'

const PAGE_SIZE = 10

interface ContactMessagesProps {
  showToast?: (msg: string, type: string) => void
}

function ContactMessages({ showToast }: ContactMessagesProps) {
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const fetchData = useMemo(() => (rangeStart: number, rangeEnd: number) => {
    return supabase
      .from('contact_messages')
      .select('id, name, email, phone, is_read, message, program, created_at')
      .order('created_at', { ascending: false })
      .range(rangeStart, rangeEnd)
  }, [])

  const fetchCount = useMemo(() => () => {
    return supabase
      .from('contact_messages')
      .select('id', { count: 'exact', head: true })
  }, [])

  const {
    data: messages,
    totalPages,
    currentPage,
    loading,
    setPage,
  } = useServerPagination<any>(fetchData, fetchCount, { pageSize: PAGE_SIZE })

  const handleMarkRead = async (id: number) => {
    setActionLoading(id)
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ is_read: true })
        .eq('id', id)

      if (error) throw error
    } catch {
      showToast?.('Failed to update message', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this message permanently?')) return
    setActionLoading(id)
    try {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', id)

      if (error) throw error
      showToast?.('Message deleted', 'success')
    } catch {
      showToast?.('Failed to delete message', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const cardStyle = {
    background: '#1e293b',
    borderRadius: '16px',
    border: '1px solid #334155',
    padding: '20px',
    marginBottom: '12px',
    transition: 'all 0.2s'
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            padding: '12px',
            background: 'rgba(56, 189, 248, 0.1)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <MessageSquare size={24} color="#38bdf8" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#f8fafc' }}>Contact Messages</h2>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>
              {messages.filter((m: any) => !m.is_read).length} unread messages
            </p>
          </div>
        </div>
        <button
          onClick={() => setPage(1)}
          style={{
            padding: '10px 16px',
            background: '#334155',
            border: 'none',
            borderRadius: '10px',
            color: '#f8fafc',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '600'
          }}
        >
          <RefreshCw size={18} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '20px 0' }}>
          <CardSkeleton lines={2} />
          <CardSkeleton lines={3} />
          <CardSkeleton lines={2} />
        </div>
      ) : messages.length === 0 ? (
        <div style={{
          background: '#1e293b',
          borderRadius: '20px',
          padding: '60px 20px',
          textAlign: 'center',
          border: '1px dashed #334155'
        }}>
          <Mail size={48} color="#475569" style={{ marginBottom: '16px' }} />
          <h3 style={{ color: '#94a3b8', margin: '0 0 8px' }}>No Messages Yet</h3>
          <p style={{ color: '#64748b', margin: 0 }}>Messages from the website contact form will appear here.</p>
        </div>
      ) : (
        <div>
          {messages.map((msg: any) => (
            <div
              key={msg.id}
              style={{
                ...cardStyle,
                borderColor: msg.is_read ? '#334155' : '#38bdf8',
                borderLeft: msg.is_read ? '4px solid #334155' : '4px solid #38bdf8'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <strong style={{ color: '#f8fafc', fontSize: '16px' }}>{msg.name}</strong>
                  <span style={{ color: '#94a3b8', marginLeft: '12px', fontSize: '13px' }}>{msg.email}</span>
                  {msg.phone && <span style={{ color: '#64748b', marginLeft: '12px', fontSize: '13px' }}>| {msg.phone}</span>}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  {!msg.is_read && (
                    <button
                      onClick={() => handleMarkRead(msg.id)}
                      disabled={actionLoading === msg.id}
                      title="Mark as read"
                      style={{
                        padding: '8px',
                        background: actionLoading === msg.id ? 'rgba(16, 185, 129, 0.05)' : 'rgba(16, 185, 129, 0.1)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#10b981',
                        cursor: actionLoading === msg.id ? 'not-allowed' : 'pointer',
                        opacity: actionLoading === msg.id ? 0.5 : 1
                      }}
                    >
                      <CheckCheck size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(msg.id)}
                    disabled={actionLoading === msg.id}
                    aria-label="Delete message"
                    title="Delete"
                    style={{
                      padding: '8px',
                      background: actionLoading === msg.id ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.1)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#ef4444',
                      cursor: actionLoading === msg.id ? 'not-allowed' : 'pointer',
                      opacity: actionLoading === msg.id ? 0.5 : 1
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              {msg.program && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  background: 'rgba(249, 115, 22, 0.15)',
                  color: '#f97316',
                  textTransform: 'uppercase',
                  display: 'inline-block',
                  marginBottom: '8px'
                }}>
                  {msg.program}
                </span>
              )}
              <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6', margin: '8px 0 0' }}>
                {msg.message}
              </p>
              <p style={{ color: '#64748b', fontSize: '12px', marginTop: '12px' }}>
                {msg.created_at ? new Date(msg.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
              </p>
            </div>
          ))}
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}

export default memo(ContactMessages)
