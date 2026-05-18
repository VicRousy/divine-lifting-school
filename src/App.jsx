import { useState, useEffect, useRef } from 'react'
import PortalLanding from './components/PortalLanding'
import Login from './components/Login'
import ConfirmModal from './components/ConfirmModal'
import Toast from './components/Toast'

// Core Dashboard Components
import DashboardStats from './components/Dashboard/DashboardStats'
import RecentActivity from './components/Dashboard/RecentActivity'

// Registration Components
import AddTeacher from './components/Teachers/AddTeacher'
import AddClass from './components/Classes/AddClass'
import AddStudent from './components/Students/AddStudent'

// Management Components
import StudentList from './components/Students/StudentList'
import TeacherList from './components/Teachers/TeacherList'
import ClassList from './components/Classes/ClassList'
import SubjectList from './components/Subjects/SubjectList'
import TeacherAssignments from './components/Teachers/TeacherAssignments'

// Academic Components
import StudentProfile from './components/Students/StudentProfile'
import ScoreEntry from './components/Academics/ScoreEntry'

// Teacher Portal Components
import TeacherDashboard from './components/TeacherPortal/TeacherDashboard'
import TeacherGradebook from './components/TeacherPortal/TeacherGradebook'
import ClassRoster from './components/TeacherPortal/ClassRoster'
import TeacherComms from './components/TeacherPortal/TeacherComms'
import AttendanceMarking from './components/Academics/AttendanceMarking'

