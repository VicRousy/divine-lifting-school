import { memo } from 'react'

const SidebarGroup = memo(function SidebarGroup({ title, children }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{ margin: '0 0 10px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '1px', fontWeight: 'bold' }}>{title}</h3>
      {children}
    </div>
  )
})

const SidebarItem = memo(function SidebarItem({ icon, label, active, onClick }) {
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
        color: active ? '#f8fafc' : '#94a3b8', transition: 'all 0.2s'
      }}
      onMouseOver={(e) => { if (!active) e.currentTarget.style.background = '#33415544' }}
      onMouseOut={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
    >
      <span>{icon}</span>
      <span style={{ fontSize: '0.9rem' }}>{label}</span>
    </div>
  )
})

export default function Sidebar({ userRole, activeTab, mobileMenuOpen, onTabChange, onMobileClose, onLogoutClick, onPasswordClick, onSwitchPortal }) {
  return (
    <>
      {mobileMenuOpen && <div className="sidebar-overlay" onClick={onMobileClose} aria-hidden={true} />}
      <aside aria-label="Sidebar navigation" className={`sidebar ${mobileMenuOpen ? 'open' : ''}`} style={{ background: '#1e293b', borderRight: '1px solid #334155', display: 'flex', flexDirection: 'column', padding: '20px 0', flexShrink: 0, overflowY: 'auto' }}>
        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#38bdf8' }}>DLS Admin</h2>
              <p style={{ margin: '5px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>Management Portal</p>
            </div>
            <button onClick={onMobileClose} aria-label="Close menu" style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer', display: 'none' }} className="mobile-close-btn">✕</button>
          </div>

          <a aria-label="Visit public website"
            href="https://divine-lifting-website.vercel.app"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '15px', padding: '8px', borderRadius: '6px', background: '#334155', color: '#f8fafc', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 'bold', transition: 'background 0.2s' }}
          >
            Back to Website
          </a>

          <div style={{ display: 'flex', background: '#0f172a', borderRadius: '8px', padding: '4px', marginTop: '20px' }}>
            <button aria-label="Switch to admin portal"
              onClick={() => onSwitchPortal('admin')}
              style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: userRole === 'admin' ? '#38bdf8' : 'transparent', color: userRole === 'admin' ? '#0f172a' : '#94a3b8', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
            >Admin</button>
            <button aria-label="Switch to teacher portal"
              onClick={() => onSwitchPortal('teacher')}
              style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: userRole === 'teacher' ? '#38bdf8' : 'transparent', color: userRole === 'teacher' ? '#0f172a' : '#94a3b8', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
            >Teacher</button>
          </div>
        </div>

        <nav aria-label="Main navigation" style={{ flex: 1, padding: '20px 0' }}>
          {userRole === 'admin' && (
            <>
              <SidebarGroup title="Dashboard">
                <SidebarItem icon="📊" label="Dashboard" active={activeTab === 'overview'} onClick={() => onTabChange('overview')} />
              </SidebarGroup>

              <SidebarGroup title="Students">
                <SidebarItem icon="👥" label="All Students" active={activeTab === 'student-list'} onClick={() => onTabChange('student-list')} />
                <SidebarItem icon="➕" label="Add Student" active={activeTab === 'students'} onClick={() => onTabChange('students')} />
                <SidebarItem icon="🎓" label="Promote Students" active={activeTab === 'promote'} onClick={() => onTabChange('promote')} />
                <SidebarItem icon="📥" label="Bulk Import (CSV)" active={activeTab === 'import'} onClick={() => onTabChange('import')} />
              </SidebarGroup>

              <SidebarGroup title="Academics">
                <SidebarItem icon="📝" label="Score Entry" active={activeTab === 'score-entry'} onClick={() => onTabChange('score-entry')} />
                <SidebarItem icon="✅" label="Grade Approval" active={activeTab === 'approval'} onClick={() => onTabChange('approval')} />
                <SidebarItem icon="📄" label="Report Cards" active={activeTab === 'reports'} onClick={() => onTabChange('reports')} />
                <SidebarItem icon="⚖️" label="Grade Scale" active={activeTab === 'scale'} onClick={() => onTabChange('scale')} />
                <SidebarItem icon="📚" label="Subjects" active={activeTab === 'subjects'} onClick={() => onTabChange('subjects')} />
              </SidebarGroup>

              <SidebarGroup title="Staff">
                <SidebarItem icon="👩‍" label="Staff Directory" active={activeTab === 'teacher-list'} onClick={() => onTabChange('teacher-list')} />
                <SidebarItem icon="➕" label="Add Teacher" active={activeTab === 'teachers'} onClick={() => onTabChange('teachers')} />
                <SidebarItem icon="🔗" label="Assignments" active={activeTab === 'assignments'} onClick={() => onTabChange('assignments')} />
              </SidebarGroup>

              <SidebarGroup title="Finance">
                <SidebarItem icon="💰" label="Fee Management" active={activeTab === 'fees'} onClick={() => onTabChange('fees')} />
              </SidebarGroup>

              <SidebarGroup title="System">
                <SidebarItem icon="⚙️" label="School Settings" active={activeTab === 'settings'} onClick={() => onTabChange('settings')} />
                <SidebarItem icon="🔑" label="Reset Password" active={activeTab === 'reset-password'} onClick={() => onTabChange('reset-password')} />
              </SidebarGroup>

              <SidebarGroup title="Communication">
                <SidebarItem icon="📢" label="Announcements" active={activeTab === 'announcements'} onClick={() => onTabChange('announcements')} />
                <SidebarItem icon="📬" label="Contact Messages" active={activeTab === 'contact-messages'} onClick={() => onTabChange('contact-messages')} />
                <SidebarItem icon="📋" label="Applications" active={activeTab === 'applications'} onClick={() => onTabChange('applications')} />
              </SidebarGroup>

              <SidebarGroup title="Website News">
                <SidebarItem icon="📰" label="Post News" active={activeTab === 'post-news'} onClick={() => onTabChange('post-news')} />
                <SidebarItem icon="📁" label="Manage News" active={activeTab === 'manage-news'} onClick={() => onTabChange('manage-news')} />
              </SidebarGroup>
            </>
          )}

          {userRole === 'teacher' && (
            <>
              <SidebarGroup title="Dashboard">
                <SidebarItem icon="📊" label="My Dashboard" active={activeTab === 'teacher-dashboard'} onClick={() => onTabChange('teacher-dashboard')} />
              </SidebarGroup>

              <SidebarGroup title="Academics">
                <SidebarItem icon="📝" label="Gradebook" active={activeTab === 'scores'} onClick={() => onTabChange('scores')} />
                <SidebarItem icon="✅" label="Quick Attendance" active={activeTab === 'quick-attendance'} onClick={() => onTabChange('quick-attendance')} />
                <SidebarItem icon="👥" label="Class Roster" active={activeTab === 'roster'} onClick={() => onTabChange('roster')} />
                <SidebarItem icon="📋" label="Attendance" active={activeTab === 'teacher-attendance'} onClick={() => onTabChange('teacher-attendance')} />
              </SidebarGroup>

              <SidebarGroup title="Assignments">
                <SidebarItem icon="📚" label="Homework Manager" active={activeTab === 'homework'} onClick={() => onTabChange('homework')} />
              </SidebarGroup>

              <SidebarGroup title="Communication">
                <SidebarItem icon="📢" label="Announcements" active={activeTab === 'teacher-comms'} onClick={() => onTabChange('teacher-comms')} />
              </SidebarGroup>
            </>
          )}
        </nav>

        <div style={{ padding: '20px', borderTop: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={onPasswordClick} aria-label="Change Password" style={{ width: '100%', padding: '10px', background: '#475569', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'background 0.2s' }}>Change Password</button>
          <button onClick={onLogoutClick} aria-label="Logout" style={{ width: '100%', padding: '10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'background 0.2s' }}>Logout</button>
        </div>
      </aside>
    </>
  )
}
