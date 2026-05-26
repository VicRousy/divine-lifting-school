import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'
import Login from './components/Login'
import ConfirmModal from './components/ConfirmModal'
import Toast from './components/Toast'

// Core Dashboard Components
import DashboardStats from './components/Dashboard/DashboardStats'
import RecentActivity from './components/Dashboard/RecentActivity'
import AdminAnnouncements from './components/Admin/Announcements'

// Registration Components
import AddTeacher from './components/Teachers/AddTeacher'
import AddClass from './components/Classes/AddClass'
import AddStudent from './components/Students/AddStudent'
import BulkImport from './components/Students/BulkImport'

// Management Components
import StudentList from './components/Students/StudentList'
import TeacherList from './components/Teachers/TeacherList'
import ClassList from './components/Classes/ClassList'
import SubjectList from './components/Subjects/SubjectList'
import TeacherAssignments from './components/Teachers/TeacherAssignments'

// Academic Components
import StudentProfile from './components/Students/StudentProfile'
import ScoreEntry from './components/Academics/ScoreEntry'
import GradeApproval from './components/Academics/GradeApproval'
import ReportCards from './components/Academics/ReportCards'
import ClassPromotion from './components/Academics/ClassPromotion'
import GradeScale from './components/Academics/GradeScale'

// Finance Components
import FeeManagement from './components/Finance/FeeManagement'

// Teacher Portal Components
import TeacherDashboard from './components/TeacherPortal/TeacherDashboard'
import TeacherGradebook from './components/TeacherPortal/TeacherGradebook'
import ClassRoster from './components/TeacherPortal/ClassRoster'
import TeacherComms from './components/TeacherPortal/TeacherComms'
import AttendanceMarking from './components/Academics/AttendanceMarking'
import QuickAttendance from './components/TeacherPortal/QuickAttendance'
import HomeworkManager from './components/TeacherPortal/HomeworkManager'

// Parent Portal
import ParentDashboard from './components/ParentPortal/ParentDashboard'

// Student Portal
import StudentPortal from './components/StudentPortal/StudentPortal'

// Settings
import SchoolSettings from './components/Settings/SchoolSettings'