function App() {
  const [screen, setScreen] = useState('landing')
  const [selectedPortal, setSelectedPortal] = useState(null)
  const [session, setSession] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [userInfo, setUserInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [selectedStudentProfile, setSelectedStudentProfile] = useState(null)
  const [toast, setToast] = useState(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [viewMode, setViewMode] = useState('admin')
  const initialized = useRef(false)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const prepareApp = async () => {
      try {
        const storedSession = localStorage.getItem('dls_session')
        if (storedSession) {
          const parsed = JSON.parse(storedSession)
          setSession(parsed)
          setUserRole(parsed.role)
          setUserInfo(parsed.userInfo)
          setViewMode(parsed.role)
          setScreen('dashboard')
        }
      } catch (error) {
        console.error('Initialization error:', error)
      } finally {
        setLoading(false)
      }
    }

    prepareApp()
  }, [])

  const handleSelectPortal = (portal) => {
    setSelectedPortal(portal)
    setScreen('login')
  }

  const handleBackToPortals = () => {
    setScreen('landing')
    setSelectedPortal(null)
  }

  const handleLogin = (role, userInfo) => {
    const sessionData = { role, userInfo, loginTime: new Date().toISOString() }
    setSession(sessionData)
    setUserRole(role)
    setUserInfo(userInfo)
    setViewMode(role)
    setScreen('dashboard')
    localStorage.setItem('dls_session', JSON.stringify(sessionData))
    showToast(`Welcome back! Logged in as ${role}`, 'success')
  }

  const handleLogout = async () => {
    setShowLogoutConfirm(false)
    setSession(null)
    setUserRole(null)
    setUserInfo(null)
    setActiveTab('overview')
    setViewMode('admin')
    setScreen('landing')
    setSelectedPortal(null)
    localStorage.removeItem('dls_session')
    showToast('Logged out successfully', 'success')
  }

  const switchPortal = (mode) => {
    setViewMode(mode)
    setActiveTab(mode === 'teacher' ? 'teacher-dashboard' : 'overview')
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
      'score-entry': 'Result Manager & Gradebook'
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

  if (screen === 'landing') {
    return <PortalLanding onSelectPortal={handleSelectPortal} />
  }

  if (screen === 'login') {
    return <Login portal={selectedPortal} onLogin={handleLogin} onBack={handleBackToPortals} />
  }

  if (viewMode === 'teacher' || userRole === 'teacher') {
    return (
      <>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        {userRole === 'admin' && (
          <div style={{ background: '#1e293b', padding: '8px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Viewing: Teacher Portal</span>
            <button onClick={() => switchPortal('admin')} style={{ background: '#38bdf8', color: '#020617', border: 'none', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
              Switch to Admin Portal
            </button>
          </div>
        )}
        <TeacherPortalContent
          user={userInfo}
          teacherId={userInfo?.id}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          showToast={showToast}
          onLogout={() => setShowLogoutConfirm(true)}
        />
        <ConfirmModal
          isOpen={showLogoutConfirm}
          title="Confirm Logout"
          message="Are you sure you want to log out?"
          confirmText="Logout"
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutConfirm(false)}
          type="danger"
        />
      </>
    )
  }

  return (
    <div className="admin-layout">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <aside className="sidebar">
        <div className="sidebar-logo">DIVINE LIFTING SCHOOL</div>

        <div className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => { setActiveTab('overview'); setSelectedStudentProfile(null); }}> Dashboard Home</div>

        <hr className="sidebar-divider" />
        <small className="sidebar-label">REGISTRATION</small>
        <div className={`nav-item ${activeTab === 'teachers' ? 'active' : ''}`} onClick={() => { setActiveTab('teachers'); setSelectedStudentProfile(null); }}> Add Teacher</div>
        <div className={`nav-item ${activeTab === 'classes' ? 'active' : ''}`} onClick={() => { setActiveTab('classes'); setSelectedStudentProfile(null); }}> Add Classroom</div>
        <div className={`nav-item ${activeTab === 'students' ? 'active' : ''}`} onClick={() => { setActiveTab('students'); setSelectedStudentProfile(null); }}> Admit Student</div>

        <hr className="sidebar-divider" />
        <small className="sidebar-label">MANAGEMENT</small>
        <div className={`nav-item ${activeTab === 'student-list' ? 'active' : ''}`} onClick={() => { setActiveTab('student-list'); setSelectedStudentProfile(null); }}> Student Master List</div>
        <div className={`nav-item ${activeTab === 'teacher-list' ? 'active' : ''}`} onClick={() => { setActiveTab('teacher-list'); setSelectedStudentProfile(null); }}> Staff Directory</div>
        <div className={`nav-item ${activeTab === 'class-list' ? 'active' : ''}`} onClick={() => { setActiveTab('class-list'); setSelectedStudentProfile(null); }}> Classroom Manager</div>
        <div className={`nav-item ${activeTab === 'subjects' ? 'active' : ''}`} onClick={() => { setActiveTab('subjects'); setSelectedStudentProfile(null); }}> Subject Master</div>
        <div className={`nav-item ${activeTab === 'assignments' ? 'active' : ''}`} onClick={() => { setActiveTab('assignments'); setSelectedStudentProfile(null); }}> Teacher Assignments</div>

        <hr className="sidebar-divider" />
        <small className="sidebar-label">ACADEMICS</small>
        <div className={`nav-item ${activeTab === 'score-entry' ? 'active' : ''}`} onClick={() => { setActiveTab('score-entry'); setSelectedStudentProfile(null); }}> Result Manager</div>

        <hr className="sidebar-divider" />
        <div className="nav-item" onClick={() => switchPortal('teacher')} style={{ color: '#a855f7' }}> Switch to Teacher Portal</div>
        <div className="nav-item" onClick={() => setShowLogoutConfirm(true)} style={{ color: '#ef4444', marginTop: 'auto' }}> Logout</div>
      </aside>

      <main className="main-content">
        <DashboardStats refreshTrigger={refreshTrigger} />
        <div className="dashboard-card">
          <h2 className="content-title">{getHeaderTitle()}</h2>

          {activeTab === 'overview' && (
            <div>
              <p className="text-dim">Welcome, Administrator. Here is the current state of the school.</p>
              <hr className="content-divider" />
              <RecentActivity refreshTrigger={refreshTrigger} />
            </div>
          )}

          {activeTab === 'teachers' && <AddTeacher onAdd={refreshData} showToast={showToast} />}
          {activeTab === 'classes' && <AddClass onAdd={refreshData} showToast={showToast} />}
          {activeTab === 'students' && <AddStudent onAdd={refreshData} showToast={showToast} />}

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
        </div>
      </main>

      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to log out of the Divine Lifting Admin Portal? Any unsaved progress will be lost."
        confirmText="Logout"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
        type="danger"
      />
    </div>
  )
}

function TeacherPortalContent({ user, teacherId, activeTab, setActiveTab, showToast, onLogout }) {
  const navigate = (tab) => setActiveTab(tab)

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a' }}>
      <nav style={{ background: '#1e293b', padding: '12px 20px', display: 'flex', gap: '10px', alignItems: 'center', borderBottom: '1px solid #334155', flexWrap: 'wrap' }}>
        <span style={{ color: '#a855f7', fontWeight: 'bold', marginRight: '20px' }}>TEACHER PORTAL</span>
        <button onClick={() => navigate('teacher-dashboard')} style={navBtnStyle(activeTab === 'teacher-dashboard')}>Dashboard</button>
        <button onClick={() => navigate('scores')} style={navBtnStyle(activeTab === 'scores')}>Gradebook</button>
        <button onClick={() => navigate('roster')} style={navBtnStyle(activeTab === 'roster')}>Class Roster</button>
        <button onClick={() => navigate('teacher-attendance')} style={navBtnStyle(activeTab === 'teacher-attendance')}>Attendance</button>
        <button onClick={() => navigate('teacher-comms')} style={navBtnStyle(activeTab === 'teacher-comms')}>Announcements</button>
        <button onClick={onLogout} style={{ ...navBtnStyle(false), background: '#ef4444', color: 'white', marginLeft: 'auto' }}>Logout</button>
      </nav>

      <div style={{ padding: '20px' }}>
        {activeTab === 'teacher-dashboard' && <TeacherDashboard user={user} teacherId={teacherId} onNavigate={navigate} />}
        {activeTab === 'scores' && <TeacherGradebook teacherId={teacherId} showToast={showToast} />}
        {activeTab === 'roster' && <ClassRoster teacherId={teacherId} />}
        {activeTab === 'teacher-attendance' && <AttendanceMarking teacherId={teacherId} showToast={showToast} />}
        {activeTab === 'teacher-comms' && <TeacherComms />}
      </div>
    </div>
  )
}

function navBtnStyle(active) {
  return {
    background: active ? '#a855f7' : 'transparent',
    color: active ? '#020617' : '#94a3b8',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: active ? 'bold' : 'normal',
    fontSize: '0.85rem'
  }
}

export default App
