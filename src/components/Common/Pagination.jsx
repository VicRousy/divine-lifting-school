import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const pages = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24 }}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
        style={{
          padding: '8px 12px',
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: 8,
          color: currentPage === 1 ? '#475569' : '#f8fafc',
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: '0.85rem',
        }}
      >
        <ChevronLeft size={16} /> Prev
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} style={{ color: '#64748b', padding: '0 4px' }}>...</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            aria-label={`Page ${p}`}
            aria-current={p === currentPage ? 'page' : undefined}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: p === currentPage ? '2px solid #38bdf8' : '1px solid #334155',
              background: p === currentPage ? 'rgba(56,189,248,0.15)' : '#1e293b',
              color: p === currentPage ? '#38bdf8' : '#94a3b8',
              fontWeight: p === currentPage ? 700 : 400,
              cursor: 'pointer',
            }}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
        style={{
          padding: '8px 12px',
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: 8,
          color: currentPage === totalPages ? '#475569' : '#f8fafc',
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: '0.85rem',
        }}
      >
        Next <ChevronRight size={16} />
      </button>
    </div>
  )
}
