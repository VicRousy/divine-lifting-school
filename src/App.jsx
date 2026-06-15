import { useState, useEffect, useRef, lazy, Suspense, useCallback } from 'react'
import { supabase, lookupUserByAuthId, buildUserInfo } from './supabaseClient'
import Login from './components/Login'
import ConfirmModal from './components/ConfirmModal'
import Toast from './components/Toast'
import PasswordChangeModal from './components/PasswordChangeModal'

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

// Eager — needed immediately
import ErrorBoundary from './components/Common/ErrorBoundary'
import './styles/admin.css'
import Sidebar from './components/Sidebar/Sidebar'
import HeaderBar from './components/Common/HeaderBar'

// Lazy-loaded route components
const DashboardStats = lazy(() => import('./components/Dashboard/DashboardStats'))
const RecentActivity = lazy(() => import('./components/Dashboard/RecentActivity'))
const AdminAnnouncements = lazy(() => import('./components/Admin/Announcements'))
const AddTeacher = lazy(() => import('./components/Teachers/AddTeacher'))
const AddClass = lazy(() => import('./components/Classes/AddClass'))
const AddStudent = lazy(() => import('./components/Students/AddStudent'))
const BulkImport = lazy(() => import('./components/Students/BulkImport'))
const StudentList = lazy(() => import('./components/Students/StudentList'))
const TeacherList = lazy(() => import('./components/Teachers/TeacherList'))
const ClassList = lazy(() => import('./components/Classes/ClassList'))
const SubjectList = lazy(() => import('./components/Subjects/SubjectList'))
const TeacherAssignments = lazy(() => import('./components/Teachers/TeacherAssignments'))
const StudentProfile = lazy(() => import('./components/Students/StudentProfile'))
const ScoreEntry = lazy(() => import('./components/Academics/ScoreEntry'))
const GradeApproval = lazy(() => import('./components/Academics/GradeApproval'))
const ReportCards = lazy(() => import('./components/Academics/ReportCards'))
const ClassPromotion = lazy(() => import('./components/Academics/ClassPromotion'))
const GradeScale = lazy(() => import('./components/Academics/GradeScale'))
const FeeManagement = lazy(() => import('./components/Finance/FeeManagement'))
const ContactMessages = lazy(() => import('./components/Admin/ContactMessages'))
const Applications = lazy(() => import('./components/Admin/Applications'))
const ManageNews = lazy(() => import('./components/Admin/ManageNews'))
const PostNews = lazy(() => import('./components/Admin/PostNews'))
const TeacherDashboard = lazy(() => import('./components/TeacherPortal/TeacherDashboard'))
const TeacherGradebook = lazy(() => import('./components/TeacherPortal/TeacherGradebook'))
const ClassRoster = lazy(() => import('./components/TeacherPortal/ClassRoster'))
const TeacherComms = lazy(() => import('./components/TeacherPortal/TeacherComms'))
const AttendanceMarking = lazy(() => import('./components/Academics/AttendanceMarking'))
const QuickAttendance = lazy(() => import('./components/TeacherPortal/QuickAttendance'))
const HomeworkManager = lazy(() => import('./components/TeacherPortal/HomeworkManager'))
const ParentDashboard = lazy(() => import('./components/ParentPortal/ParentDashboard'))
const StudentPortal = lazy(() => import('./components/StudentPortal/StudentPortal'))
const SchoolSettings = lazy(() => import('./components/Settings/SchoolSettings'))
const ResetPassword = lazy(() => import('./components/Admin/ResetPassword'))

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
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const initialized = useRef(false)
  const contentRef = useRef(null)

  useEffect(() => {
    window.scrollTo(0, 0)
    if (contentRef.current) contentRef.current.focus()
  }, [activeTab])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  const restoreSession = useCallback(async (authUser) => {
    try {
      const result = await lookupUserByAuthId(authUser.id)
      if (result) {
        const { user, role } = result
        const info = buildUserInfo(role, user)
        const sessionData = { role, userInfo: info, loginTime: new Date().toISOString() }
        setSession(sessionData)
        setUserRole(role)
        setUserInfo(info)
        setActiveTab(role === 'teacher' ? 'teacher-dashboard' : role === 'parent' ? 'overview' : 'overview')
        localStorage.setItem('dls_session', JSON.stringify(sessionData))
        return true
      }
    } catch (e) {
      console.error('Session restore error:', e)
    }
    return false
  }, [])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    let mounted = true

    const prepareApp = async () => {
      try {
        // 1. Try Supabase Auth session (3s timeout)
        const authSession = await Promise.race([
          supabase.auth.getSession().then(r => r.data?.session ?? null),
          new Promise(res => setTimeout(() => res(null), 3000)),
        ])
        if (authSession?.user) {
          const restored = await restoreSession(authSession.user)
          if (restored) {
            if (mounted) setLoading(false)
            return
          }
        }

        // 2. Fallback: localStorage session
        const urlParams = new URLSearchParams(window.location.search)
        if (urlParams.get('force_login') === 'true') {
          localStorage.removeItem('dls_session')
        }

        const storedSession = localStorage.getItem('dls_session')
        if (storedSession) {
          const parsed = JSON.parse(storedSession)
          const elapsed = Date.now() - new Date(parsed.loginTime).getTime()
          if (elapsed > SESSION_DURATION_MS) {
            localStorage.removeItem('dls_session')
            if (mounted) showToast('Session expired. Please login again.', 'warning')
          } else {
            if (mounted) {
              setSession(parsed)
              setUserRole(parsed.role)
              setUserInfo(parsed.userInfo)
              setActiveTab(parsed.role === 'teacher' ? 'teacher-dashboard' : parsed.role === 'parent' ? 'overview' : 'overview')
            }
          }
        }
      } catch (error) {
        console.error('Initialization error:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    prepareApp()
    return () => { mounted = false }
  }, [restoreSession])

  const handleLogin = useCallback((role, userInfo) => {
    const sessionData = { role, userInfo, loginTime: new Date().toISOString() }
    setSession(sessionData)
    setUserRole(role)
    setUserInfo(userInfo)
    setActiveTab(role === 'teacher' ? 'teacher-dashboard' : role === 'parent' ? 'overview' : 'overview')
    setLoading(false)
    localStorage.setItem('dls_session', JSON.stringify(sessionData))
    showToast(`Welcome back! Logged in as ${role}`, 'success')

    const TABLE_MAP = { admin: 'profiles', teacher: 'teachers', student: 'students', parent: 'parents' }
    const table = TABLE_MAP[role]
    if (table) {
      supabase.from(table).update({ last_login: new Date().toISOString() }).eq('id', userInfo.id).then(() => {}).catch(() => {})
    }
  }, [])

  const handleLogout = useCallback(async () => {
    setShowLogoutConfirm(false)
    setSession(null)
    setUserRole(null)
    setUserInfo(null)
    setActiveTab('overview')
    localStorage.removeItem('dls_session')
    showToast('Logged out successfully', 'success')
    supabase.auth.signOut().catch(() => {})
  }, [])

  const switchPortal = useCallback((mode) => {
    setUserRole(mode)
    setActiveTab(mode === 'teacher' ? 'teacher-dashboard' : 'overview')
    const sessionData = { role: mode, userInfo, loginTime: new Date().toISOString() }
    setSession(sessionData)
    localStorage.setItem('dls_session', JSON.stringify(sessionData))
    showToast(`Switched to ${mode} portal`, 'success')
  }, [userInfo])

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
      'fees': 'Fee Management',
      'post-news': 'Post News',
      'manage-news': 'Manage News',
      'contact-messages': 'Contact Messages',
      'applications': 'Admission Applications'
    }
    return titles[activeTab] || activeTab.toUpperCase()
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#020617', color: '#38bdf8' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '4px solid #1e293b', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }} />
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

      <Sidebar
        userRole={userRole}
        activeTab={activeTab}
        mobileMenuOpen={mobileMenuOpen}
        onTabChange={setActiveTab}
        onMobileClose={() => setMobileMenuOpen(false)}
        onLogoutClick={() => setShowLogoutConfirm(true)}
        onPasswordClick={() => setShowPasswordChange(true)}
        onSwitchPortal={switchPortal}
      />

       {/* MAIN CONTENT */}
       <main className="main-layout" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        <HeaderBar
          title={getHeaderTitle()}
          userInfo={userInfo}
          showProfileMenu={showProfileMenu}
          onMobileOpen={() => setMobileMenuOpen(true)}
          onToggleProfileMenu={() => setShowProfileMenu(prev => !prev)}
          onPasswordClick={() => { setShowProfileMenu(false); setShowPasswordChange(true) }}
          onLogoutClick={() => { setShowProfileMenu(false); setShowLogoutConfirm(true) }}
        />

        {/* CONTENT AREA */}
        <ErrorBoundary>
        <div className="main-content" ref={contentRef} tabIndex={-1} style={{ flex: 1, padding: '30px' }}>
          
          {/* Search and Actions Bar (Only on Admin Dashboard) */}
          {activeTab === 'overview' && userRole === 'admin' && (
            <div className="responsive-actions" style={{ marginBottom: '30px' }}>
              <input type="text" aria-label="Search students, staff, or classes" placeholder="Search students, staff, or classes..." style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: 'white' }}
                onKeyDown={(e) => { if (e.key === 'Enter') setActiveTab('student-list') }}
              />
              <button aria-label="Add new student" onClick={() => setActiveTab('students')} style={{ padding: '12px 20px', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>+ Student</button>
              <button aria-label="Open fee management" onClick={() => setActiveTab('fees')} style={{ padding: '12px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Fee</button>
            </div>
          )}

          {/* DASHBOARD CONTENT */}
          <Suspense fallback={<div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>Loading...</div>}>
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
              {activeTab === 'reset-password' && <ResetPassword showToast={showToast} />}
              {activeTab === 'announcements' && <AdminAnnouncements showToast={showToast} />}
              {activeTab === 'contact-messages' && <ContactMessages showToast={showToast} />}
              {activeTab === 'applications' && <Applications showToast={showToast} />}
              {activeTab === 'post-news' && <PostNews showToast={showToast} />}
              {activeTab === 'manage-news' && <ManageNews showToast={showToast} />}
              
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
          </Suspense>
        </div>
        </ErrorBoundary>
      </main>

      <ConfirmModal isOpen={showLogoutConfirm} title="Confirm Logout" message="Are you sure?" confirmText="Logout" onConfirm={handleLogout} onCancel={() => setShowLogoutConfirm(false)} type="danger" />
      {showPasswordChange && <PasswordChangeModal userInfo={userInfo} userRole={userRole} onClose={() => setShowPasswordChange(false)} showToast={showToast} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

export default App
