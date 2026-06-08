import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { Mail, RefreshCw, CheckCheck, Trash2, MessageSquare } from 'lucide-react'

export default function ContactMessages({ showToast }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchMessages = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setMessages(data || [])
    } catch (err) {
      console.error('Error fetching messages:', err)
      showToast?.('Failed to load messages', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [])

  const handleMarkRead = async (id) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ is_read: true })
        .eq('id', id)

      if (error) throw error
      setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m))
    } catch (err) {
      showToast?.('Failed to update message', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message permanently?')) return

    try {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', id)

      if (error) throw error
      showToast?.('Message deleted', 'success')
      fetchMessages()
    } catch (err) {
      showToast?.('Failed to delete message', 'error')
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
              {messages.filter(m => !m.is_read).length} unread messages
            </p>
          </div>
        </div>
        <button
          onClick={fetchMessages}
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
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
          <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
          <p>Loading messages...</p>
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
          {messages.map((msg) => (
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
                      title="Mark as read"
                      style={{
                        padding: '8px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#10b981',
                        cursor: 'pointer'
                      }}
                    >
                      <CheckCheck size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(msg.id)}
                    title="Delete"
                    style={{
                      padding: '8px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#ef4444',
                      cursor: 'pointer'
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
                {new Date(msg.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
