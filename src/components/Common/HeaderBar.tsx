import { memo, useState } from 'react'

interface HeaderBarProps {
  title?: string
  userInfo?: any | null
  notificationCount?: number
  onToggleSidebar: () => void
  onLogout: () => void
  onPasswordChange: () => void
}

const HeaderBar = memo(function HeaderBar({ title, userInfo, notificationCount, onToggleSidebar, onLogout, onPasswordChange }: HeaderBarProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  return (
    <header className="header-bar" style={{ background: '#1e293b', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', flexShrink: 0, position: 'sticky', top: 0, zIndex: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <button onClick={onToggleSidebar} aria-label="Open menu" className="hamburger-btn" style={{ background: 'none', border: 'none', color: '#f8fafc', fontSize: '1.5rem', cursor: 'pointer' }}>☰</button>
        <div>
          {title ? (
            <>
              <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#f8fafc' }}>{title}</h1>
              <p style={{ margin: '5px 0 0', color: '#94a3b8' }}>Divine Lifting School</p>
            </>
          ) : (
            <>
              <h1 style={{ margin: 0, fontSize: '2rem', background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>Divine Lifting School</h1>
              <p style={{ margin: '5px 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>Academic Management Portal</p>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {notificationCount ? (
          <div style={{ background: '#ef4444', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>{notificationCount}</div>
        ) : null}
        <div style={{ position: 'relative' }}>
          <div role="button" tabIndex={0} onClick={() => setShowProfileMenu(v => !v)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowProfileMenu(v => !v) }} aria-label="Open profile menu" style={{ width: 40, height: 40, background: '#38bdf8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#0f172a', cursor: 'pointer', fontSize: '1.1rem' }}>
            {userInfo?.name?.charAt(0) || 'U'}
          </div>
          {showProfileMenu && (
            <div style={{ position: 'absolute', right: 0, top: 48, background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: 16, minWidth: 200, boxShadow: '0 10px 40px rgba(0,0,0,0.4)', zIndex: 100 }}>
              <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#f8fafc', marginBottom: 4 }}>{userInfo?.name || 'User'}</div>
              <div style={{ fontSize: '0.8rem', color: '#38bdf8', marginBottom: 12 }}>{userInfo?.login_id || userInfo?.loginId || userInfo?.staff_id || userInfo?.staffId || userInfo?.schoolId || userInfo?.studentId || userInfo?.parentId || 'ID'}</div>
              <div style={{ borderTop: '1px solid #334155', paddingTop: 10 }}>
                <button onClick={onPasswordChange} aria-label="Change Password" style={{ width: '100%', padding: '8px 12px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', textAlign: 'left', borderRadius: 6, fontSize: '0.85rem' }} onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.background = '#334155' }} onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>Change Password</button>
                <button onClick={onLogout} aria-label="Logout" style={{ width: '100%', padding: '8px 12px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', textAlign: 'left', borderRadius: 6, fontSize: '0.85rem' }} onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.background = '#334155' }} onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>Logout</button>
              </div>
            </div>
          )}
          {showProfileMenu && <div onClick={() => setShowProfileMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />}
        </div>
      </div>
    </header>
  )
})

export default HeaderBar
