import { useState, useEffect } from 'react'
import { useUnsavedChanges } from '../../utils/useUnsavedChanges'
import { CardSkeleton } from '../Common/Skeleton'
import { supabase } from '../../supabaseClient'
import { Trash2, RefreshCw, Newspaper, Calendar, Image } from 'lucide-react'

export default function ManageNews({ showToast }) {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [dirty, setDirty] = useState(false)
  useUnsavedChanges(dirty)

  const fetchNews = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('public_news')
        .select('*')
        .order('published_date', { ascending: false })

      if (error) throw error
      setNews(data || [])
    } catch (err) {
      showToast?.('Failed to load news: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNews()
  }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this news? This cannot be undone.')) return

    try {
      const { error } = await supabase
        .from('public_news')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      showToast('News deleted successfully', 'success')
      fetchNews()
    } catch (err) {
      showToast('Failed to delete news', 'error')
    }
  }

  const cardStyle = {
    background: '#1e293b',
    borderRadius: '16px',
    border: '1px solid #334155',
    padding: '20px',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    transition: 'all 0.3s',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  }

  const badgeStyle = (category) => {
    const colors = {
      'Academics': { bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' },
      'Events': { bg: 'rgba(249, 115, 22, 0.15)', color: '#f97316' },
      'Sports': { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' },
      'Admissions': { bg: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' },
      'General': { bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8' }
    }
    return colors[category] || colors['General']
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px' }}>
      
      {/* Header */}
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
            <Newspaper size={24} color="#38bdf8" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#f8fafc' }}>Manage News</h2>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>View and delete published news</p>
          </div>
        </div>
        <button 
          onClick={fetchNews} 
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
            fontWeight: '600',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#475569'}
          onMouseOut={(e) => e.currentTarget.style.background = '#334155'}
        >
          <RefreshCw size={18} /> Refresh
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ padding: '20px 0' }}>
          <CardSkeleton lines={2} />
          <CardSkeleton lines={3} />
          <CardSkeleton lines={2} />
        </div>
      ) : news.length === 0 ? (
        <div style={{
          background: '#1e293b',
          borderRadius: '20px',
          padding: '60px 20px',
          textAlign: 'center',
          border: '1px dashed #334155'
        }}>
          <Newspaper size={48} color="#475569" style={{ marginBottom: '16px' }} />
          <h3 style={{ color: '#94a3b8', margin: '0 0 8px' }}>No News Found</h3>
          <p style={{ color: '#64748b', margin: 0 }}>Start by posting a new update.</p>
        </div>
      ) : (
        <div>
          {news.map((item) => {
            const style = badgeStyle(item.category)
            return (
              <div 
                key={item.id} 
                style={cardStyle}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#38bdf8'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#334155'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {/* Image Thumbnail */}
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '12px',
                  backgroundColor: '#0f172a',
                  overflow: 'hidden',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {item.image_url ? (
                    <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Image size={24} color="#475569" />
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      backgroundColor: style.bg,
                      color: style.color,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {item.category}
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} /> {item.published_date ? new Date(item.published_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date TBD'}
                    </span>
                  </div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '700', color: '#f8fafc' }}>{item.title}</h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.excerpt}
                  </p>
                </div>

                {/* Delete Button */}
                <button 
                  onClick={() => handleDelete(item.id)}
                  style={{
                    padding: '10px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#ef4444',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                  title="Delete News"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
