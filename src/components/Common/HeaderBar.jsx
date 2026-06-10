export default function HeaderBar({ title, userInfo, showProfileMenu, onMobileOpen, onToggleProfileMenu, onPasswordClick, onLogoutClick }) {
  return (
    <header className="header-bar" style={{ background: '#1e293b', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', flexShrink: 0, position: 'sticky', top: 0, zIndex: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <button onClick={onMobileOpen} aria-label="Open menu" className="hamburger-btn" style={{ background: 'none', border: 'none', color: '#f8fafc', fontSize: '1.5rem', cursor: 'pointer' }}>☰</button>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#f8fafc' }}>Divine Lifting School</h1>
          <p style={{ margin: '5px 0 0', color: '#94a3b8' }}>Academic Management Portal</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ position: 'relative' }}>
          <div onClick={onToggleProfileMenu} aria-label="Open profile menu" style={{ width: 40, height: 40, background: '#38bdf8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#0f172a', cursor: 'pointer', fontSize: '1.1rem' }}>
            {userInfo?.name?.charAt(0) || 'U'}
          </div>
          {showProfileMenu && (
            <div style={{ position: 'absolute', right: 0, top: 48, background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: 16, minWidth: 200, boxShadow: '0 10px 40px rgba(0,0,0,0.4)', zIndex: 100 }}>
              <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#f8fafc', marginBottom: 4 }}>{userInfo?.name || 'User'}</div>
              <div style={{ fontSize: '0.8rem', color: '#38bdf8', marginBottom: 12 }}>{userInfo?.staffId || userInfo?.loginId || userInfo?.schoolId || userInfo?.studentId || userInfo?.parentId || 'ID'}</div>
              <div style={{ borderTop: '1px solid #334155', paddingTop: 10 }}>
                <button onClick={onPasswordClick} aria-label="Change Password" style={{ width: '100%', padding: '8px 12px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', textAlign: 'left', borderRadius: 6, fontSize: '0.85rem' }} onMouseOver={(e) => e.currentTarget.style.background = '#334155'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>Change Password</button>
                <button onClick={onLogoutClick} aria-label="Logout" style={{ width: '100%', padding: '8px 12px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', textAlign: 'left', borderRadius: 6, fontSize: '0.85rem' }} onMouseOver={(e) => e.currentTarget.style.background = '#334155'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>Logout</button>
              </div>
            </div>
          )}
          {showProfileMenu && <div onClick={onToggleProfileMenu} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />}
        </div>
      </div>
    </header>
  )
}
