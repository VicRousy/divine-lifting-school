import { memo } from 'react'

const SidebarGroup = memo(function SidebarGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{ margin: '0 0 10px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '1px', fontWeight: 'bold' }}>{title}</h3>
      {children}
    </div>
  )
})

const SidebarItem = memo(function SidebarItem({ icon, label, active, onClick }: {
  icon: string; label: string; active: boolean; onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      role="button"
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px', cursor: 'pointer',
        background: active ? '#334155' : 'transparent', borderLeft: active ? '3px solid #38bdf8' : '3px solid transparent',
        color: active ? '#f8fafc' : '#94a3b8', transition: 'all 0.2s',
      }}
      onMouseOver={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = '#33415544' }}
      onMouseOut={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      <span>{icon}</span>
      <span style={{ fontSize: '0.9rem' }}>{label}</span>
    </div>
  )
})

interface SidebarProps {
  userInfo: any
  role: string
  activePage: string
  onNavigate: (page: string) => void
  isOpen: boolean
  onClose: () => void
  onSwitchPortal?: () => void
  onLogout?: () => void
  onPasswordChange?: () => void
}

const Sidebar = memo(function Sidebar({ userInfo, role, activePage, onNavigate, isOpen, onClose, onSwitchPortal, onLogout, onPasswordChange }: SidebarProps) {
  const link = (page: string, label: string, icon: string = '') => (
    <SidebarItem key={page} icon={icon} label={label}
      active={activePage === page || (activePage === 'dashboard' && page === 'dashboard')}
      onClick={() => { onNavigate(page); onClose() }} />
  )

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} aria-hidden={true} />}
      <aside aria-label="Sidebar navigation" className={`sidebar ${isOpen ? 'open' : ''}`}
        style={{ width: 260, background: '#1e293b', borderRight: '1px solid #334155', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100, overflowY: 'auto' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#38bdf8' }}>DLS Admin</h2>
              <p style={{ margin: '5px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>Management Portal</p>
            </div>
            <button onClick={onClose} aria-label="Close menu" className="mobile-close-btn"
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer', display: 'none' }}>✕</button>
          </div>

          <a aria-label="Visit public website"
            href="https://divine-lifting-website.vercel.app"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '15px', padding: '8px', borderRadius: '6px', background: '#334155', color: '#f8fafc', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 'bold', transition: 'background 0.2s' }}>
            Back to Website
          </a>

          {onSwitchPortal && (
            <div style={{ display: 'flex', background: '#0f172a', borderRadius: '8px', padding: '4px', marginTop: '20px' }}>
              <button aria-label="Switch to admin portal"
                onClick={() => { if (role !== 'admin') { onSwitchPortal(); onClose() } }}
                style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: role === 'admin' ? '#38bdf8' : 'transparent', color: role === 'admin' ? '#0f172a' : '#94a3b8', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>
                Admin
              </button>
              <button aria-label="Switch to teacher portal"
                onClick={() => { if (role !== 'teacher') { onSwitchPortal(); onClose() } }}
                style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: role === 'teacher' ? '#38bdf8' : 'transparent', color: role === 'teacher' ? '#0f172a' : '#94a3b8', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>
                Teacher
              </button>
            </div>
          )}
        </div>

        <nav aria-label="Main navigation" style={{ flex: 1, padding: '20px 0' }}>
          {role === 'admin' && (
            <>
              <SidebarGroup title="Dashboard">
                {link('dashboard', 'Dashboard', '📊')}
              </SidebarGroup>
              <SidebarGroup title="Students">
                {link('student-list', 'All Students', '👥')}
                {link('students', 'Add Student', '➕')}
                {link('promotion', 'Promote Students', '🎓')}
                {link('bulk-import', 'Bulk Import (CSV)', '📥')}
              </SidebarGroup>
              <SidebarGroup title="Academics">
                {link('score-entry', 'Score Entry', '📝')}
                {link('grade-approval', 'Grade Approval', '✅')}
                {link('report-cards', 'Report Cards', '📄')}
                {link('grade-scale', 'Grade Scale', '⚖️')}
                {link('subjects', 'Subjects', '📚')}
              </SidebarGroup>
              <SidebarGroup title="Staff">
                {link('teacher-list', 'Staff Directory', '👩‍🏫')}
                {link('teachers', 'Add Teacher', '➕')}
                {link('assignments', 'Assignments', '🔗')}
              </SidebarGroup>
              <SidebarGroup title="Finance">
                {link('fees', 'Fee Management', '💰')}
              </SidebarGroup>
              <SidebarGroup title="System">
                {link('settings', 'School Settings', '⚙️')}
                {link('reset-password', 'Reset Password', '🔑')}
                {link('mfa', 'MFA Setup', '🔐')}
              </SidebarGroup>
              <SidebarGroup title="Communication">
                {link('announcements', 'Announcements', '📢')}
                {link('messages', 'Contact Messages', '💬')}
                {link('applications', 'Applications', '📋')}
              </SidebarGroup>
              <SidebarGroup title="Website News">
                {link('post-news', 'Post News', '📰')}
                {link('manage-news', 'Manage News', '📁')}
              </SidebarGroup>
            </>
          )}

          {role === 'teacher' && (
            <>
              <SidebarGroup title="Dashboard">
                {link('teacher-dashboard', 'My Dashboard', '📊')}
              </SidebarGroup>
              <SidebarGroup title="Academics">
                {link('scores', 'Gradebook', '📝')}
                {link('attendance', 'Quick Attendance', '✅')}
                {link('roster', 'Class Roster', '👥')}
                {link('full-attendance', 'Attendance', '📋')}
              </SidebarGroup>
              <SidebarGroup title="Assignments">
                {link('homework', 'Homework Manager', '📚')}
              </SidebarGroup>
              <SidebarGroup title="Communication">
                {link('comms', 'Announcements', '📢')}
              </SidebarGroup>
            </>
          )}
        </nav>

        <div style={{ padding: '20px', borderTop: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', marginBottom: '4px' }}>
            {userInfo?.name || 'User'}
            <span style={{ color: '#38bdf8', display: 'block', fontSize: '0.7rem' }}>
              {userInfo?.login_id || userInfo?.loginId || userInfo?.staff_id || userInfo?.staffId || ''}
            </span>
          </div>
          <button onClick={onPasswordChange} aria-label="Change Password"
            style={{ width: '100%', padding: '10px', background: '#475569', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'background 0.2s' }}>
            Change Password
          </button>
          <button onClick={onLogout} aria-label="Logout"
            style={{ width: '100%', padding: '10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'background 0.2s' }}>
            Logout
          </button>
        </div>
      </aside>
    </>
  )
})

export default Sidebar
