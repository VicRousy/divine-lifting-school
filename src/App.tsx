import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { supabase } from './supabaseClient'
import { useFocusTrap } from './utils/useFocusTrap'
import { lookupUserByAuthId } from './supabaseClient'
import ReAuthModal from './components/ReAuthModal'
import Login from './components/Login'
import Sidebar from './components/Sidebar/Sidebar'
import HeaderBar from './components/Common/HeaderBar'
import AnnouncementsWidget from './components/Common/AnnouncementsWidget'
import Toast from './components/Toast'
import TeacherDashboard from './components/TeacherPortal/TeacherDashboard'
import TeacherGradebook from './components/TeacherPortal/TeacherGradebook'
import QuickAttendance from './components/TeacherPortal/QuickAttendance'
import AttendanceMarking from './components/Academics/AttendanceMarking'
import ScoreEntry from './components/Academics/ScoreEntry'
import ClassRoster from './components/TeacherPortal/ClassRoster'
import HomeworkManager from './components/TeacherPortal/HomeworkManager'
import TeacherComms from './components/TeacherPortal/TeacherComms'
import { TeacherNotifications } from './components/TeacherPortal/TeacherComms'
import StudentPortal from './components/StudentPortal/StudentPortal'
import ParentDashboard from './components/ParentPortal/ParentDashboard'
import ErrorBoundary from './components/Common/ErrorBoundary'
import NotFound from './components/Common/NotFound'
import PasswordChangeModal from './components/PasswordChangeModal'
import { useServerPagination } from './utils/useServerPagination'

const AdminPanel = lazy(() => import('./components/Admin/AdminPanel'))

const SESSION_CHECK_INTERVAL = 60000

function App() {
  const [session, setSession] = useState<any>(null)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activePage, setActivePage] = useState('dashboard')
  const [reAuthDescription, setReAuthDescription] = useState('')
  const [pendingAction, setPendingAction] = useState<any>(null)
  const [showReAuth, setShowReAuth] = useState(false)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [notificationCount, setNotificationCount] = useState(0)

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
          if (result?.userInfo) {
            setUserInfo(result.userInfo)
            setNotificationCount(result.userInfo.role === 'teacher' ? 1 : 0)
          }
        })
      }
    })

    const { data: { subscription } }: any = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session)
      if (session?.user) {
        lookupUserByAuthId(session.user.id).then((result: any) => {
          if (result?.userInfo) setUserInfo(result.userInfo)
        })
      } else {
        setUserInfo(null)
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
        showToast('Session expired. Please login again.', 'error')
      }
    }, SESSION_CHECK_INTERVAL)
    return () => clearInterval(interval)
  }, [session, showToast])

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUserInfo(null)
    setActivePage('dashboard')
    window.location.reload()
  }, [])

  if (!session) {
    return <ErrorBoundary><Login onLogin={() => window.location.reload()} /></ErrorBoundary>
  }

  if (!userInfo) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0f172a', color: '#94a3b8' }}>
        Loading user data...
      </div>
    )
  }

  const renderPage = () => {
    switch (userInfo.role) {
      case 'teacher':
        switch (activePage) {
          case 'dashboard': return <TeacherDashboard userInfo={userInfo} onLogout={handleLogout} showToast={showToast} />
          case 'gradebook': return <TeacherGradebook teacherId={userInfo.login_id || userInfo.id} showToast={showToast} />
          case 'attendance': return <QuickAttendance teacherId={userInfo.login_id || userInfo.id} showToast={showToast} />
          case 'full-attendance': return <AttendanceMarking teacherId={userInfo.login_id || userInfo.id} showToast={showToast} />
          case 'scores': return <ScoreEntry showToast={showToast} requireReAuth={requireReAuth} />
          case 'roster': return <ClassRoster teacherId={userInfo.login_id || userInfo.id} showToast={showToast} />
          case 'homework': return <HomeworkManager teacherId={userInfo.login_id || userInfo.id} showToast={showToast} />
          case 'comms': return <TeacherComms />
          case 'notifications': return <TeacherNotifications teacherId={userInfo.login_id || userInfo.id} showToast={showToast} />
          default: return <TeacherDashboard userInfo={userInfo} onLogout={handleLogout} showToast={showToast} />
        }
      case 'student':
        return <StudentPortal userInfo={userInfo} onLogout={handleLogout} />
      case 'parent':
        return <ParentDashboard userInfo={userInfo} onLogout={handleLogout} />
      case 'admin':
        return (
          <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading admin panel...</div>}>
            <AdminPanel
              activePage={activePage}
              showToast={showToast}
              requireReAuth={requireReAuth}
              refreshTrigger={refreshTrigger}
              triggerRefresh={() => setRefreshTrigger(v => v + 1)}
              studentProfile={studentProfile}
              setStudentProfile={setStudentProfile}
              setActivePage={setActivePage}
            />
          </Suspense>
        )
      default:
        return <NotFound message="Unauthorized role" />
    }
  }

  const [studentProfile, setStudentProfile] = useState<any>(null)

  return (
    <ErrorBoundary>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a' }}>
        <Sidebar
          userInfo={userInfo}
          activePage={activePage}
          onNavigate={setActivePage}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <HeaderBar
            userInfo={userInfo}
            onToggleSidebar={() => setSidebarOpen(v => !v)}
            onLogout={handleLogout}
            notificationCount={notificationCount}
            onPasswordChange={() => setShowPasswordChange(true)}
          />
          <main style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {renderPage()}
          </main>
        </div>
      </div>

      {showReAuth && (
        <ReAuthModal
          description={reAuthDescription}
          onSuccess={handleReAuthSuccess}
          onCancel={() => { setShowReAuth(false); setPendingAction(null) }}
        />
      )}

      {showPasswordChange && (
        <PasswordChangeModal
          userInfo={userInfo}
          userRole={userInfo.role}
          onClose={() => setShowPasswordChange(false)}
          showToast={showToast}
        />
      )}

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </ErrorBoundary>
  )
}

export default App
