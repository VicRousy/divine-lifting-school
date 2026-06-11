import { useState, useEffect, useRef, lazy, Suspense, useCallback } from 'react'
import { supabase, lookupUserByAuthId, lookupUserByEmail, buildUserInfo } from './supabaseClient'
import Login from './components/Login'
import ConfirmModal from './components/ConfirmModal'
import Toast from './components/Toast'
import PasswordChangeModal from './components/PasswordChangeModal'
import ReAuthModal from './components/ReAuthModal'

import ErrorBoundary from './components/Common/ErrorBoundary'
import './styles/admin.css'
import Sidebar from './components/Sidebar/Sidebar'
import HeaderBar from './components/Common/HeaderBar'

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

function TabErrorBoundary({ children }) {
  return <ErrorBoundary>{children}</ErrorBoundary>
}

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
  const [reAuthMode, setReAuthMode] = useState(null)
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
      localStorage.removeItem('dls_session')
      const result = await lookupUserByAuthId(authUser.id)
      if (result) {
        const { user, role } = result
        const info = buildUserInfo(role, user)
        setSession({ role, userInfo: info, loginTime: new Date().toISOString() })
        setUserRole(role)
        setUserInfo(info)
        setActiveTab(role === 'teacher' ? 'teacher-dashboard' : role === 'parent' ? 'overview' : 'overview')
        return
      }
      // If auth_id lookup fails, try email lookup
      if (authUser.email) {
        const emailResult = await lookupUserByEmail(authUser.email)
        if (emailResult) {
          const { user, role } = emailResult
          const info = buildUserInfo(role, user)
          setSession({ role, userInfo: info, loginTime: new Date().toISOString() })
          setUserRole(role)
          setUserInfo(info)
          setActiveTab(role === 'teacher' ? 'teacher-dashboard' : role === 'parent' ? 'overview' : 'overview')
          return
        }
      }
      console.warn('Session restore: user not found in any table')
    } catch (e) {
      console.error('Session restore error:', e)
    }
  }, [])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    let mounted = true
    const init = async () => {
      try {
        // Try to restore from Supabase Auth session
        const { data: { session: authSession } } = await supabase.auth.getSession()
        if (authSession?.user) {
          await restoreSession(authSession.user)
          localStorage.removeItem('dls_session')
          if (mounted) setLoading(false)
          return
        }

        // No Supabase Auth session — clear stale localStorage session
        localStorage.removeItem('dls_session')
      } catch (error) {
        console.error('Initialization error:', error)
        localStorage.removeItem('dls_session')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, authSession) => {
      if (event === 'SIGNED_IN' && authSession?.user) {
        await restoreSession(authSession.user)
      } else if (event === 'SIGNED_OUT') {
        setSession(null)
        setUserRole(null)
        setUserInfo(null)
        localStorage.removeItem('dls_session')
      }
    })

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [restoreSession])

  const handleLogin = useCallback((role, userInfo) => {
    const sessionData = { role, userInfo, loginTime: new Date().toISOString() }
    setSession(sessionData)
    setUserRole(role)
    setUserInfo(userInfo)
    setActiveTab(role === 'teacher' ? 'teacher-dashboard' : role === 'parent' ? 'overview' : 'overview')
    setLoading(false)
    showToast(`Welcome back! Logged in as ${role}`, 'success')

    const TABLE_MAP = { admin: 'profiles', teacher: 'teachers', student: 'students', parent: 'parents' }
    const table = TABLE_MAP[role]
    if (table) {
      supabase.from(table).update({ last_login: new Date().toISOString() }).eq('id', userInfo.id).then(() => {}).catch(() => {})
    }
  }, [])

  const handleLogout = useCallback(async () => {
    setShowLogoutConfirm(false)
    await supabase.auth.signOut().catch(() => {})
    setSession(null)
    setUserRole(null)
    setUserInfo(null)
    setActiveTab('overview')
    localStorage.removeItem('dls_session')
    showToast('Logged out successfully', 'success')
  }, [])

  const doSwitchPortal = useCallback((mode) => {
    setUserRole(mode)
    setActiveTab(mode === 'teacher' ? 'teacher-dashboard' : 'overview')
    setSession(prev => ({ ...prev, role: mode }))
    showToast(`Switched to ${mode} portal`, 'success')
  }, [])

  const switchPortal = useCallback((mode) => {
    if (mode !== userRole) {
      setReAuthMode(mode)
    }
  }, [userRole])

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

  if (userRole === 'parent') {
    return (
      <>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <ParentDashboard userInfo={userInfo} onLogout={() => setShowLogoutConfirm(true)} />
        <ConfirmModal isOpen={showLogoutConfirm} title="Confirm Logout" message="Are you sure?" confirmText="Logout" onConfirm={handleLogout} onCancel={() => setShowLogoutConfirm(false)} type="danger" />
      </>
    )
  }

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

        <div className="main-content" ref={contentRef} tabIndex={-1} style={{ flex: 1, padding: '30px' }}>

          {activeTab === 'overview' && userRole === 'admin' && (
            <div className="responsive-actions" style={{ marginBottom: '30px' }}>
              <input type="text" aria-label="Search students, staff, or classes" placeholder="Search students, staff, or classes..." style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: 'white' }}
                onKeyDown={(e) => { if (e.key === 'Enter') setActiveTab('student-list') }}
              />
              <button aria-label="Add new student" onClick={() => setActiveTab('students')} style={{ padding: '12px 20px', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>+ Student</button>
              <button aria-label="Open fee management" onClick={() => setActiveTab('fees')} style={{ padding: '12px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Fee</button>
            </div>
          )}

          <Suspense fallback={<div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>Loading...</div>}>
          {userRole === 'admin' && (
            <>
              {activeTab === 'overview' && (
                <TabErrorBoundary key="overview">
                  <div>
                    <p className="text-dim" style={{ color: '#94a3b8', marginBottom: '20px' }}>Welcome, Administrator. Here is the current state of the school.</p>
                    <DashboardStats refreshTrigger={refreshTrigger} onNavigate={setActiveTab} />
                    <RecentActivity refreshTrigger={refreshTrigger} />
                  </div>
                </TabErrorBoundary>
              )}
              {activeTab === 'teachers' && <TabErrorBoundary key="teachers"><AddTeacher onAdd={refreshData} showToast={showToast} /></TabErrorBoundary>}
              {activeTab === 'classes' && <TabErrorBoundary key="classes"><AddClass onAdd={refreshData} showToast={showToast} /></TabErrorBoundary>}
              {activeTab === 'students' && <TabErrorBoundary key="students"><AddStudent onAdd={refreshData} showToast={showToast} /></TabErrorBoundary>}
              {activeTab === 'import' && <TabErrorBoundary key="import"><BulkImport showToast={showToast} /></TabErrorBoundary>}
              {activeTab === 'student-list' && (
                <TabErrorBoundary key="student-list">
                  {selectedStudentProfile ? (
                    <StudentProfile student={selectedStudentProfile} onBack={() => setSelectedStudentProfile(null)} />
                  ) : (
                    <StudentList refreshTrigger={refreshTrigger} onUpdate={refreshData} onSelectStudent={setSelectedStudentProfile} showToast={showToast} />
                  )}
                </TabErrorBoundary>
              )}
              {activeTab === 'teacher-list' && <TabErrorBoundary key="teacher-list"><TeacherList refreshTrigger={refreshTrigger} onUpdate={refreshData} showToast={showToast} /></TabErrorBoundary>}
              {activeTab === 'class-list' && <TabErrorBoundary key="class-list"><ClassList refreshTrigger={refreshTrigger} onUpdate={refreshData} showToast={showToast} /></TabErrorBoundary>}
              {activeTab === 'subjects' && <TabErrorBoundary key="subjects"><SubjectList refreshTrigger={refreshTrigger} showToast={showToast} /></TabErrorBoundary>}
              {activeTab === 'assignments' && <TabErrorBoundary key="assignments"><TeacherAssignments refreshTrigger={refreshTrigger} showToast={showToast} /></TabErrorBoundary>}
              {activeTab === 'score-entry' && <TabErrorBoundary key="score-entry"><ScoreEntry showToast={showToast} /></TabErrorBoundary>}
              {activeTab === 'approval' && <TabErrorBoundary key="approval"><GradeApproval showToast={showToast} /></TabErrorBoundary>}
              {activeTab === 'reports' && <TabErrorBoundary key="reports"><ReportCards showToast={showToast} /></TabErrorBoundary>}
              {activeTab === 'fees' && <TabErrorBoundary key="fees"><FeeManagement showToast={showToast} /></TabErrorBoundary>}
              {activeTab === 'settings' && <TabErrorBoundary key="settings"><SchoolSettings showToast={showToast} /></TabErrorBoundary>}
              {activeTab === 'reset-password' && <TabErrorBoundary key="reset-password"><ResetPassword showToast={showToast} /></TabErrorBoundary>}
              {activeTab === 'announcements' && <TabErrorBoundary key="announcements"><AdminAnnouncements showToast={showToast} /></TabErrorBoundary>}
              {activeTab === 'contact-messages' && <TabErrorBoundary key="contact-messages"><ContactMessages showToast={showToast} /></TabErrorBoundary>}
              {activeTab === 'applications' && <TabErrorBoundary key="applications"><Applications showToast={showToast} /></TabErrorBoundary>}
              {activeTab === 'post-news' && <TabErrorBoundary key="post-news"><PostNews showToast={showToast} /></TabErrorBoundary>}
              {activeTab === 'manage-news' && <TabErrorBoundary key="manage-news"><ManageNews showToast={showToast} /></TabErrorBoundary>}
              {activeTab === 'promote' && <TabErrorBoundary key="promote"><ClassPromotion showToast={showToast} /></TabErrorBoundary>}
              {activeTab === 'scale' && <TabErrorBoundary key="scale"><GradeScale showToast={showToast} /></TabErrorBoundary>}
            </>
          )}

          {userRole === 'teacher' && (
            <>
              {activeTab === 'teacher-dashboard' && <TabErrorBoundary key="teacher-dashboard"><TeacherDashboard user={userInfo} teacherId={userInfo?.id} onNavigate={setActiveTab} /></TabErrorBoundary>}
              {activeTab === 'scores' && <TabErrorBoundary key="scores"><TeacherGradebook teacherId={userInfo?.id} showToast={showToast} /></TabErrorBoundary>}
              {activeTab === 'quick-attendance' && <TabErrorBoundary key="quick-attendance"><QuickAttendance teacherId={userInfo?.id} showToast={showToast} /></TabErrorBoundary>}
              {activeTab === 'roster' && <TabErrorBoundary key="roster"><ClassRoster teacherId={userInfo?.id} /></TabErrorBoundary>}
              {activeTab === 'teacher-attendance' && <TabErrorBoundary key="teacher-attendance"><AttendanceMarking teacherId={userInfo?.id} showToast={showToast} /></TabErrorBoundary>}
              {activeTab === 'homework' && <TabErrorBoundary key="homework"><HomeworkManager teacherId={userInfo?.id} showToast={showToast} /></TabErrorBoundary>}
              {activeTab === 'teacher-comms' && <TabErrorBoundary key="teacher-comms"><TeacherComms /></TabErrorBoundary>}
            </>
          )}
          </Suspense>
        </div>
      </main>

      <ConfirmModal isOpen={showLogoutConfirm} title="Confirm Logout" message="Are you sure?" confirmText="Logout" onConfirm={handleLogout} onCancel={() => setShowLogoutConfirm(false)} type="danger" />
      {showPasswordChange && <PasswordChangeModal userInfo={userInfo} userRole={userRole} onClose={() => setShowPasswordChange(false)} showToast={showToast} />}
      {reAuthMode && <ReAuthModal userRole={userRole} userInfo={userInfo} targetRole={reAuthMode} onVerified={() => { setReAuthMode(null); doSwitchPortal(reAuthMode) }} onClose={() => setReAuthMode(null)} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

export default App
