export default function Forbidden({ message = 'Access denied' }: { message?: string }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', padding: 20 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 72, fontWeight: 800, color: '#ef4444', marginBottom: 8 }}>403</div>
        <h2 style={{ color: '#f8fafc', margin: '0 0 8px' }}>{message}</h2>
        <p style={{ color: '#94a3b8', margin: '0 0 24px' }}>You don't have permission to access this page.</p>
        <button
          onClick={() => window.location.reload()}
          aria-label="Go to dashboard"
          style={{ padding: '10px 24px', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  )
}