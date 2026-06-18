import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react'
import { supabase, lookupUserByAuthId } from './supabaseClient'
import Login from './components/Login'
import Sidebar from './components/Sidebar/Sidebar'
import HeaderBar from './components/Common/HeaderBar'
import Toast from './components/Toast'
import ErrorBoundary from './components/Common/ErrorBoundary'
import ConfirmModal from './components/ConfirmModal'
import PasswordChangeModal from './components/PasswordChangeModal'
import ReAuthModal from './components/ReAuthModal'
import NotFound from './components/Common/NotFound'
import './styles/admin.css'

const DashboardStats = lazy(() => import('./components/Dashboard/DashboardStats'))
const RecentActivity = lazy(() => import('./components/Dashboard/RecentActivity'))
const AddStudent = lazy(() => import('./components/Students/AddStudent'))
const StudentList = lazy(() => import('./components/Students/StudentList'))
const StudentProfile = lazy(() => import('./components/Students/StudentProfile'))
const BulkImport = lazy(() => import('./components/Students/BulkImport'))
const AddTeacher = lazy(() => import('./components/Teachers/AddTeacher'))
const TeacherList = lazy(() => import('./components/Teachers/TeacherList'))
const TeacherAssignments = lazy(() => import('./components/Teachers/TeacherAssignments'))
const AddClass = lazy(() => import('./components/Classes/AddClass'))
const ClassList = lazy(() => import('./components/Classes/ClassList'))
const SubjectList = lazy(() => import('./components/Subjects/SubjectList'))
const ScoreEntry = lazy(() => import('./components/Academics/ScoreEntry'))
const GradeApproval = lazy(() => import('./components/Academics/GradeApproval'))
const ReportCards = lazy(() => import('./components/Academics/ReportCards'))
const ClassPromotion = lazy(() => import('./components/Academics/ClassPromotion'))
const GradeScale = lazy(() => import('./components/Academics/GradeScale'))
const AttendanceMarking = lazy(() => import('./components/Academics/AttendanceMarking'))
const FeeManagement = lazy(() => import('./components/Finance/FeeManagement'))
const ContactMessages = lazy(() => import('./components/Admin/ContactMessages'))
const Applications = lazy(() => import('./components/Admin/Applications'))
const Announcements = lazy(() => import('./components/Admin/Announcements'))
const PostNews = lazy(() => import('./components/Admin/PostNews'))
const ManageNews = lazy(() => import('./components/Admin/ManageNews'))
const ResetPassword = lazy(() => import('./components/Admin/ResetPassword'))
const SchoolSettings = lazy(() => import('./components/Settings/SchoolSettings'))
const MfaSetup = lazy(() => import('./components/Settings/MfaSetup'))
const TeacherGradebook = lazy(() => import('./components/TeacherPortal/TeacherGradebook'))
const ClassRoster = lazy(() => import('./components/TeacherPortal/ClassRoster'))
import QuickAttendance from './components/TeacherPortal/QuickAttendance'
import HomeworkManager from './components/TeacherPortal/HomeworkManager'
import TeacherComms, { TeacherNotifications } from './components/TeacherPortal/TeacherComms'
import TeacherDashboard from './components/TeacherPortal/TeacherDashboard'
const ParentDashboard = lazy(() => import('./components/ParentPortal/ParentDashboard'))
const StudentPortal = lazy(() => import('./components/StudentPortal/StudentPortal'))

const SESSION_CHECK_INTERVAL = 60000