function App() {
  const [session, setSession] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [userInfo, setUserInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [selectedStudentProfile, setSelectedStudentProfile] = useState(null)
  const [toast, setToast] = useState(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const initialized = useRef(false)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const prepareApp = async () => {
      try {
        // Check for force_login parameter to clear session (useful for testing)
        const urlParams = new URLSearchParams(window.location.search)
        if (urlParams.get('force_login') === 'true') {
          localStorage.removeItem('dls_session')
        }

        const storedSession = localStorage.getItem('dls_session')
        if (storedSession) {
          const parsed = JSON.parse(storedSession)
          setSession(parsed)
          setUserRole(parsed.role)
          setUserInfo(parsed.userInfo)
          setActiveTab(parsed.role === 'teacher' ? 'teacher-dashboard' : parsed.role === 'parent' ? 'overview' : 'overview')
        }
      } catch (error) {
        console.error('Initialization error:', error)
      } finally {
        setLoading(false)
      }
    }

    prepareApp()
  }, [])

  const handleLogin = (role, userInfo) => {
    const sessionData = { role, userInfo, loginTime: new Date().toISOString() }
    setSession(sessionData)
    setUserRole(role)
    setUserInfo(userInfo)
    setActiveTab(role === 'teacher' ? 'teacher-dashboard' : role === 'parent' ? 'overview' : 'overview')
    setLoading(false)
    localStorage.setItem('dls_session', JSON.stringify(sessionData))
    showToast(`Welcome back! Logged in as ${role}`, 'success')
  }

  const handleLogout = async () => {
    setShowLogoutConfirm(false)
    setSession(null)
    setUserRole(null)
    setUserInfo(null)
    setActiveTab('overview')
    localStorage.removeItem('dls_session')
    showToast('Logged out successfully', 'success')
  }

  const switchPortal = (mode) => {
    setUserRole(mode)
    setActiveTab(mode === 'teacher' ? 'teacher-dashboard' : 'overview')
    const sessionData = { role: mode, userInfo, loginTime: new Date().toISOString() }
    setSession(sessionData)
    localStorage.setItem('dls_session', JSON.stringify(sessionData))
    showToast(`Switched to ${mode} portal`, 'success')
  }

  const refreshData = () => setRefreshTrigger(prev => prev + 1)

  const getHeaderTitle = () => {
    if (activeTab === 'student-list' && selectedStudentProfile) return 'Student Detailed Record'
    const titles = {
      'overview': 'Dashboard Overview',
      'teachers': 'Teacher Registration',
      'classes': 'Classroom Setup',
      'students': 'Student Admission',
      'student-list': 'Student Master List',
      'teacher-list': 'Staff Directory',
      'class-list': 'Classroom Manager',
      'subjects': 'Subject Curriculum',
      'assignments': 'Teacher Assignments',
      'score-entry': 'Result Manager & Gradebook',
      'teacher-dashboard': 'My Dashboard',
      'scores': 'Gradebook',
      'roster': 'Class Roster',
      'teacher-attendance': 'Attendance Marking',
      'teacher-comms': 'Announcements',
      'promote': 'Class Promotion',
      'import': 'Bulk Import',
      'approval': 'Grade Approval',
      'reports': 'Report Cards',
      'scale': 'Grade Scale',
      'fees': 'Fee Management'
    }
    return titles[activeTab] || activeTab.toUpperCase()
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#020617', color: '#38bdf8' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Verifying Access...</h2>
          <p style={{ color: '#475569' }}>Connecting to school database</p>
        </div>
      </div>
    )
  }

  if (!session) return <Login onLogin={handleLogin} />

  // Parent Portal
  if (userRole === 'parent') {
    return (
      <>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <ParentDashboard userInfo={userInfo} onLogout={() => setShowLogoutConfirm(true)} />
        <ConfirmModal isOpen={showLogoutConfirm} title="Confirm Logout" message="Are you sure?" confirmText="Logout" onConfirm={handleLogout} onCancel={() => setShowLogoutConfirm(false)} type="danger" />
      </>
    )
  }

  // Student Portal
  if (userRole === 'student') {
    return (
      <>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <StudentPortal userInfo={userInfo} onLogout={() => setShowLogoutConfirm(true)} />
        <ConfirmModal isOpen={showLogoutConfirm} title="Confirm Logout" message="Are you sure?" confirmText="Logout" onConfirm={handleLogout} onCancel={() => setShowLogoutConfirm(false)} type="danger" />
      </>
    )
  }

  return (
    <div className="admin-layout" style={{ display: 'flex', minHeight: '100vh', background: '#0f172a', color: '#f8fafc' }}>
      
       {/* Global Style to Hide Scrollbars Completely & Mobile Responsiveness */}
       <style>{`
         ::-webkit-scrollbar {
           display: none;
         }
         * {
           -ms-overflow-style: none;
           scrollbar-width: none;
         }
         body {
           margin: 0;
           overflow-x: hidden;
         }
         
         /* Mobile/Tablet: Sidebar hidden by default, hamburger visible */
         @media (max-width: 1024px) {
           .admin-layout {
             display: flex !important;
             flex-direction: column !important;
           }
           .hamburger-btn {
             display: block !important;
           }
           .mobile-close-btn {
             display: block !important;
           }
           .sidebar {
             position: fixed !important;
             top: 0 !important;
             left: 0 !important;
             height: 100vh !important;
             z-index: 1000 !important;
             transform: translateX(-100%) !important;
             transition: transform 0.3s ease !important;
             width: 280px !important;
           }
           .sidebar.open {
             transform: translateX(0) !important;
           }
           .sidebar-overlay {
             display: block !important;
             position: fixed !important;
             top: 0 !important;
             left: 0 !important;
             right: 0 !important;
             bottom: 0 !important;
             background: rgba(0,0,0,0.5) !important;
             z-index: 999 !important;
           }
           .main-content {
             padding: 15px !important;
           }
           .header-bar {
             padding: 10px 15px !important;
           }
           .stats-grid {
             grid-template-columns: 1fr !important;
           }
           .chart-grid {
             grid-template-columns: 1fr !important;
           }
           .table-container {
             overflow-x: auto !important;
           }
         }
         
         /* Desktop/Laptop: Sidebar always visible, no hamburger */
         @media (min-width: 1025px) {
           .sidebar {
             display: flex !important;
             position: sticky !important;
             transform: none !important;
             width: 260px !important;
           }
           .hamburger-btn, .mobile-close-btn, .sidebar-overlay {
             display: none !important;
           }
         }
       `}</style>

       {/* SIDEBAR */}
       {mobileMenuOpen && <div className="sidebar-overlay" onClick={() => setMobileMenuOpen(false)} />}
       <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`} style={{ background: '#1e293b', borderRight: '1px solid #334155', display: 'flex', flexDirection: 'column', padding: '20px 0', flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', alignSelf: 'flex-start' }}>
        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#38bdf8' }}>DLS Admin</h2>
              <p style={{ margin: '5px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>Management Portal</p>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer', display: 'none' }} className="mobile-close-btn">✕</button>
          </div>
          
          {/* Back to Website Button */}
          <a 
            href="https://divine-lifting-website.vercel.app" 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '15px', padding: '8px', borderRadius: '6px', background: '#334155', color: '#f8fafc', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 'bold', transition: 'background 0.2s' }}
          >
             Back to Website
          </a>
          
          {/* Admin/Teacher Toggle */}
          <div style={{ display: 'flex', background: '#0f172a', borderRadius: '8px', padding: '4px', marginTop: '20px' }}>
            <button 
              onClick={() => switchPortal('admin')}
              style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: userRole === 'admin' ? '#38bdf8' : 'transparent', color: userRole === 'admin' ? '#0f172a' : '#94a3b8', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
            >Admin</button>
            <button 
              onClick={() => switchPortal('teacher')}
              style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: userRole === 'teacher' ? '#38bdf8' : 'transparent', color: userRole === 'teacher' ? '#0f172a' : '#94a3b8', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
            >Teacher</button>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '20px 0' }}>
          {/* Admin Menu */}
          {userRole === 'admin' && (
            <>
              <SidebarGroup title="Dashboard">
                <SidebarItem icon="📊" label="Dashboard" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
              </SidebarGroup>
              
              <SidebarGroup title="Students">
                <SidebarItem icon="👥" label="All Students" active={activeTab === 'student-list'} onClick={() => setActiveTab('student-list')} />
                <SidebarItem icon="➕" label="Add Student" active={activeTab === 'students'} onClick={() => setActiveTab('students')} />
                <SidebarItem icon="🎓" label="Promote Students" active={activeTab === 'promote'} onClick={() => setActiveTab('promote')} />
                <SidebarItem icon="📥" label="Bulk Import (CSV)" active={activeTab === 'import'} onClick={() => setActiveTab('import')} />
              </SidebarGroup>

              <SidebarGroup title="Academics">
                <SidebarItem icon="📝" label="Score Entry" active={activeTab === 'score-entry'} onClick={() => setActiveTab('score-entry')} />
                <SidebarItem icon="✅" label="Grade Approval" active={activeTab === 'approval'} onClick={() => setActiveTab('approval')} />
                <SidebarItem icon="📄" label="Report Cards" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
                <SidebarItem icon="⚖️" label="Grade Scale" active={activeTab === 'scale'} onClick={() => setActiveTab('scale')} />
                <SidebarItem icon="📚" label="Subjects" active={activeTab === 'subjects'} onClick={() => setActiveTab('subjects')} />
              </SidebarGroup>
              
              <SidebarGroup title="Staff">
                <SidebarItem icon="👩‍" label="Staff Directory" active={activeTab === 'teacher-list'} onClick={() => setActiveTab('teacher-list')} />
                <SidebarItem icon="➕" label="Add Teacher" active={activeTab === 'teachers'} onClick={() => setActiveTab('teachers')} />
                <SidebarItem icon="🔗" label="Assignments" active={activeTab === 'assignments'} onClick={() => setActiveTab('assignments')} />
              </SidebarGroup>

              <SidebarGroup title="Finance">
                <SidebarItem icon="💰" label="Fee Management" active={activeTab === 'fees'} onClick={() => setActiveTab('fees')} />
              </SidebarGroup>

              <SidebarGroup title="System">
                <SidebarItem icon="⚙️" label="School Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
              </SidebarGroup>

              <SidebarGroup title="Communication">
                <SidebarItem icon="📢" label="Announcements" active={activeTab === 'announcements'} onClick={() => setActiveTab('announcements')} />
              </SidebarGroup>
            </>
          )}

          {/* Teacher Menu */}
          {userRole === 'teacher' && (
            <>
              <SidebarGroup title="Dashboard">
                <SidebarItem icon="📊" label="My Dashboard" active={activeTab === 'teacher-dashboard'} onClick={() => setActiveTab('teacher-dashboard')} />
              </SidebarGroup>
              
              <SidebarGroup title="Academics">
                <SidebarItem icon="📝" label="Gradebook" active={activeTab === 'scores'} onClick={() => setActiveTab('scores')} />
                <SidebarItem icon="✅" label="Quick Attendance" active={activeTab === 'quick-attendance'} onClick={() => setActiveTab('quick-attendance')} />
                <SidebarItem icon="👥" label="Class Roster" active={activeTab === 'roster'} onClick={() => setActiveTab('roster')} />
                <SidebarItem icon="📋" label="Attendance" active={activeTab === 'teacher-attendance'} onClick={() => setActiveTab('teacher-attendance')} />
              </SidebarGroup>
              
              <SidebarGroup title="Assignments">
                <SidebarItem icon="📚" label="Homework Manager" active={activeTab === 'homework'} onClick={() => setActiveTab('homework')} />
              </SidebarGroup>
              
              <SidebarGroup title="Communication">
                <SidebarItem icon="📢" label="Announcements" active={activeTab === 'teacher-comms'} onClick={() => setActiveTab('teacher-comms')} />
              </SidebarGroup>
            </>
          )}
        </nav>

        <div style={{ padding: '20px', borderTop: '1px solid #334155' }}>
          <button onClick={() => setShowLogoutConfirm(true)} style={{ width: '100%', padding: '10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'background 0.2s' }}>Logout</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* TOP HEADER BAR */}
        <header className="header-bar" style={{ background: '#1e293b', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', flexShrink: 0, position: 'sticky', top: 0, zIndex: 10 }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
             <button className="hamburger-btn" onClick={() => setMobileMenuOpen(true)} style={{ background: 'none', border: 'none', color: '#f8fafc', fontSize: '1.5rem', cursor: 'pointer' }}>☰</button>
             <div>
               <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#f8fafc' }}>Divine Lifting School</h1>
               <p style={{ margin: '5px 0 0', color: '#94a3b8' }}>Academic Management Portal</p>
             </div>
           </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* User Profile Card */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#0f172a', padding: '8px 15px', borderRadius: '10px', border: '1px solid #334155' }}>
              <div style={{ width: '35px', height: '35px', background: '#38bdf8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#0f172a' }}>
                {userInfo?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{userInfo?.name || 'User'}</div>
                <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>{userInfo?.staffId || userInfo?.schoolId || userInfo?.studentId || userInfo?.parentId || 'ID'}</div>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="main-content" style={{ flex: 1, padding: '30px' }}>
          
          {/* Search and Actions Bar (Only on Admin Dashboard) */}
          {activeTab === 'overview' && userRole === 'admin' && (
            <div className="responsive-actions" style={{ marginBottom: '30px' }}>
              <input type="text" placeholder="Search students, staff, or classes..." style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: 'white' }} />
              <button style={{ padding: '12px 20px', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>+ Student</button>
              <button style={{ padding: '12px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Fee</button>
            </div>
          )}

          {/* DASHBOARD CONTENT */}
          {userRole === 'admin' && (
            <>
              {activeTab === 'overview' && (
                <div>
                  <p className="text-dim" style={{ color: '#94a3b8', marginBottom: '20px' }}>Welcome, Administrator. Here is the current state of the school.</p>
                  <DashboardStats refreshTrigger={refreshTrigger} onNavigate={setActiveTab} />
                  <RecentActivity refreshTrigger={refreshTrigger} />
                </div>
              )}
              {activeTab === 'teachers' && <AddTeacher onAdd={refreshData} showToast={showToast} />}
              {activeTab === 'classes' && <AddClass onAdd={refreshData} showToast={showToast} />}
              {activeTab === 'students' && <AddStudent onAdd={refreshData} showToast={showToast} />}
              {activeTab === 'import' && <BulkImport showToast={showToast} />}
              {activeTab === 'student-list' && (
                selectedStudentProfile ? (
                  <StudentProfile student={selectedStudentProfile} onBack={() => setSelectedStudentProfile(null)} />
                ) : (
                  <StudentList refreshTrigger={refreshTrigger} onUpdate={refreshData} onSelectStudent={setSelectedStudentProfile} showToast={showToast} />
                )
              )}
              {activeTab === 'teacher-list' && <TeacherList refreshTrigger={refreshTrigger} onUpdate={refreshData} showToast={showToast} />}
              {activeTab === 'class-list' && <ClassList refreshTrigger={refreshTrigger} onUpdate={refreshData} showToast={showToast} />}
              {activeTab === 'subjects' && <SubjectList refreshTrigger={refreshTrigger} showToast={showToast} />}
              {activeTab === 'assignments' && <TeacherAssignments refreshTrigger={refreshTrigger} showToast={showToast} />}
              {activeTab === 'score-entry' && <ScoreEntry showToast={showToast} />}
              {activeTab === 'approval' && <GradeApproval showToast={showToast} />}
              {activeTab === 'reports' && <ReportCards showToast={showToast} />}
              {activeTab === 'fees' && <FeeManagement showToast={showToast} />}
              {activeTab === 'settings' && <SchoolSettings showToast={showToast} />}
              {activeTab === 'announcements' && <AdminAnnouncements showToast={showToast} />}
              
              {/* Placeholders */}
              {activeTab === 'promote' && <ClassPromotion showToast={showToast} />}
              {activeTab === 'scale' && <GradeScale showToast={showToast} />}
            </>
          )}

          {userRole === 'teacher' && (
            <>
              {activeTab === 'teacher-dashboard' && <TeacherDashboard user={userInfo} teacherId={userInfo?.id} onNavigate={setActiveTab} />}
              {activeTab === 'scores' && <TeacherGradebook teacherId={userInfo?.id} showToast={showToast} />}
              {activeTab === 'quick-attendance' && <QuickAttendance teacherId={userInfo?.id} showToast={showToast} />}
              {activeTab === 'roster' && <ClassRoster teacherId={userInfo?.id} />}
              {activeTab === 'teacher-attendance' && <AttendanceMarking teacherId={userInfo?.id} showToast={showToast} />}
              {activeTab === 'homework' && <HomeworkManager teacherId={userInfo?.id} showToast={showToast} />}
              {activeTab === 'teacher-comms' && <TeacherComms />}
            </>
          )}
        </div>
      </main>

      <ConfirmModal isOpen={showLogoutConfirm} title="Confirm Logout" message="Are you sure?" confirmText="Logout" onConfirm={handleLogout} onCancel={() => setShowLogoutConfirm(false)} type="danger" />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

// Helper Components for Sidebar
function SidebarGroup({ title, children }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{ margin: '0 0 10px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '1px', fontWeight: 'bold' }}>{title}</h3>
      {children}
    </div>
  )
}

function SidebarItem({ icon, label, active, onClick }) {
  return (
    <div 
      onClick={onClick}
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
}

export default App
