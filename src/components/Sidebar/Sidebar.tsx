import { memo } from 'react'

interface SidebarProps {
  userInfo: any
  role: string
  activePage: string
  onNavigate: (page: string) => void
  isOpen: boolean
  onClose: () => void
  onSwitchPortal?: () => void
}

const SidebarGroup = memo(function SidebarGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ padding: '8px 20px 4px', fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
        {label}
      </div>
      {children}
    </div>
  )
})

const SidebarItem = memo(function SidebarItem({ icon, label, page, active, onClick }: {
  icon: string; label: string; page: string; active: boolean; onClick: (page: string) => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(page)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(page) }}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', cursor: 'pointer',
        background: active ? '#334155' : 'transparent',
        borderLeft: active ? '3px solid #38bdf8' : '3px solid transparent',
        color: active ? '#f8fafc' : '#94a3b8',
        transition: 'all 0.2s',
      }}
    >
      <span>{icon}</span>
      <span style={{ fontSize: '0.9rem' }}>{label}</span>
    </div>
  )
})

const Sidebar = memo(function Sidebar({ userInfo, role, activePage, onNavigate, isOpen, onClose, onSwitchPortal }: SidebarProps) {

  const link = (page: string, label: string, icon: string = '') => (
    <SidebarItem key={page} icon={icon} label={label} page={page}
      active={activePage === page || (activePage === 'dashboard' && page === 'dashboard')}
      onClick={(p) => { onNavigate(p); onClose() }} />
  )

  const adminLinks = (
    <>
      <SidebarGroup label="School">
        {link('dashboard', 'Dashboard', '📊')}
        {link('announcements', 'Announcements', '📢')}
        {link('messages', 'Messages', '💬')}
        {link('applications', 'Applications', '📋')}
      </SidebarGroup>
      <SidebarGroup label="Academics">
        {link('subjects', 'Subjects', '📚')}
        {link('classes', 'Classes', '🏫')}
        {link('scores', 'Score Entry', '✏️')}
        {link('grade-approval', 'Grade Approval', '✅')}
        {link('grade-scale', 'Grade Scale', '⚖️')}
        {link('report-cards', 'Report Cards', '📄')}
        {link('promotion', 'Promotion', '🎓')}
      </SidebarGroup>
      <SidebarGroup label="People">
        {link('students', 'Students', '👨‍🎓')}
        {link('add-student', 'Add Student', '➕')}
        {link('bulk-import', 'Bulk Import', '📥')}
        {link('teachers', 'Teachers', '👩‍🏫')}
        {link('add-teacher', 'Add Teacher', '➕')}
        {link('assignments', 'Assignments', '📝')}
      </SidebarGroup>
      <SidebarGroup label="Finance">
        {link('fees', 'Fee Management', '💰')}
      </SidebarGroup>
      <SidebarGroup label="System">
        {link('reset-password', 'Reset Password', '🔑')}
        {link('post-news', 'Post News', '📰')}
        {link('manage-news', 'Manage News', '📰')}
        {link('attendance', 'Attendance', '📋')}
        {link('settings', 'Settings', '⚙️')}
        {link('mfa', 'MFA Setup', '🔐')}
      </SidebarGroup>
      {onSwitchPortal && (
        <div style={{ padding: '8px 20px' }}>
          <div role="button" tabIndex={0} onClick={() => { onSwitchPortal(); onClose() }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { onSwitchPortal(); onClose() } }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', cursor: 'pointer', color: '#38bdf8', fontSize: '0.9rem' }}>
            <span>🔄</span>
            <span>Switch to {role === 'teacher' ? 'Admin' : 'Teacher'} Portal</span>
          </div>
        </div>
      )}
    </>
  )

  const teacherLinks = (
    <>
      <SidebarGroup label="Portal">
        {link('teacher-dashboard', 'Dashboard', '📊')}
        {link('scores', 'Gradebook', '📚')}
        {link('attendance', 'Attendance', '📋')}
        {link('full-attendance', 'Full Attendance', '📋')}
        {link('score-entry', 'Score Entry', '✏️')}
        {link('roster', 'Class Roster', '👨‍🎓')}
        {link('homework', 'Homework', '📝')}
        {link('comms', 'Announcements', '📢')}
        {link('notifications', 'Notifications', '🔔')}
      </SidebarGroup>
    </>
  )

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} aria-hidden={true} />}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}
        style={{
          width: 260, background: '#1e293b', borderRight: '1px solid #334155',
          display: 'flex', flexDirection: 'column', flexShrink: 0,
          position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
        }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>DLS Portal</h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#64748b' }}>Divine Lifting School</p>
          </div>
          <button className="mobile-close-btn" onClick={onClose} aria-label="Close sidebar"
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer', padding: '4px 8px' }}>
            ✕
          </button>
        </div>
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
          {role === 'admin' ? adminLinks : teacherLinks}
        </nav>
        <div style={{ padding: '12px 20px', borderTop: '1px solid #334155' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {userInfo?.name || 'User'}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#38bdf8' }}>
            {userInfo?.login_id || userInfo?.loginId || userInfo?.staff_id || userInfo?.staffId || 'ID'}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#475569', textTransform: 'capitalize' }}>{role}</div>
        </div>
      </aside>
    </>
  )
})

export default Sidebar