function App() {
  const [session, setSession] = useState<any>(null)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activePage, setActivePage] = useState('dashboard')
  const [activeRole, setActiveRole] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [studentProfile, setStudentProfile] = useState<any>(null)
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [showReAuth, setShowReAuth] = useState(false)
  const [reAuthDescription, setReAuthDescription] = useState('')
  const [pendingAction, setPendingAction] = useState<any>(null)
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
    contentRef.current?.focus()
  }, [activePage])

  const showToast = useCallback((msg: string, type: string = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const requireReAuth = useCallback((description: string, action: any) => {
    setReAuthDescription(description)
    setPendingAction(() => action)
    setShowReAuth(true)
  }, [])

  const handleReAuthSuccess = useCallback(() => {
    setShowReAuth(false)
    if (pendingAction) {
      pendingAction()
      setPendingAction(null)
    }
  }, [pendingAction])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }: any) => {
      setSession(s)
      if (s?.user) {
        lookupUserByAuthId(s.user.id).then((result: any) => {
          if (result?.user) {
            const raw = result.user
            const displayName = `${raw.first_name || ''} ${raw.last_name || ''}`.trim() || raw.login_id
            setUserInfo({ ...raw, role: result.role, name: displayName, loginId: raw.login_id })
            setUserRole(result.role)
          } else {
            supabase.auth.signOut()
          }
        }).catch(() => supabase.auth.signOut())
      }
    })

    const { data: { subscription } }: any = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session)
      if (session?.user) {
        lookupUserByAuthId(session.user.id).then((result: any) => {
          if (result?.user) {
            const raw = result.user
            const displayName = `${raw.first_name || ''} ${raw.last_name || ''}`.trim() || raw.login_id
            setUserInfo({ ...raw, role: result.role, name: displayName, loginId: raw.login_id })
            setUserRole(result.role)
          } else {
            supabase.auth.signOut()
          }
        }).catch(() => supabase.auth.signOut())
      } else {
        setUserInfo(null)
        setUserRole(null)
      }
    })

    return () => subscription?.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    const interval = setInterval(async () => {
      const { data: { session: current } }: any = await supabase.auth.getSession()
      if (!current) {
        setSession(null)
        setUserInfo(null)
        setUserRole(null)
        showToast('Session expired. Please login again.', 'error')
      }
    }, SESSION_CHECK_INTERVAL)
    return () => clearInterval(interval)
  }, [session, showToast])

  useEffect(() => {
    if (!session || userInfo) {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current)
      setLoadingTimeout(false)
      return
    }
    loadingTimerRef.current = setTimeout(() => setLoadingTimeout(true), 5000)
    return () => {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current)
    }
  }, [session, userInfo])

  const handleLogout = useCallback(async () => {
    setShowLogoutConfirm(false)
    await supabase.auth.signOut()
    setSession(null)
    setUserInfo(null)
    setUserRole(null)
    setActivePage('dashboard')
    setActiveRole(null)
    window.location.reload()
  }, [])

  const switchPortal = useCallback(() => {
    const currentRole = activeRole || userInfo?.role
    const newRole = currentRole === 'teacher' ? 'admin' : 'teacher'
    setUserRole(newRole)
    setActiveRole(newRole)
    setActivePage(newRole === 'teacher' ? 'teacher-dashboard' : 'dashboard')
    showToast(`Switched to ${newRole} portal`, 'success')
  }, [activeRole, userInfo, showToast])

  const refreshData = useCallback(() => setRefreshTrigger((v: number) => v + 1), [])

  const getHeaderTitle = () => {
    if (activePage === 'dashboard' || activePage === 'teacher-dashboard') return ''
    if (activePage === 'student-profile' && studentProfile) return 'Student Detailed Record'
    const titles: Record<string, string> = {
      'dashboard': 'Dashboard Overview',
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
      'attendance': 'Attendance Marking',
      'full-attendance': 'Attendance Marking',
      'comms': 'Announcements',
      'promotion': 'Class Promotion',
      'bulk-import': 'Bulk Import',
      'grade-approval': 'Grade Approval',
      'report-cards': 'Report Cards',
      'grade-scale': 'Grade Scale',
      'fees': 'Fee Management',
      'post-news': 'Post News',
      'manage-news': 'Manage News',
      'messages': 'Contact Messages',
      'applications': 'Admission Applications',
      'reset-password': 'Reset Password',
      'announcements': 'Announcements',
      'settings': 'School Settings',
      'mfa': 'MFA Setup',
    }
    return titles[activePage] || activePage.charAt(0).toUpperCase() + activePage.slice(1).replace(/-/g, ' ')
  }

  if (!session) {
    return <ErrorBoundary><Login onLogin={() => window.location.reload()} /></ErrorBoundary>
  }

  if (!userInfo) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#0f172a', color: '#94a3b8' }}>
        {loadingTimeout ? (
          <>
            <p style={{ marginBottom: '16px' }}>Could not load user data. Please try logging in again.</p>
            <button onClick={() => supabase.auth.signOut()} style={{ padding: '10px 24px', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
              Back to Login
            </button>
          </>
        ) : (
          'Loading user data...'
        )}
      </div>
    )
  }

  if (userRole === 'parent') {
    return (
      <ErrorBoundary>
        {toast && <Toast message={toast.msg} type={toast.type} />}
        <ParentDashboard userInfo={userInfo} onLogout={() => setShowLogoutConfirm(true)} />
        <ConfirmModal isOpen={showLogoutConfirm} title="Confirm Logout" message="Are you sure?" confirmText="Logout" onConfirm={handleLogout} onCancel={() => setShowLogoutConfirm(false)} type="danger" />
      </ErrorBoundary>
    )
  }

  if (userRole === 'student') {
    return (
      <ErrorBoundary>
        {toast && <Toast message={toast.msg} type={toast.type} />}
        <StudentPortal userInfo={userInfo} onLogout={() => setShowLogoutConfirm(true)} />
        <ConfirmModal isOpen={showLogoutConfirm} title="Confirm Logout" message="Are you sure?" confirmText="Logout" onConfirm={handleLogout} onCancel={() => setShowLogoutConfirm(false)} type="danger" />
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <div className="admin-layout" style={{ display: 'flex', minHeight: '100vh', background: '#0f172a', color: '#f8fafc' }}>
        <Sidebar
          userInfo={userInfo}
          role={userRole || userInfo.role}
          activePage={activePage}
          onNavigate={setActivePage}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onSwitchPortal={switchPortal}
          onLogout={() => setShowLogoutConfirm(true)}
          onPasswordChange={() => setShowPasswordChange(true)}
        />

        <main className="main-layout" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <HeaderBar
            title={getHeaderTitle()}
            userInfo={userInfo}
            onToggleSidebar={() => setSidebarOpen((v: boolean) => !v)}
            onLogout={() => setShowLogoutConfirm(true)}
            onPasswordChange={() => setShowPasswordChange(true)}
          />

          <ErrorBoundary>
            <div className="main-content" ref={contentRef} tabIndex={-1} style={{ flex: 1, padding: '30px' }}>
              {activePage === 'dashboard' && userRole === 'admin' && (
                <>
                  <div style={{
                    background: 'rgba(30, 41, 59, 0.95)',
                    borderRadius: '16px',
                    padding: '24px 30px',
                    marginBottom: '24px',
                    border: '1px solid #334155',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div>
                      <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#f8fafc' }}>Welcome, {userInfo?.name || 'Administrator'}</h1>
                      <p style={{ margin: '4px 0 0', color: '#38bdf8', fontSize: '0.85rem' }}>ID: {userInfo?.login_id || userInfo?.loginId || 'N/A'}</p>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#94a3b8' }}>
                      <div>Role: Administrator</div>
                    </div>
                  </div>

                  <div className="responsive-actions" style={{ marginBottom: '30px' }}>
                    <input type="text" aria-label="Search students, staff, or classes" placeholder="Search students, staff, or classes..."
                      style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: 'white' }}
                      onKeyDown={(e) => { if (e.key === 'Enter') setActivePage('student-list') }} />
                    <button aria-label="Add new student" onClick={() => setActivePage('students')}
                      style={{ padding: '12px 20px', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>+ Student</button>
                    <button aria-label="Open fee management" onClick={() => setActivePage('fees')}
                      style={{ padding: '12px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Fee</button>
                  </div>
                </>
              )}

              <Suspense fallback={<div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>Loading...</div>}>
                {activePage === 'dashboard' && userRole === 'admin' && (
                  <div>
                    <p style={{ color: '#94a3b8', marginBottom: '20px' }}>Welcome, Administrator. Here is the current state of the school.</p>
                    <DashboardStats refreshTrigger={refreshTrigger} onNavigate={setActivePage} showToast={showToast} />
                    <RecentActivity refreshTrigger={refreshTrigger} />
                  </div>
                )}

                {userRole === 'admin' && (
                  <>
                    {activePage === 'teachers' && <AddTeacher onAdd={refreshData} showToast={showToast} />}
                    {activePage === 'classes' && <AddClass onAdd={refreshData} showToast={showToast} />}
                    {activePage === 'students' && <AddStudent onAdd={refreshData} showToast={showToast} />}
                    {activePage === 'bulk-import' && <BulkImport showToast={showToast} />}
                    {activePage === 'student-list' && (
                      studentProfile ? (
                        <StudentProfile student={studentProfile} onBack={() => setStudentProfile(null)} />
                      ) : (
                        <StudentList refreshTrigger={refreshTrigger} onUpdate={refreshData} onStudentSelect={setStudentProfile} showToast={showToast} />
                      )
                    )}
                    {activePage === 'teacher-list' && <TeacherList refreshTrigger={refreshTrigger} showToast={showToast} />}
                    {activePage === 'class-list' && <ClassList refreshTrigger={refreshTrigger} showToast={showToast} />}
                    {activePage === 'subjects' && <SubjectList refreshTrigger={refreshTrigger} showToast={showToast} />}
                    {activePage === 'assignments' && <TeacherAssignments refreshTrigger={refreshTrigger} showToast={showToast} />}
                    {activePage === 'score-entry' && <ScoreEntry showToast={showToast} requireReAuth={requireReAuth} />}
                    {activePage === 'grade-approval' && <GradeApproval showToast={showToast} requireReAuth={requireReAuth} />}
                    {activePage === 'report-cards' && <ReportCards showToast={showToast} />}
                    {activePage === 'promotion' && <ClassPromotion showToast={showToast} requireReAuth={requireReAuth} />}
                    {activePage === 'grade-scale' && <GradeScale showToast={showToast} />}
                    {activePage === 'fees' && <FeeManagement showToast={showToast} requireReAuth={requireReAuth} />}
                    {activePage === 'attendance' && <AttendanceMarking showToast={showToast} />}
                    {activePage === 'full-attendance' && <AttendanceMarking showToast={showToast} />}
                    {activePage === 'reset-password' && <ResetPassword showToast={showToast} />}
                    {activePage === 'messages' && <ContactMessages showToast={showToast} />}
                    {activePage === 'applications' && <Applications showToast={showToast} />}
                    {activePage === 'announcements' && <Announcements showToast={showToast} />}
                    {activePage === 'post-news' && <PostNews showToast={showToast} />}
                    {activePage === 'manage-news' && <ManageNews showToast={showToast} />}
                    {activePage === 'settings' && <SchoolSettings showToast={showToast} />}
                    {activePage === 'mfa' && <MfaSetup />}
                  </>
                )}

                {userRole === 'teacher' && (
                  <>
                    {activePage === 'teacher-dashboard' && <TeacherDashboard userInfo={userInfo} onNavigate={setActivePage} onLogout={handleLogout} showToast={showToast} />}
                    {activePage === 'scores' && <TeacherGradebook teacherId={userInfo.login_id || userInfo.id} showToast={showToast} />}
                    {activePage === 'attendance' && <QuickAttendance teacherId={userInfo.login_id || userInfo.id} showToast={showToast} />}
                    {activePage === 'full-attendance' && <AttendanceMarking teacherId={userInfo.login_id || userInfo.id} showToast={showToast} />}
                    {activePage === 'roster' && <ClassRoster teacherId={userInfo.login_id || userInfo.id} showToast={showToast} />}
                    {activePage === 'homework' && <HomeworkManager teacherId={userInfo.login_id || userInfo.id} showToast={showToast} />}
                    {activePage === 'comms' && <TeacherComms />}
                    {activePage === 'notifications' && <TeacherNotifications teacherId={userInfo.login_id || userInfo.id} showToast={showToast} />}
                  </>
                )}

                {!['admin', 'teacher', 'student', 'parent'].includes(userRole || '') && (
                  <NotFound message="Unauthorized role" />
                )}
              </Suspense>
            </div>
          </ErrorBoundary>
        </main>

        <ConfirmModal isOpen={showLogoutConfirm} title="Confirm Logout" message="Are you sure?" confirmText="Logout" onConfirm={handleLogout} onCancel={() => setShowLogoutConfirm(false)} type="danger" />
        {showPasswordChange && (
          <PasswordChangeModal userInfo={userInfo} userRole={userRole!} onClose={() => setShowPasswordChange(false)} showToast={showToast} />
        )}
        {showReAuth && (
          <ReAuthModal description={reAuthDescription} onSuccess={handleReAuthSuccess} onCancel={() => { setShowReAuth(false); setPendingAction(null) }} />
        )}
        {toast && <Toast message={toast.msg} type={toast.type} />}
      </div>
    </ErrorBoundary>
  )
}

export default App
